---
title: 'Stop Tinkering With Strings: A Practical Tour of DSPy and Reflective Prompt Evolution'
description: >-
  Why Stanford's DSPy framework treats prompts as compiled artifacts, and how GEPA — the ICLR 2026 Oral — outperforms reinforcement learning with 35x fewer rollouts.
date: '2026-05-18'
updated: '2026-05-18'
tags:
  - llm
  - dspy
  - prompt optimization
  - gepa
  - stanford nlp
  - iclr 2026
number: 45
canonical_url: 'https://www.fzeba.com/posts/45-dspy-programming-llms-gepa/'
published: true
---
## Stop Tinkering With Strings: A Practical Tour of DSPy and Reflective Prompt Evolution

> *Prompt engineering is what we called it when we didn't have a better idea. DSPy is what comes after.*

## The Prompt-as-Code Argument

The default way to build with LLMs in 2024 looked like this: someone wrote a long string of natural-language instructions, glued it to a few `{{placeholder}}` variables, ran some examples, edited the string, ran again, and kept editing until the output looked acceptable. The "prompt" was the artifact; the "engineering" was the editing.

This works for prototypes. It falls apart in production for predictable reasons:

- Swap the model and the prompt breaks
- Change the metric and the prompt is suddenly wrong
- Compose two prompted modules and you have *two* sources of brittleness that interact
- Test coverage is essentially impossible; you find regressions by re-reading outputs
- The prompt grows in size and specificity until nobody on the team understands the whole thing

**DSPy** (Declarative Self-improving Python) is the Stanford NLP project that argues for treating LLM behavior as **structured code rather than strings**. The DSPy team frames it as a higher-level language for AI programming — analogous to the shift from assembly to C, or from manual pointer arithmetic to SQL. You describe *what* you want; the framework figures out *how* to ask the LM for it.

DSPy started life in February 2022 as an evolution of Stanford's earlier compound LM systems (ColBERT-QA, Baleen, Hindsight) and was first released as **DSP** in December 2022. The rename to DSPy happened in October 2023 with the publication of the core paper. Today the framework has 250+ contributors, hundreds of thousands of users, and powers production LLM systems at scale.

## The Three Core Abstractions

Every DSPy program is built from three pieces.

### Signatures

A **signature** is a typed I/O contract for an LLM call. The shortest version is a string:

```python
math = dspy.ChainOfThought("question -> answer: float")
math(question="Two dice are tossed. What is the probability the sum equals two?")
# Prediction(reasoning='...', answer=0.0277776)
```

For richer types you use a Python class:

```python
class Classify(dspy.Signature):
    """Classify sentiment of a given sentence."""
    sentence: str = dspy.InputField()
    sentiment: Literal["positive", "negative", "neutral"] = dspy.OutputField()
    toxicity: float = dspy.OutputField()
```

A signature is **interface, not implementation** — it says what goes in and out, but says nothing about how to ask the model.

### Modules

A **module** is a strategy for invoking the LM against a signature:

- **`dspy.Predict`** — direct call
- **`dspy.ChainOfThought`** — adds an internal `reasoning` field for step-by-step thinking
- **`dspy.ReAct`** — agent loop with tool calls (a la the ReAct paper)
- **`dspy.ProgramOfThought`** — generates Python code as part of reasoning
- **`dspy.CodeAct`** — code execution as a primitive
- **`dspy.MultiChainComparison`** — generates multiple chains and compares them
- **`dspy.BestOfN`**, **`dspy.Refine`** — output refinement strategies

Modules are composable. The article-writing tutorial shows how to nest two `ChainOfThought` modules — one to plan an outline, one to draft each section — into a single `DraftArticle` class that you can call with one line. The composition is in Python, not in YAML or in a string.

### Adapters

An **adapter** maps a signature to the actual prompt sent to the model: `ChatAdapter` (default), `JSONAdapter`, `XMLAdapter`, `TwoStepAdapter`. Most users never touch adapters directly — but they're the swappable layer that lets DSPy support function-calling, structured outputs, and JSON modes uniformly across providers.

## The Optimizer Layer

This is where DSPy moves from "nice abstraction" to "categorically different programming model."

Given a DSPy program, a **metric**, and a small **trainset** of representative inputs (sometimes with ground truth), DSPy can **compile** the program — automatically generating better prompts, better few-shot examples, or even fine-tuned weights.

Different optimizers attack different parts of the problem:

- **`BootstrapFewShot`** / **`BootstrapRS`** — synthesize good few-shot examples by running the program many times and keeping the traces that scored well under the metric
- **`MIPROv2`** — *Multiprompt Instruction Proposal Optimizer v2*: bootstraps, drafts candidate instructions, then runs a Bayesian discrete search over (instruction × demonstration) combinations
- **`COPRO`** — coordinate-ascent prompt optimization
- **`BootstrapFinetune`** — generates synthetic training data and *fine-tunes the model weights*
- **`KNN`** / **`KNNFewShot`** / **`LabeledFewShot`** — simpler retrieval-based strategies
- **`SIMBA`** — stochastic introspection-based modular alignment
- **`Ensemble`** — combine top-k optimized programs
- **`BetterTogether`** — composes prompt optimization with weight fine-tuning
- **`InferRules`** — extract symbolic rules from program behavior

These optimizers are themselves composable. You can run MIPROv2, then feed the output into BootstrapFinetune, then ensemble five candidates. The DSPy team calls this *systematically scaling pre-inference compute* — analogous to how RL practitioners scale inference-time compute, except you're spending it once at compile time and amortizing across all subsequent calls.

The reported gains are real. On HotpotQA with a ReAct agent, MIPROv2 lifts GPT-4o-mini from 24% to 51% in roughly $2 of API spend and 20 minutes wall-clock time. On Banking77 classification, BootstrapFinetune takes the same model from 66% to 87%.

## GEPA: The 2026 Breakthrough

The most important DSPy development of 2025–2026 is **GEPA** — *Genetic-Pareto* — introduced in *"GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning"* by Agrawal et al. (arXiv:2507.19457), accepted as an **oral presentation at ICLR 2026**.

GEPA challenges a foundational assumption of current LLM optimization: that scalar rewards are the right learning signal. Reinforcement learning approaches like GRPO (Group Relative Policy Optimization) require thousands of rollouts to learn a new task, because each rollout collapses rich behavior into a single number.

GEPA argues that **natural language is a richer learning medium than scalar rewards** for an LLM. Instead of giving the optimizer a number, GEPA gives it a *trace* — the full execution path of the DSPy program, including reasoning, tool calls, and tool outputs — and asks an LLM to reflect on what went wrong, in natural language. Those reflections become the basis for proposing better prompts.

Three innovations stack:

1. **Reflective Prompt Mutation** — an LLM reads the trace and proposes a targeted prompt change based on diagnosed failure modes
2. **Pareto-based Evolution** — instead of collapsing to a single "best" prompt, GEPA maintains a Pareto frontier of candidates that are best on different sub-aspects of the task
3. **Genetic Evolution** — mutate or merge candidates; intelligent selection drives exploration

The results are striking:

- **+13% aggregate gain over MIPROv2** across six tasks (compared to MIPROv2's +5.6% over baseline)
- **+20% gain over GRPO** (the state-of-the-art RL approach) on some tasks
- **35× fewer rollouts** than RL — sample efficiency is the dramatic story
- Works with **as few as 10 examples and 20–100 evaluations**

GEPA is integrated into DSPy as `dspy.GEPA` and is also available as a standalone library (`pip install gepa`). The DSPy team has published tutorials applying GEPA to AIME math problems, structured information extraction for enterprise tasks, privacy-conscious delegation (the PAPILLON benchmark), and AI-control problems like code backdoor detection.

## Models, Providers, and Portability

DSPy uses **LiteLLM** under the hood, which means any of the dozens of LiteLLM-supported providers work out of the box:

```python
import dspy

# OpenAI
lm = dspy.LM("openai/gpt-5-mini", api_key="...")

# Anthropic
lm = dspy.LM("anthropic/claude-sonnet-4-5-20250929", api_key="...")

# Gemini
lm = dspy.LM("gemini/gemini-2.5-flash", api_key="...")

# Databricks
lm = dspy.LM("databricks/databricks-llama-4-maverick", api_key="...", api_base="...")

# Local via Ollama
lm = dspy.LM("ollama_chat/llama3.2:1b", api_base="http://localhost:11434")

# Local via SGLang as OpenAI-compatible endpoint
lm = dspy.LM("openai/meta-llama/Llama-3.1-8B-Instruct",
             api_base="http://localhost:7501/v1", api_key="local")

dspy.configure(lm=lm)
```

Portability is the practical payoff of the prompt-as-code thesis. The same DSPy program runs on every supported provider; the same optimization run can be re-executed against a different model and produces a model-specific compiled version of the program.

## What Has Been Built With DSPy

The DSPy community has produced a substantial body of downstream research and open-source projects:

- **STORM** — Stanford's open-domain Wikipedia-article writer
- **PAPILLON** — privacy-conscious LLM delegation
- **IReRa** — extreme classification with retrieval
- **DSPy Assertions** — runtime constraints on LM outputs
- **LeReT** — local rewriting techniques
- **PATH** — academic paper analysis
- **WangLab @ MEDIQA** — medical QA
- **Haize's Red-Teaming Program** — adversarial prompt search

Production deployments include enterprise RAG systems, customer-service agents, classification pipelines, and code-generation tooling. The DSPy team maintains a "Use Cases" page and a "Built with DSPy" gallery for community-contributed work.

## Tools, Deployment, and Operations

DSPy is no longer just an optimization framework — it's becoming an end-to-end platform:

- **MCP support** — DSPy can consume tools from Model Context Protocol servers, making it interoperable with the Claude/Anthropic toolchain ecosystem
- **Streaming** — token-level and structured streaming for interactive UIs
- **Caching** — file-system and in-memory caches with configurable invalidation
- **Async** — `streamify` and `asyncify` utilities for production async stacks
- **Observability** — integration with MLflow for tracking optimizer runs
- **Saving and loading** — compiled programs serialize to JSON for deployment
- **Deployment** — recipes for production hosting

The framework is in active development. The team has announced a **typed `BaseLM` migration** for DSPy 3.3–3.6/4.0, normalizing the LM API surface.

## When DSPy Pays Off (And When It Doesn't)

DSPy pays off when:

- You have **more than one LLM call** in your program
- You can define a **measurable metric** (exact match, F1, semantic similarity, LLM-as-judge)
- You have **at least ~50 representative inputs** (more is better)
- You expect to **swap models** or **iterate on the system** over time

DSPy is overkill when:

- You're writing a single one-shot prompt for a one-time task
- You have no metric and no examples — DSPy gives you abstraction but optimization needs data
- The task is trivial enough that a hand-tuned prompt is faster to write than the DSPy module

## Getting Started

```bash
pip install -U dspy
```

Configure an LM, write a signature, compose a module, and call it. From there, the natural progression is: write a metric, gather a small trainset, run a `MIPROv2` optimization, then experiment with GEPA when you want better sample efficiency.

The official documentation is at https://dspy.ai/ with full API reference, tutorials, and community resources. The Discord (`XCGy2WDCQB`) is active.

## The Bigger Argument

What DSPy is really arguing is that **the rate of progress in LLM applications has been bottlenecked by the prompt-engineering workflow itself**. By treating prompts as compiled artifacts rather than authored strings, DSPy makes it possible to:

- iterate on system design without re-tinkering with strings
- maintain quality across model upgrades automatically
- compose modules without the prompts interfering with each other
- attach measurements and tests to LLM behavior
- *systematically* incorporate optimizer research as it appears (MIPROv2, GEPA, whatever comes next)

If that argument is correct, the prompt-tinkering era is winding down. The DSPy approach — declarative modules, swappable models, automated optimization — is what comes after.

---

## Sources

- DSPy official documentation — https://dspy.ai/
- DSPy GitHub repository — https://github.com/stanfordnlp/dspy
- Khattab et al. *"DSPy: Compiling Declarative Language Model Calls into Self-Improving Pipelines"* (2023) — https://arxiv.org/abs/2310.03714
- Agrawal et al. *"GEPA: Reflective Prompt Evolution Can Outperform Reinforcement Learning"*, ICLR 2026 Oral — https://arxiv.org/abs/2507.19457
- Opsahl-Ong et al. *"MIPROv2"* (2024) — https://arxiv.org/abs/2406.11695
- Soylu et al. *"BetterTogether"* (2024) — https://arxiv.org/abs/2407.10930
- DSP foundational paper — https://arxiv.org/abs/2212.14024
- ColBERT-QA — https://arxiv.org/abs/2007.00814
- DSPy GEPA tutorial — https://dspy.ai/tutorials/gepa_ai_program/
- DSPy GEPA optimizer reference — https://dspy.ai/api/optimizers/GEPA/overview/
- GEPA standalone library — https://github.com/gepa-ai/gepa
- BAIR blog: *"Compound AI Systems"* — https://bair.berkeley.edu/blog/2024/02/18/compound-ai-systems/
- LiteLLM (LLM provider abstraction layer) — https://github.com/BerriAI/litellm
- Morph LLM: *"GEPA Prompt Optimization"* — https://www.morphllm.com/gepa-prompt-optimization
- Shashi Jagtap: *"GEPA: The Game-Changing DSPy Optimizer for Agentic AI"* — https://medium.com/superagentic-ai/gepa-the-game-changing-dspy-optimizer-for-agentic-ai-bfc1da20383a
