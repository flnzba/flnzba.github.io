---
title: 'Multi-Agent Pipelines for Academic Figures: The PaperBanana Open-Source Implementation'
description: >-
  A technical deep dive into PaperBanana, an open-source agentic pipeline that generates publication-quality methodology diagrams and statistical plots from text.
date: '2026-05-23'
updated: '2026-05-23'
tags:
  - ai agents
  - academic research
  - vlm
  - image generation
  - open source
number: 61
canonical_url: 'https://www.fzeba.com/posts/61-paperbanana-academic-figure-generation/'
published: true
---
## Multi-Agent Pipelines for Academic Figures: The PaperBanana Open-Source Implementation

> *Every research paper needs diagrams. Most researchers can't draw. PaperBanana turns methodology text into NeurIPS-style figures through a chain of specialized AI agents.*

## The Figure Bottleneck

Look at any modern AI/ML paper and roughly half of its communicative load lives in the figures. The methodology diagram explains the architecture. The plots show the results. The intuition figure on page 2 carries the headline insight. Together they determine whether reviewers understand the paper — and whether anyone reads past the abstract.

Yet figure creation is one of the least-supported parts of the research workflow. Most labs cobble together a mix of TikZ, Keynote, Figma, draw.io, matplotlib, and Inkscape — bespoke tools, hand-wired, with no path from "draft of methodology section" to "publication-ready diagram." A graduate student typically spends 10–30 hours per figure, and the iteration loop is painful.

In late 2025, Google Research published *"PaperBanana: Automating Academic Illustration for AI Scientists"* (arXiv:2601.23265) by Zhu, Meng, Song, Wei, Li, Pfister, and Yoon — a multi-agent pipeline that turns text descriptions into publication-quality methodology diagrams and statistical plots. The official system was never released as code. Several community implementations have since appeared.

**This article focuses on `llmsresearch/paperbanana`** — the most actively maintained open-source community implementation, an unofficial Python reimplementation with 1,400+ GitHub stars, MIT-licensed. It is explicitly *not affiliated with* Google Research or the original authors, but provides the most complete reproduction of the paper's pipeline available publicly today.

## The Two-Phase, Seven-Agent Pipeline

PaperBanana operates as a multi-agent system. Different specialized agents handle different sub-tasks, with explicit handoffs between them. The pipeline has up to seven agents organized into two phases (plus an optional input optimization phase).

### Phase 0 — Input Optimization (Optional)

When `--optimize` is enabled, two parallel agents preprocess the input:

- **Context Enricher** — takes raw methodology text and structures it into a diagram-friendly format: components, flows, groupings, inputs, outputs
- **Caption Sharpener** — takes a vague caption ("our framework") and turns it into a precise visual specification ("Overview of our encoder-decoder architecture with sparse routing, showing data flow from input tokens through the routing layer to the decoder")

These run in parallel because they don't depend on each other, and they cost one VLM round-trip each.

### Phase 1 — Linear Planning

Three agents run sequentially to produce a textual specification of the target diagram:

1. **Retriever** — selects the most relevant reference examples from a curated set of 13 methodology diagrams spanning four domains: agent/reasoning, vision/perception, generative/learning, and science/applications. This is *in-context learning by example* — the retrieved diagrams guide the planner toward similar visual conventions.
2. **Planner** — generates a detailed textual description of the target diagram, conditioned on the retrieved examples and the (optionally enriched) input.
3. **Stylist** — refines the description for visual aesthetics using NeurIPS-style guidelines: color palette, layout, typography, spacing, label placement.

By the end of Phase 1, you have a rich textual blueprint of what the diagram should look like — but no image yet.

### Phase 2 — Iterative Refinement

Two agents now work in a feedback loop:

4. **Visualizer** — renders the textual description into an actual image using an image-generation model
5. **Critic** — evaluates the generated image against the source context, identifies issues, and proposes a revised description

Steps 4–5 repeat for a fixed number of iterations (default: 3), or until the critic is satisfied if you pass `--auto` mode (with `--max-iterations` as a safety cap, default 30).

The whole pipeline is structured around *language-mediated reflection*: the critic produces natural-language critique that becomes the basis for the next visualizer call. This is a similar pattern to what GEPA does for DSPy prompt optimization — language is the learning medium, not scalar reward.

## Provider Flexibility

PaperBanana supports three vision-language model providers and three image-generation providers, all swappable independently:

| Component | Provider | Default Model |
|-----------|----------|---------------|
| VLM (planning, critique) | OpenAI | `gpt-5.2` |
| Image generation | OpenAI | `gpt-image-1.5` |
| VLM | Google Gemini | `gemini-2.0-flash` (free tier) |
| Image generation | Google Gemini | `gemini-3-pro-image-preview` (free tier) |
| VLM / Image | OpenRouter | any supported model |

Azure OpenAI and Foundry endpoints are auto-detected via `OPENAI_BASE_URL`. Gemini-compatible gateways work via `GOOGLE_BASE_URL`. This matters because image generation quality varies sharply across providers and rapidly evolves — being able to swap providers without changing the pipeline is operationally valuable.

The free-tier Gemini support is a nice touch for academic users without commercial API budgets.

## Multiple Surfaces: CLI, Python, Web, and MCP

PaperBanana ships four interfaces:

**The CLI** is the primary interface, with eight commands:

- `paperbanana generate` — methodology diagrams from text or PDF input
- `paperbanana plot` — statistical plots from CSV/JSON data
- `paperbanana batch` — many diagrams from a YAML/JSON manifest
- `paperbanana plot-batch` — many plots from a manifest
- `paperbanana orchestrate` — full-paper figure package (parses paper, plans multiple figures, runs them all, produces `figures.tex` and `captions.md`)
- `paperbanana composite` — stitch multiple panels into a labeled multi-panel figure with `(a)`, `(b)`, `(c)` labels
- `paperbanana evaluate` — VLM-as-Judge quality assessment against a human reference
- `paperbanana studio` — local Gradio web UI

**The Python API** wraps the same pipeline:

```python
from paperbanana import PaperBananaPipeline, GenerationInput, DiagramType
from paperbanana.core.config import Settings

settings = Settings(
    vlm_provider="openai",
    vlm_model="gpt-5.2",
    image_provider="openai_imagen",
    optimize_inputs=True,
    auto_refine=True,
)

pipeline = PaperBananaPipeline(settings=settings)
result = await pipeline.generate(GenerationInput(
    source_context="Our framework consists of...",
    communicative_intent="Overview of the proposed method.",
    diagram_type=DiagramType.METHODOLOGY,
))
```

It supports progress callbacks via `PipelineProgressEvent` so UIs can show per-stage timing without monkey-patching agents.

**The MCP server** exposes four tools (`generate_diagram`, `generate_plot`, `evaluate_diagram`, `evaluate_plot`) for use inside Claude Code, Cursor, or any MCP-compatible client. The standard `uvx`-based setup is one config block in `~/.claude/mcp.json`:

```json
{
  "mcpServers": {
    "paperbanana": {
      "command": "uvx",
      "args": ["--from", "paperbanana[mcp]", "paperbanana-mcp"],
      "env": { "GOOGLE_API_KEY": "..." }
    }
  }
}
```

**Claude Code skills** ship as three `/generate-diagram`, `/generate-plot`, `/evaluate-diagram` commands invocable directly from the Claude Code terminal.

## Evaluation: VLM-as-Judge on Four Dimensions

The `evaluate` command runs a VLM-as-Judge comparison between a generated diagram and a human reference, scoring on four dimensions taken from the original paper:

- **Faithfulness** (primary) — does the diagram accurately represent the method?
- **Readability** (primary) — can a reader parse it?
- **Conciseness** (secondary) — is information presented without clutter?
- **Aesthetics** (secondary) — does it meet publication-quality visual standards?

Primary metrics are weighted more heavily than secondary in aggregation. This is essentially the same hierarchical metric system used in human reviewer rubrics.

## Batch Generation and Composite Figures

For papers that need multiple figures, the batch system runs the full pipeline over a manifest file:

```yaml
composite:
  layout: "1x3"
  labels: auto
  spacing: 20
  label_position: bottom
  output: "composite.png"

items:
  - input: method_encoder.txt
    caption: "Encoder architecture"
    id: panel_a
  - input: method_decoder.txt
    caption: "Decoder architecture"
    id: panel_b
  - input: method_routing.txt
    caption: "Sparse routing"
    id: panel_c
```

After all panels generate, the composite section automatically stitches them into a single labeled multi-panel figure — exactly the kind of `(a) (b) (c)` figure that papers use for showing variants or sub-systems side by side.

The `orchestrate` command goes one level further: point it at a PDF of your whole paper, and it parses the structure, plans multiple methodology figures, optionally discovers CSV/JSON files for plots, runs everything, and produces a complete `figure_package/` directory with `figures/`, `figures.tex`, and `captions.md`. For a final figure-revision pass before submission, this is a credible attempt at end-to-end automation.

## What Makes It "PaperBanana" — and What Doesn't

The original Google Research paper introduced the multi-agent pipeline, the four evaluation dimensions, the iterative critic-refine loop, and the use of in-context learning from a small reference set. The `llmsresearch/paperbanana` repository reproduces all of these, expands the CLI surface significantly, adds the MCP server and Claude Code integration, supports PDF inputs, ships Studio web UI, and adds a parameter-sweep tool (`paperbanana sweep`) for trying different settings.

What the open-source implementation explicitly *cannot guarantee* is bit-identical behavior to whatever Google's internal system does. Image generation quality depends on the underlying model (and Google likely uses internal models not exposed publicly). Some prompts and reference examples may differ. The README is clear about this: "This implementation may differ from the original system described in the paper. Use at your own discretion."

## The Broader Context: AI for Scientific Communication

PaperBanana sits in a small but growing ecosystem of AI tools for academic communication:

- **Galactica** (Meta, 2022) — withdrawn, but a precursor to LLMs for scientific text
- **Elicit, Scite, Consensus** — literature search and synthesis
- **Semantic Scholar TLDR, Galileo** — abstracting and summarization
- **GPTZero, Turnitin, Originality.ai** — AI-text detection
- **Manim** — programmatic mathematical animation
- **TikZJax, Mermaid AI** — diagram-as-code generation

PaperBanana is unusual in attacking the *figure* problem specifically, with a multi-agent design rather than a single prompt-and-generate call. The closest comparable system is probably **AutoFig** (research only, not released) and the various LangChain-based "scientific figure" prototypes that have appeared on GitHub.

For research labs investing in their figure quality and iteration speed, PaperBanana is a real option — particularly when combined with the free Gemini tier for cost-controlled experimentation.

## Installation

```bash
pip install paperbanana
# Or for full features
pip install 'paperbanana[mcp,studio,pdf]'

# Set API keys in .env
echo "OPENAI_API_KEY=your-key" >> .env
# Or use the wizard
paperbanana setup

# Generate
paperbanana generate \
  --input my_method.txt \
  --caption "Overview of our framework" \
  --optimize --auto
```

Python 3.10+ is required. The optional extras pull in PyMuPDF (for PDF input), Gradio (for Studio), or MCP libraries (for IDE integration).

## What to Expect

This is research-grade tooling. The output is good — sometimes very good — but it is not a replacement for a human designer for final publication artwork. The realistic use case is:

- **First draft** — auto-generate a methodology diagram from a paragraph of methodology text
- **Variant exploration** — try `paperbanana sweep` with different providers, iteration counts, and styles to find a candidate you like
- **Iterative refinement** — use `--continue --feedback "make the arrows thicker"` to push the existing run in a specific direction
- **Final polish** — export to PNG/SVG, then open in Figma/Inkscape for the last 10% of human polish

For groups producing many figures across many papers, the batch and orchestrate commands amortize that workflow across an entire paper at once.

## Caveat Emptor

PaperBanana is an *unofficial* implementation. Production users should:

- Pin specific dependency versions
- Test against your specific provider keys before relying on the pipeline
- Read the LICENSE (MIT) carefully if redistributing
- Cite the original Google Research paper, not the implementation, in academic work

The disclaimer in the repository README is explicit on all of these points.

---

## Sources

- `llmsresearch/paperbanana` GitHub repository — https://github.com/llmsresearch/paperbanana
- PaperBanana on PyPI — https://pypi.org/project/paperbanana/
- PaperBanana Hugging Face demo space — https://huggingface.co/spaces/llmsresearch/paperbanana
- Zhu, Meng, Song, Wei, Li, Pfister, Yoon. *"PaperBanana: Automating Academic Illustration for AI Scientists"*, arXiv:2601.23265, 2026 — https://arxiv.org/abs/2601.23265
- MCP server documentation — https://github.com/llmsresearch/paperbanana/blob/main/mcp_server/README.md
- Pydantic v2 documentation (used for typed config) — https://pydantic.dev
- Typer CLI framework — https://typer.tiangolo.com
- Google AI Studio (Gemini free tier) — https://ai.google.dev/
- Model Context Protocol specification — https://modelcontextprotocol.io/
- Claude Code (MCP-compatible IDE) — https://www.anthropic.com/claude-code
