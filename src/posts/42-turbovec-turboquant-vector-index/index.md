---
title: 'Eight Megabytes per Million Vectors: How turbovec Builds on TurboQuant to Beat FAISS'
description: >-
  A walkthrough of turbovec, a Rust + Python vector index built on Google Research's TurboQuant algorithm — 16x compression, faster than FAISS, no codebook training.
date: '2026-05-01'
updated: '2026-05-01'
tags:
  - vector search
  - rag
  - quantization
  - rust
  - embeddings
  - faiss
number: 42
canonical_url: 'https://www.fzeba.com/posts/turbovec-turboquant-vector-index/'
published: true
---
## Eight Megabytes per Million Vectors: How turbovec Builds on TurboQuant to Beat FAISS

> *A 10-million-document corpus takes 31 GB as float32. `turbovec` puts it in 4 GB — and searches it faster than FAISS.*

## The Compression Problem Every RAG System Hits

Every retrieval-augmented system reaches the same wall. You generate embeddings — typically 768, 1536, or 3072 floats per document — store them in float32 (four bytes per coordinate), and discover that ten million documents costs you tens of gigabytes of RAM just to *hold* the vectors. Search latency, indexing memory, and infrastructure cost all balloon at the same time.

The standard answer is **vector quantization**: compress each vector into a much smaller byte representation that supports approximate distance scoring. FAISS — Facebook AI's vector search library — has been the de-facto baseline for nearly a decade, primarily through Product Quantization (PQ) and its IndexPQFastScan variant.

In 2025, Google Research published a new algorithm — **TurboQuant** — that changed the math. In late 2025, Ryan Codrai released **`turbovec`**, a Rust implementation with Python bindings that wraps TurboQuant in a production-grade vector index. As of writing, the project has 946 GitHub stars, MIT-licensed, and ships with hand-written SIMD kernels for both ARM NEON and x86 AVX-512BW.

## The TurboQuant Algorithm in Five Lines

TurboQuant was introduced by Zandieh, Daliri, Hadian, and Mirrokni (Google Research) in *"TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate"* (arXiv:2504.19874), accepted as an oral at ICLR 2026. The algorithm is striking for its simplicity:

1. **Normalize** every vector to unit length, storing the original norm as a single float.
2. **Apply a shared random orthogonal rotation** (e.g., a randomized Hadamard matrix) to every vector in the dataset.
3. After rotation, each coordinate of every vector follows a **known distribution** — a shifted/scaled Beta distribution that converges to N(0, 1/d) in high dimensions. This holds regardless of the input data.
4. Apply a **precomputed Lloyd-Max scalar quantizer** to each coordinate (4 buckets at 2-bit, 16 at 4-bit). The bucket boundaries are derived analytically from the known distribution — *they are not learned from data*.
5. **Bit-pack** the quantized indices. A 1536-d FP32 vector (6,144 bytes) becomes 384 bytes at 2-bit — a 16× compression ratio.

This is the entire algorithm. There is **no codebook training**, **no calibration set**, **no per-dataset rebuild**. Quoting the paper: the random rotation transforms an arbitrary unit vector into one whose coordinates are nearly i.i.d. from a known Beta distribution, enabling closed-form optimal quantization. The TurboQuant paper proves that this achieves distortion **within a factor of approximately 2.7 of the Shannon rate-distortion lower bound** — for a data-oblivious algorithm, this is essentially optimal.

There are two TurboQuant variants in the paper: **TurboQuant-MSE** (the literal recipe above, optimized for mean-squared error) and **TurboQuant-PROD** (adds a 1-bit Quantized Johnson-Lindenstrauss residual for unbiased inner-product estimation). `turbovec` implements the MSE variant, which is what most vector indexes need because MSE composes symmetrically for pairwise scoring during HNSW graph construction.

## Why Random Rotation Is The Trick

The reason TurboQuant works so well is the *removal of outliers* through rotation. Naive scalar quantization of raw embeddings is bad because the coordinate distributions are heavy-tailed, contain massive activations, and vary wildly between dimensions. Quantizers tuned for one distribution fail on another, and outliers eat several bits of dynamic range each.

A random orthogonal rotation is **isometric** — it preserves all distances and inner products — but it scrambles the basis. After rotation, *every coordinate* has the same predictable distribution. There is no longer such a thing as an outlier dimension. You can precompute one Lloyd-Max codebook for the standard Beta/Gaussian distribution, and it works for every model, every dataset, every dimensionality. This is what makes it *data-oblivious*.

The rotation is orthogonal, so dot products are preserved. The query, at search time, is rotated by the same matrix once, then scored directly against the bit-packed codes using a lookup table — no decompression is needed.

## `turbovec`'s Engineering: Where the Wins Are

A good algorithm is necessary but not sufficient — `turbovec`'s benchmarks vs FAISS come from careful kernel work. The codebase is roughly 55% Rust, 45% Python. The Rust core implements:

- **NEON kernels** for ARM (Apple Silicon and AWS Graviton)
- **AVX-512BW kernels** for x86 (Sapphire Rapids and later), with **AVX2 fallback** for older hardware
- **Nibble-split lookup tables** with `u16` accumulators — borrowing the pack layout and accumulation strategy from FAISS's FastScan
- **Runtime CPU feature detection** via `is_x86_feature_detected!`, so a single binary runs the AVX-512 path on capable hardware and the AVX2 path elsewhere
- All x86_64 builds target `x86-64-v3` (AVX2 baseline, Haswell 2013+)

The result, on 100k vectors / 1k queries / k=64 / median of 5 runs:

- **ARM (Apple M3 Max)**: TurboQuant beats FAISS FastScan by 12–20% across every config (single- and multi-threaded)
- **x86 (Intel Xeon Platinum 8481C, 8 vCPUs)**: TurboQuant wins every 4-bit config by 1–6%, ties FAISS on 2-bit single-threaded, trails by 2–4% only on 2-bit multi-threaded `d=1536`/`d=3072` (where the inner accumulate loop is too short to amortize unrolling against FAISS's AVX-512 VBMI path)

Recall is comparable. On OpenAI `d=1536` and `d=3072`, TurboQuant and FAISS `IndexPQ` (LUT256, nbits=8) are within 0–1 point at R@1 and both converge to 1.0 by k=4–8. On GloVe `d=200` — a regime where the asymptotic Beta assumption is looser — TurboQuant trails FAISS by 3–6 points at R@1, closing by k≈16–32. This is honest engineering: the README explicitly notes that FAISS `IndexPQ` is a *stronger* baseline than the custom u8-LUT PQ in the TurboQuant paper, because FAISS uses a higher-precision LUT at scoring time and k-means++ for codebook training.

## The API

`turbovec` exposes two index types via both Python and Rust bindings.

**`TurboQuantIndex`** is the simple form — vectors get sequential integer IDs.

```python
from turbovec import TurboQuantIndex

index = TurboQuantIndex(dim=1536, bit_width=4)
index.add(vectors)
index.add(more_vectors)
scores, indices = index.search(query, k=10)

index.write("my_index.tq")
loaded = TurboQuantIndex.load("my_index.tq")
```

**`IdMapIndex`** is for production use cases where you need stable external IDs that survive deletes:

```python
import numpy as np
from turbovec import IdMapIndex

index = IdMapIndex(dim=1536, bit_width=4)
index.add_with_ids(vectors, np.array([1001, 1002, 1003], dtype=np.uint64))
scores, ids = index.search(query, k=10)
index.remove(1002)   # O(1) by id
```

The Rust API is essentially identical. The crate is available on `crates.io` and the Python package on PyPI.

## Framework Integrations

`turbovec` ships with optional extras for the three big retrieval frameworks:

- **LangChain** — `pip install turbovec[langchain]`
- **LlamaIndex** — `pip install turbovec[llama-index]`
- **Haystack** — `pip install turbovec[haystack]`

This positions it as a drop-in replacement for FAISS in existing RAG pipelines, with the privacy story being a major selling point: the README emphasizes "pure local — no managed service, no data leaving your machine or VPC."

## Where TurboQuant Fits in the Broader Landscape

TurboQuant is part of a 2025–2026 wave of rotation-based quantizers. Related work includes:

- **PolarQuant** — converts to polar coordinates recursively; TurboQuant deliberately avoids this because recursive polar transforms couple coordinates through sin/cos and compound errors through deep models
- **QuIP** (Chee et al., 2024) — uses orthogonal rotation for *weight* quantization rather than KV cache or embeddings
- **QJL** (Zandieh et al.) — the 1-bit Quantized Johnson-Lindenstrauss transform that TurboQuant-PROD composes with

The original TurboQuant paper was framed primarily for **LLM KV-cache compression** (5× compression with near-zero quality loss; 3.5-bit matches FP16 on LongBench), and there are now multiple independent implementations including `OnlyTerp/turboquant` (focused on KV cache) and Qdrant's production integration (focused on vector search). `turbovec` sits squarely in the vector-search camp.

For Qdrant users specifically: Qdrant integrated TurboQuant-MSE in 2026 with similar reasoning — the codebook lookup composes symmetrically, which is critical for HNSW graph construction (you need symmetric scoring between any two stored vectors, not just query-vs-storage).

## Building From Source

The repository expects a Rust toolchain (`cargo`) and `maturin` for the Python build:

```
pip install maturin
cd turbovec-python
maturin build --release
pip install target/wheels/*.whl
```

Pure-Rust users just need `cargo add turbovec` and `cargo build --release`.

## Why You Should Care

`turbovec` represents an interesting convergence:

1. A **theoretically optimal**, **training-free** quantizer — TurboQuant
2. A **production-grade Rust implementation** with hand-tuned SIMD
3. **Drop-in framework integrations** for the dominant RAG stacks
4. **Open source, MIT licensed**, runs entirely locally

For privacy-sensitive RAG (legal, healthcare, government, defense), the combination of "no managed service" plus "16× compression" plus "faster than FAISS" is qualitatively different from what was available six months ago. For high-scale public RAG, the memory savings translate directly to lower hosting costs.

The bar is moving. If you're building anything that pairs embeddings with retrieval, `turbovec` belongs on your benchmark list.

---

## Sources

- `turbovec` GitHub repository — https://github.com/RyanCodrai/turbovec
- `turbovec` on PyPI — https://pypi.org/project/turbovec/
- `turbovec` on crates.io — https://crates.io/crates/turbovec
- Zandieh, Daliri, Hadian, Mirrokni. *"TurboQuant: Online Vector Quantization with Near-optimal Distortion Rate"*, ICLR 2026 — https://arxiv.org/abs/2504.19874
- TurboQuant OpenReview PDF — https://openreview.net/pdf/6593f484501e295cdbe7efcbc46d7f20fc7e741f.pdf
- Qdrant: *"TurboQuant in Qdrant"* — https://qdrant.tech/articles/turboquant-quantization/
- Dejan AI: *"TurboQuant: From Paper to Triton Kernel in One Session"* — https://dejan.ai/blog/turboquant/
- Sesen AI: *"TurboQuant: How a Random Rotation Makes LLM Quantization Near-Optimal"* — https://sesen.ai/blog/turboquant-vector-quantization-random-rotations
- TurboQuant Wikipedia entry — https://en.wikipedia.org/wiki/TurboQuant
- `OnlyTerp/turboquant` (KV-cache reference implementation) — https://github.com/OnlyTerp/turboquant
- FAISS Fast accumulation of PQ and AQ codes — https://github.com/facebookresearch/faiss/wiki/Fast-accumulation-of-PQ-and-AQ-codes-(FastScan)
- Chee et al. *"QuIP: 2-Bit Quantization of Large Language Models With Guarantees"* (2024)
- Lloyd. *"Least Squares Quantization in PCM"* (1982) — the Lloyd-Max algorithm
