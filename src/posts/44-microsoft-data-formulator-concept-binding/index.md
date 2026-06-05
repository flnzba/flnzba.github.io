---
title: 'Beyond Tidy Data: How Microsoft Data Formulator Lets AI Reshape Your Way to a Chart'
description: >-
  Exploring Microsoft Research's Data Formulator, the concept-binding paradigm, and how its AI agents remove the tidy-data tax from visualization authoring.
date: '2026-05-13'
updated: '2026-05-13'
tags:
  - data visualization
  - ai
  - microsoft research
  - llm
  - duckdb
number: 44
canonical_url: 'https://www.fzeba.com/posts/44-microsoft-data-formulator-concept-binding/'
published: true
---
## Beyond Tidy Data: How Microsoft Data Formulator Lets AI Reshape Your Way to a Chart

> *Every visualization tool assumes your data is already in the right shape. Data Formulator assumes it isn't — and asks an AI agent to fix that.*

## The Tidy-Data Tax

Open any modern visualization library — ggplot2, VegaLite, Charticulator, Lyra, Plotly Express — and the first thing it asks for is **tidy data**. One variable per column, one observation per row. If your data isn't already tidy, you owe a tax: open Pandas, write a `melt`, write a `groupby`, maybe a `pivot_table`, normalize the column names, then come back and bind columns to chart channels.

That tax falls hardest on the people who most need visualization tools: domain analysts, scientists, journalists, policy researchers — anyone whose job is to *understand* data rather than to *process* it. For them, the friction between "I want to compare these two things" and "the data is in the wrong shape" is the difference between iterating quickly and giving up.

**Microsoft Data Formulator** — a Microsoft Research prototype with over 15,000 stars on GitHub — was built to remove that tax. The thesis is simple: an AI agent should do the reshaping work, and the human should stay focused on *what they want to see*.

## The Concept Binding Paradigm

The intellectual contribution of Data Formulator, first published at IEEE VIS 2023 (Best Paper Honorable Mention) by Chenglong Wang, John Thompson, and Bongshin Lee, is a new visualization paradigm called **concept binding**.

Traditional tools bind *columns* to visual channels: "Date → x-axis, Temperature → y-axis, City → color." This only works if the columns you need already exist. Concept binding separates two things that traditional tools conflate:

1. **High-level visualization intent** — "I want to compare quarterly revenue across product lines"
2. **Low-level data transformations** — the pivots, melts, joins, and derived columns required to get there

In Data Formulator, the analyst defines **concepts** they want to visualize — either through natural-language descriptions or by providing example values. Concepts can come from existing columns, or they can be conjured into existence ("compute quarter from the date column", "categorize these prices as low/medium/high"). The analyst then binds those concepts to visual channels, and the AI agent figures out what transformations are needed to surface them.

The 2024 follow-up paper, *"Data Formulator 2: Iteratively Creating Rich Visualizations with AI"* (arXiv:2408.16119), extends this paradigm to support iterative refinement — branching exploration paths, anchoring intermediate states, and using AI agents to recommend chart designs.

## What's New in v0.7

Released in March 2026, **Data Formulator 0.7-alpha** is positioned as the "enterprise-ready" release. The headline changes:

- **30 chart types** via a new semantic chart engine — area charts, streamgraphs, candlestick, pie, radar, U.S. maps, and more
- **Hybrid chat + data thread** — the LLM chat surface is woven into the exploration timeline with lineage, previews, and reasoning visible at each step
- **Unified `DataAgent`** — a single agent replaces the four separate specialized agents from prior versions, plus new recommendation and insight agents
- **Workspace / Data Lake** — persistent, identity-based data management with local and Azure Blob backends
- **Security hardening** — code signing, sandboxed code execution, authentication, rate limiting
- **uv-first builds** — reproducible builds via `uv.lock` and `uv sync`

The architecture is roughly 80% TypeScript (React frontend) and 20% Python (backend). For analytic compute, Data Formulator embeds **DuckDB** in-process — this is what makes it possible to load multi-gigabyte CSVs and parquet files and still get sub-second drag-and-drop chart updates. The AI agents drive **SQL generation** under the hood, executed against DuckDB on the data the user has loaded.

## Five Exploration Levels

The Data Formulator team documents a useful "ladder" from most-control to most-vibe:

- **Level 1 — UI only**: drag-and-drop chart creation if all fields are already in the data. Same as Tableau or Power BI.
- **Level 2 — UI + NL**: specify chart designs with natural language; AI transforms data to realize the design.
- **Level 3 — Recommendations**: ask AI to recommend charts from a natural-language description, or for exploration ideas.
- **Level 4 — Agent mode**: provide a high-level analysis goal; agents auto-plan and explore data across multiple turns, creating exploration threads.
- **Level 5 — Mixed**: combine all of the above to balance control and speed.

This isn't a marketing hierarchy — it's a real cognitive design choice. At each level, the user trades off **autonomy** for **explicitness**. The same UI supports all five modes, and most real analyses move between them as the questions get sharper.

## Loading Data: From CSV to Kusto

Data Formulator accepts data through several pathways:

- **File upload** — CSV, TSV, XLSX (loaded into DuckDB)
- **External data loaders** — MySQL, PostgreSQL, MSSQL, Azure Data Explorer (Kusto), S3, Azure Blob (JSON, parquet, CSV) — added incrementally across v0.2.x releases
- **URL and database refresh** — connect to live URLs and databases with automatic refresh (added in v0.6)
- **AI-powered data extraction** — point Data Formulator at a screenshot, a block of unstructured text, or a website, and it will extract structured data using the LLM

This last capability is the one most analysts underestimate. Tabular data trapped in PDFs and screenshots is one of the largest sources of "I'd love to analyze this but can't" frustration. Data Formulator turns those into first-class inputs.

## Model Support

Data Formulator uses **LiteLLM** under the hood, which means it supports — out of the box — OpenAI, Azure OpenAI, Anthropic, Google Gemini, and any of dozens of other providers. Local inference via Ollama is also supported. The models that work best are those with strong code generation and instruction following: GPT-4o, Claude Sonnet, GPT-5.x, etc. API keys can be stored in a `.env` file to avoid repeated entry.

This matters because the AI agent isn't doing free-form natural-language reasoning — it's generating SQL queries against DuckDB and Vega-Lite specs for the chart engine. Models with strong code synthesis perform substantially better than chat-tuned models for this task.

## Installation: Three Paths

```
# Option 1: uv (recommended)
uvx data_formulator
# or in a project
uv pip install data_formulator && python -m data_formulator

# Option 2: pip
pip install data_formulator
python -m data_formulator

# Option 3: Codespaces (5-minute setup)
# Use the "Open in Codespaces" badge in the GitHub README
```

Once running, Data Formulator opens at `http://localhost:5567`. The port is configurable via `--port`. For development work, the README points at `DEVELOPMENT.md` for the full build setup including Vite, Yarn, and Python virtualenv configuration.

## Comparison to the Rest of the Field

Several tools have appeared in this space recently. A short, opinionated map:

- **Vega-Altair / Plotly Express** — code-first, declarative, no AI. Strong if you can already write code.
- **Tableau / Power BI** — GUI-first, drag-and-drop, no AI agent for data transformation. Great for clean data, painful for messy data.
- **OpenAI Code Interpreter / ChatGPT Data Analysis** — chat-first, AI does everything, but no UI for direct manipulation and limited chart vocabularies.
- **Lyra / Charticulator** — visualization authoring research tools focused on bespoke chart design, no AI.
- **Data Formulator** — *blended* UI + NL, AI agent specifically for data transformation, large chart vocabulary, designed for iterative exploration.

The closest cousin to Data Formulator in spirit is probably **Vega-Altair plus an AI assistant** — but Data Formulator is the only tool I'm aware of that builds the AI assistant into the core authoring paradigm rather than bolting it on as a chat sidebar.

## Open Source and Provenance

Data Formulator is MIT-licensed and developed in the open at https://github.com/microsoft/data-formulator. It's a Microsoft Research prototype, but the development cadence has been aggressive — eight feature releases in 18 months — and the project explicitly invites contributions for new data loaders, chart templates, and dataset-extraction improvements.

The team also publishes their research. Two arXiv papers underpin the design:

- *"Data Formulator: AI-powered Concept-driven Visualization Authoring"* (arXiv:2309.10094), IEEE TVCG / VIS 2023
- *"Data Formulator 2: Iteratively Creating Rich Visualizations with AI"* (arXiv:2408.16119)

The hosted demo lives at https://data-formulator.ai, and a public Discord (`mYCZMQKYZb`) hosts the community.

## When to Reach For It

Data Formulator earns its place in your toolkit if any of the following apply:

- You spend more time **reshaping data** than **looking at charts**
- You have **screenshots or PDFs** with tabular data you want to visualize
- You want to **explore multiple analytical paths in parallel** without losing your place
- You work with **non-technical stakeholders** who need to participate in the visualization process
- You want **AI assistance** that isn't just a chatbox slapped onto a BI tool

It's not (yet) a replacement for production dashboards or pixel-perfect publication graphics. It is a remarkably good environment for the messy, iterative middle phase of any data analysis — the phase where you actually figure out what story the data is telling.

---

## Sources

- Data Formulator GitHub repository — https://github.com/microsoft/data-formulator
- Data Formulator hosted demo — https://data-formulator.ai
- Wang, Thompson, Lee. *"Data Formulator: AI-powered Concept-driven Visualization Authoring"*, IEEE TVCG / VIS 2023 — https://arxiv.org/abs/2309.10094
- Wang, Lee, Drucker, Marshall, Gao. *"Data Formulator 2: Iteratively Creating Rich Visualizations with AI"*, 2024 — https://arxiv.org/abs/2408.16119
- Microsoft Research blog: *"Data Formulator: A concept-driven, AI-powered approach to data visualization"* — https://www.microsoft.com/en-us/research/blog/data-formulator-a-concept-driven-ai-powered-approach-to-data-visualization/
- Microsoft Research blog: *"Data Formulator: Exploring how AI can help analysts create rich data visualizations"* — https://www.microsoft.com/en-us/research/blog/data-formulator-exploring-how-ai-can-help-analysts-create-rich-data-visualizations/
- Data Formulator paper page — https://www.microsoft.com/en-us/research/publication/data-formulator-ai-powered-concept-driven-visualization-authoring/
- MarkTechPost coverage — https://www.marktechpost.com/2025/02/14/microsoft-research-introduces-data-formulator-an-ai-application-that-leverages-llms-to-transform-data-and-create-rich-visualizations/
- Cobus Greyling: *"A new Data Visualisation Paradigm By Leveraging An AI Agent"* — https://cobusgreyling.medium.com/a-new-data-visualisation-paradigm-by-leveraging-an-ai-agent-138b73c865fb
- LiteLLM providers (underlying LLM abstraction) — https://github.com/BerriAI/litellm
- DuckDB (embedded analytics database) — https://github.com/duckdb/duckdb
- v0.7-alpha release notes — https://github.com/microsoft/data-formulator/releases/tag/0.7-alpha
