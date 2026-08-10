---
title: 'The Graph Is Not the Point: Building a Personal Knowledge System That Actually Teaches You Something'
description: >-
    Why building a concept map beats studying one, why the untyped wikilink
    throws away the information you needed, and how to layer embeddings,
    LLM triple extraction, and structural gap detection on top without
    letting the machine author your graph.
date: '2026-08-10'
updated: '2026-08-10'
tags:
    - knowledge management
    - knowledge graphs
    - graphrag
    - obsidian
    - spaced repetition
    - learning science
number: 64
canonical_url: 'https://www.fzeba.com/posts/64-graphs-for-learning/'
published: true
---

## The Graph Is Not the Point

> _Building a personal knowledge system where the semantics are dynamic, the links are typed, and the learning is real._

There is a specific screenshot that circulates in every note-taking community. A dark background. Four hundred glowing nodes in a force-directed halo, edges shimmering between them like neural tissue. The caption is always some variant of _"two years of my second brain."_

It is beautiful. It is also, in most cases, a monument to work that did not happen.

The uncomfortable finding at the center of this article is that the visual artifact people optimize for — the dense, pretty graph — is almost orthogonal to the cognitive process that actually produces understanding. The graph is a _byproduct_ of thinking, not a substitute for it. Worse, the tooling of the last five years has made it trivially easy to generate the byproduct without doing the thinking.

This article is about fixing that. It covers three things:

1. **What the learning-science literature actually establishes** about concept maps — including the study that says retrieval practice beats them, and why that study has not held up as cleanly as its headline suggests.
2. **How to structure a personal knowledge graph** so the edges carry information instead of decoration — typed links, atomic claims, and why the standard `[[wikilink]]` is a lossy encoding.
3. **How to bridge the semantic layer** — moving from a static graph of hand-authored links to one where relations are induced from meaning, extracted by LLMs into typed triples, traversed by graph algorithms, and versioned over time. With architecture, code, and the failure modes.

Let's start with the part most tool reviews skip.

---

## Part I — What the evidence actually supports

### Making a map beats studying one — by roughly 1.7×

This is the single most actionable finding in the literature, and it is routinely inverted by people who download pre-made mind maps.

A meta-analysis by Schroeder et al. (2018), summarized in [Krieglstein et al. (2022)](https://pmc.ncbi.nlm.nih.gov/articles/PMC8788906/) in _Educational Technology Research and Development_, puts the effect of **constructing** concept maps at _g_ = 0.72, versus _g_ = 0.43 for **studying** maps someone else built. The proposed mechanism is knowledge elaboration: the map forces you to integrate new elements into your existing knowledge structures, and its topology makes superordinate/subordinate relationships explicit in a way that linear prose does not.

The magnitude generalizes. Anastasiou, Wirngo & Bagos's [2024 meta-analysis](https://ir.library.illinoisstate.edu/gred/1/) in _Educational Psychology Review_ — 55 studies, 5,364 students, grades 3–12 — found _g_ = 0.776 for science achievement overall, with subject-level effects of 0.590 (chemistry), 0.671 (biology), and 1.040 (physics and earth science). Worth noting honestly: the authors report that the between-subject differences were **not statistically significant**, so treat the spread as noise rather than as evidence that mapping is uniquely suited to physics.

For context, in education research anything above _g_ ≈ 0.4 is worth restructuring your workflow around. These are large effects.

### Your map is a representation of _your_ schema, not of the domain

Novak — who originated concept mapping during a 12-year longitudinal study of science learning — defined the artifact as a [diagrammatic representation of one's internal knowledge structure](https://www.aft.org/ae/spring2022/sundar). The consequence is philosophically important and practically liberating: **there is no correct map.** Two experts mapping the same topic should produce different graphs, because they have different schemas. A map that looks like the textbook's table of contents is evidence that you copied structure rather than built it.

This also explains why maps are diagnostic. Gaps in the graph are gaps in the schema. That property is the foundation of everything in Part IV.

Three rules worth encoding:

- **Iterate.** Novak and Cañas hold that a good map needs [at least three rounds of revision](https://ablconnect.harvard.edu/concept-map-research). First-draft graphs are noise.
- **Map after, not before.** The same source notes evidence that building a map at the _end_ of a unit outperforms using it as a preview organizer.
- **Signal your clusters.** Adding color to group related information [reduces extraneous cognitive load](https://pmc.ncbi.nlm.nih.gov/articles/PMC8788906/) (Aguiar & Correia 2016; Schneider et al. 2021). Your graph's visual encoding is not cosmetic — it's a working-memory subsidy.

### The finding that should worry you

In 2011, Karpicke and Blunt published a result in _Science_ with a title that is essentially a demolition order: [**Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping**](https://www.science.org/doi/10.1126/science.1199327).

The design: students studied science texts, then either built concept maps or practiced free recall. One week later, retrieval practice won on recall, on inference, on short answer — and, devastatingly, [even when the final test was _building a concept map_](https://www.science.org/doi/10.1126/science.1199327). The authors concluded the benefit comes from retrieval-specific mechanisms rather than elaborative encoding.

There's a twist that makes the result more interesting rather than less: students _predicted_ concept mapping would work better. The subjective sense of productive effort was inversely related to the actual outcome. If you have ever finished a two-hour linking session feeling brilliant and remembered nothing a month later, that's the effect.

**But the study is contested, and the objections have gotten stronger over time.** Three lines of attack, in ascending order of severity:

1. **Training.** A formal [comment in _Science_](https://www.science.org/doi/10.1126/science.1203698) from Mintzes and colleagues argued that participants received a truncated description of the mapping technique — you cannot benchmark a skilled practice against untrained performance of it.
2. **Moderation by expertise.** Lechuga et al.'s [replication](https://www.sciencedirect.com/science/article/abs/pii/S0959475215300232) in _Learning and Instruction_ (2015, _N_ = 84) reproduced the direction of the effect but found the retrieval advantage **less pronounced among students who habitually used concept maps.** Training moderates the effect.
3. **A methodological artifact.** This is the serious one. Mayrhofer, Kuhbandner & Frischholz (2023) ran a [preregistered re-examination](https://pmc.ncbi.nlm.nih.gov/articles/PMC10783554/) in _Frontiers in Psychology_ (_N_ = 230, one-week delayed test) and found that the retrieval conditions in the original paradigm included an **additional memorization phase that the mapping conditions did not get.** Control for that confound and "the advantage of retrieval practice over concept mapping disappeared." The supposed superiority was bought with extra study time, not with retrieval.

So the honest state of the evidence is not "retrieval beats mapping." It is closer to: retrieval is cheap, reliable, and hard to do wrong, while mapping is expensive, skill-dependent, and easy to do badly — and when you equate time-on-task between trained practitioners, the gap is much smaller than the 2011 headline implies.

### The synthesis: two loops, not one system

The correct conclusion is not "graphs lose." It's that graphs and retrieval optimize different variables, and most people build only one loop:

```
        ┌─────────────────────────────────────────┐
        │            STRUCTURE LOOP               │
        │  capture → atomize → type edges → map   │
        │  optimizes: connection, transfer,       │
        │             insight, gap detection      │
        └──────────────────┬──────────────────────┘
                           │  stable claims promoted
                           ▼
        ┌─────────────────────────────────────────┐
        │            RETENTION LOOP               │
        │  prompt → schedule → recall → grade     │
        │  optimizes: durable availability        │
        └─────────────────────────────────────────┘
```

Andy Matuschak, reflecting on [five years of running both practices](https://www.patreon.com/posts/five-years-of-109216672), arrived at a clean heuristic: write **evergreen notes** mostly about your own ideas and the relationship between others' ideas and your own; write **spaced-repetition prompts** mostly to internalize others' ideas and knowledge about the world. Different media, different grain sizes, different outcomes — notes make ideas available _in prose for future thinking_, prompts make them available _in memory_.

Build only the structure loop and you get a beautiful graph you cannot recall from. Build only the retention loop and you get a pile of isolated facts with no latticework — the failure mode Munger describes as remembering things that "don't hang together on a latticework of theory."

---

## Part II — Anatomy of a knowledge graph that carries information

### The wikilink is a lossy encoding

Here is the core technical complaint about mainstream PKM tools. Consider these four relationships:

```
[[Bayesian inference]] --?--> [[Frequentist statistics]]
[[Retrieval practice]]  --?--> [[Concept mapping]]
[[Leiden algorithm]]    --?--> [[Louvain algorithm]]
[[Karpicke 2011]]       --?--> [[Elaborative encoding]]
```

In a standard vault, all four are the same edge: an untyped adjacency, rendered undirected in the graph view. You have thrown away _contrasts-with_, _outperforms-on-delayed-recall_, _is-successor-of_, and _challenges_. Information-theoretically, you compressed a labeled multigraph into a plain adjacency matrix and destroyed most of the signal at write time.

That's why the default graph view degrades into hairball. It isn't a rendering problem. It's that the underlying data structure has no semantics to render. As one [critical assessment](https://codeculture.store/blogs/developer-culture/obsidian-graph-view-useful) puts it, graph view is genuinely useful under roughly 50 notes — where visual sparsity makes an underdeveloped cluster obvious — and useful as a _before/after diagnostic_ after a linking cleanup. Past 50 notes that advantage "disappears quickly," and past 200 the view degrades badly. It is not a daily navigation tool. The honest observation in the same piece: a dense glowing graph signals intellectual effort the way a beautifully commented codebase does, which is not the same as being the highest-leverage thing you could have done.

### Design rules for nodes

**One claim per node, titled as a proposition.** Matuschak titles notes like assertions — _"Evergreen notes should be densely linked"_ rather than _"Note-taking."_ A [guide to the practice](https://fabric.so/learn/evergreen-notes) makes the mechanical argument: a claim-title is more precise and more _linkable_, because you know exactly what the node asserts when deciding whether to point at it. Topic-titled notes become junk drawers; junk drawers cannot be edges' endpoints in any meaningful sense.

**Write in your own words, always.** This is not a stylistic preference — it's the entire mechanism. Quoting preserves someone else's formulation; reformulating requires the compression that constitutes understanding, and produces a node phrased in _your_ vocabulary, which makes future connections detectable. It is also the only defense against the [collector's fallacy](https://zettelkasten.de/posts/collectors-fallacy/): "having a text at hand does nothing to increase our knowledge," because "knowing about is merely to be certain of its existence, nothing more."

**Short cycles.** The same source recommends tight "research, read, assimilate; rinse and repeat" loops rather than accumulating a large unprocessed pile. Practically: a capture that hasn't been distilled within 48 hours is usually a capture that never will be.

### Design rules for edges

Define a small closed vocabulary of relation types. Small is the operative word — an ontology of 40 relations is one you will not use consistently, and inconsistent typing is worse than no typing because it produces the illusion of structure.

A workable starting set:

| Relation                    | Semantics                    | Use when                  |
| --------------------------- | ---------------------------- | ------------------------- |
| `supports`                  | evidence increases credence  | study → claim             |
| `refutes`                   | evidence decreases credence  | replication failure → claim |
| `contrasts-with`            | same slot, different answer  | competing frameworks      |
| `causes` / `caused-by`      | mechanism                    | model building            |
| `example-of` / `instance-of`| subsumption                  | grounding abstractions    |
| `part-of`                   | mereology                    | decomposing systems       |
| `prerequisite-of`           | learning order               | curriculum design         |
| `succeeds`                  | version/lineage              | Leiden succeeds Louvain   |
| `applies-to`                | domain transfer              | technique → new field     |

Once edges are typed, three things become possible that were impossible before: you can query the graph (`show every claim with ≥2 refutes edges and 0 supports`), you can compute over relation subsets (a prerequisite-only subgraph is a DAG you can topologically sort into a study plan), and — critically — you can _detect contradictions_, which is where most real learning happens.

---

## Part III — The manual layer: authoring structure by hand

Do not automate this layer. Manual linking **is** the elaboration; outsourcing it outsources the learning. What you automate is _candidate generation_ (Part IV), not commitment.

### Obsidian + typed-link plugins

The pragmatic default. Local markdown, no lock-in, and the plugin ecosystem covers the gaps.

**Breadcrumbs** [adds typed links](https://github.com/michaelpporter/breadcrumbs) to notes, building them into a directed graph. **Juggl** renders them: it [displays typed edges with captions](https://juggl.io/link-types.html) and integrates Breadcrumbs' Dataview inline-attribute syntax, so `hasPainted:: [[The Night Watch]]` becomes a labeled edge in the visualization.

Juggl's own documentation is refreshingly honest about the syntax's limitations, and they're worth internalizing before you build on it:

- It's **metadata, not inline** — "most of the links people write in Obsidian are 'inline'," but the typed link sits on its own line, which fights the way people actually write.
- It **can't carry edge properties.** "The relation `publishedIn` could have useful additional metadata, such as the year it was published" — and there is no slot for it. You have a labeled graph, not a property graph.
- **The subject is always the current note.** You can "only link the current note as a source," so in today's daily note you cannot express `(Joe Biden, becomes-president-of, US)` — the note itself is forced to be the subject.

**ExcaliBrain** takes a different approach: it [imposes hierarchy on the flat graph](https://codeculture.store/blogs/developer-culture/obsidian-graph-view-useful) using link-type prefixes to derive parent/child/sibling/friend relations, which makes it navigable past a few dozen nodes where the default view isn't. The cost is real: it requires ongoing link-type discipline, and it [performs poorly at high node counts](https://volodymyrpavlyshyn.medium.com/personal-knowledge-graphs-in-obsidian-528a0f4584b9).

### Structured-object tools

**Tana** models knowledge as an outline where **supertags** turn any bullet into a typed object with fields. Its distinguishing capability is _composability_: a node tagged `#book` and `#gift` and `#recommendation` [inherits fields from all three](https://fabric.so/comparison/capacities-vs-tana), which expresses overlapping categorization that single-type models can't. Supertags also [support inheritance](https://pickuma.com/for-dev/tana-personal-knowledge-management-review/) — update `#task` and every descendant type inherits the change — and live search nodes act as continuously-updating materialized views. The universal complaint is the [learning curve](https://aiproductivity.ai/tools/tana/); budget weeks, not hours.

**Capacities** trades ceiling for floor: typed objects with [structure from day one](https://capacities.io/compare/tana-outliner) and no schema to plan. The tradeoff is explicit in their own migration docs — "[Capacities object types do not support inheritance. Each type is independent.](https://docs.capacities.io/migration/switching-from-tana)"

### Escape hatch: RDF

If you want your graph to outlive your tool, export it to triples. There's a [documented approach](https://volodymyrpavlyshyn.medium.com/how-to-export-your-obsidian-vault-to-rdf-00fb2539ed18) for emitting an Obsidian vault as RDF with a minimal `pkg:Node` / `pkg:Edge` ontology, which buys you SPARQL, standard graph analytics, and interop with the entire semantic-web toolchain. This matters more than it sounds: the semantic layer techniques in Part IV are far easier to apply to a triple store than to a folder of markdown.

---

## Part IV — Bridging the semantic layer

Here's the actual problem statement. A hand-authored graph has two structural weaknesses:

1. **It only contains connections you already noticed.** The edges you most need are the ones between clusters you've never thought about simultaneously — and those are precisely the edges you will never author by hand.
2. **It ossifies.** Structure ossification is [a well-identified failure mode](https://engineeringideas.substack.com/p/reflection-on-two-years-of-writing) of note, SRS, and PKM systems — "a big issue with most existing knowledge management, spaced repetition, and note-taking systems," as one two-year retrospective puts it. The topology you committed to in month three becomes the topology you're still using in year three, long after your understanding has moved.

The semantic layer attacks both. Five techniques, in ascending order of implementation cost. Combine them; they are complementary, not competing.

### 4.1 — Embedding-induced links (dynamic adjacency, zero schema)

The mechanism is dense retrieval. Each note (or chunk) is mapped to a vector in ℝⁿ by an embedding model; relatedness is cosine similarity. Unlike keyword search, this matches on _meaning_ — a note that never contains your query string can be its nearest neighbor.

Formally, you're replacing a hand-authored static adjacency matrix with a **query-dependent, thresholded k-NN graph**:

```
A_manual[i][j] ∈ {0,1}                    # you wrote it, or you didn't
A_semantic[i][j] = 1 if cos(vᵢ, vⱼ) > τ   # recomputed on every embed
```

The graph is no longer a fixed artifact. It's a _view_ over an index that changes every time you write.

**Smart Connections** implements this inside Obsidian. It ships a [local embedding model that "just works" — private and offline by default, zero setup, no API key](https://github.com/brianpetro/obsidian-smart-connections) — and exposes two distinct query modes worth understanding as separate primitives:

- **Connections** is _note-first_: the note in view is the query vector, and related notes surface while you write.
- **Lookup** is _question-first_: you supply a natural-language query and get semantic retrieval across the vault.

Results carry a [similarity score](https://www.obsidianstats.com/plugins/smart-connections), and — the key affordance — you can **drag a result directly into your note to create a link.** That's the correct interaction design: the machine proposes, the human commits.

**Reor** takes the same idea and builds the whole app around it. Its architecture is instructive: [every note is chunked and embedded into an internal vector database (LanceDB), related notes are connected automatically via vector similarity, and LLM Q&A runs RAG over the corpus](https://github.com/reorproject/reor/blob/main/README.md) — with local models via Llama.cpp and Transformers.js. Their framing is the sharpest one-liner in this space: **a RAG app with two generators, the LLM and the human.** In editor mode, the human is the generator and the corpus is the retrieval context.

Pragmatically, Reor [points at "a directory of markdown files (like an Obsidian vault)" and "works seamlessly alongside Obsidian"](https://webbindustries.com/hackernews/story/39372159) — so this is not an either/or migration.

**Where this technique fails:** cosine similarity gives you _relatedness_, full stop. It cannot tell you that note A _refutes_ note B. It surfaces the neighbor and is silent on the relation. Near-duplicates also score highest, so a naive implementation mostly recommends you notes you already know are related. Which brings us to:

### 4.2 — LLM-extracted triples (semantics → explicit structure)

To get typed edges automatically, you need extraction, not similarity. This is the GraphRAG family.

Microsoft's [GraphRAG](https://github.com/microsoft/graphrag) is the reference implementation, and its pipeline is worth knowing in detail because everything else is a variation on it. Per [Edge et al. (2024)](https://arxiv.org/abs/2404.16130), it runs four stages:

```
 documents
     │
     ▼
[1] LLM entity + relationship extraction  ──► SPO triples, consolidated into a KG
     │
     ▼
[2] community detection (hierarchical Leiden) ──► multi-level semantic clusters
     │
     ▼
[3] recursive LLM summarization per community ──► hierarchical context maps
     │
     ▼
[4] graph-aware retrieval: local neighborhood expansion
                         + global hierarchy navigation
```

The insight that distinguishes GraphRAG from earlier KG+RAG work is its focus on **modularity** — the ability to partition a graph into nested communities of tightly-connected nodes (the Louvain/Leiden lineage of modularity-optimizing algorithms; GraphRAG uses hierarchical Leiden) and then recursively summarize _up_ that hierarchy. That's what lets it answer global, query-focused summarization questions ("what are the themes across my entire corpus?") that chunk-level retrieval structurally cannot.

For a personal knowledge base, step 2 is the payoff: **Leiden clustering on your notes tells you what your actual topics are**, as opposed to what your folder names claim they are. The divergence is usually informative and occasionally humiliating.

#### The schema problem (and the fix)

Naive extraction fails in a specific, documented way. Neo4j's team ran their [LLM Knowledge Graph Builder](https://neo4j.com/blog/developer/unstructured-text-to-knowledge-graph/) on the James Bond Wikipedia page and reported **role confusion** — Ian Fleming, who wrote the novels, appearing as a publisher. Scale that error rate across your entire vault and you have a graph that is confidently wrong.

The literature converges on the cause. Schema-free extraction — [unconstrained prompting for SPO triples](https://arxiv.org/abs/2603.25152) — trades schema coherence for indexing speed, and produces **inconsistent typing and fragmented relations**: `authored`, `wrote`, `is-author-of`, and `penned` become four distinct edge types describing one relation. Recent work addresses this by bounding extraction with an ontology or a seed schema that constrains the model to a target set of types.

**The practical implication for you:** feed your own relation vocabulary — the nine-item table from Part II — into the extraction prompt as a hard constraint. Do not let the model invent predicates.

```python
EXTRACTION_SCHEMA = {
    "relations": [
        "supports", "refutes", "contrasts-with", "causes",
        "example-of", "part-of", "prerequisite-of",
        "succeeds", "applies-to",
    ]
}

PROMPT = """Extract claim-level triples from the note below.

HARD CONSTRAINTS:
- `predicate` MUST be one of: {relations}. Never invent a predicate.
- Subject and object must be atomic CLAIMS or CONCEPTS, not sentences.
- Emit a `confidence` in [0,1] and a `span` quoting <=12 words of evidence.
- If no triple meets confidence >= 0.7, return an empty list. Do not pad.

Return JSON only: {{"triples": [{{"s":..,"p":..,"o":..,
                   "confidence":..,"span":..}}]}}

NOTE:
{note}
"""

prompt = PROMPT.format(
    relations=", ".join(EXTRACTION_SCHEMA["relations"]),
    note=note_text,
)
```

Two non-obvious design choices in that prompt. The **evidence span** gives you provenance, so a suspicious edge can be traced to the text that produced it and rejected. The **empty-list escape hatch** matters more than it looks: without explicit permission to return nothing, models pad output with low-quality triples to satisfy the perceived task, and your graph fills with noise.

#### The cost wall

Be aware of the economics before you point this at 3,000 notes. LLM-based graph construction is token-expensive, and that cost is the main thing the lightweight GraphRAG variants are built to avoid — [EHRAG](https://arxiv.org/abs/2604.17458), for instance, advertises "linear indexing complexity and zero token consumption for construction" precisely by replacing the LLM extraction step with named-entity recognition. If you keep the LLM in the loop, **batch it.** Run extraction monthly over new and modified notes, not continuously.

### 4.3 — Graph-native retrieval (the part that feels like memory)

Once you have a graph, you can retrieve _over its topology_ rather than over a flat vector index. The most cognitively interesting approach here is **HippoRAG** ([Gutiérrez et al., NeurIPS 2024](https://arxiv.org/abs/2405.14831)), which is explicitly modeled on the _hippocampal indexing theory_ of human long-term memory. In the authors' words, it "synergistically orchestrates LLMs, knowledge graphs, and the Personalized PageRank algorithm to mimic the different roles of neocortex and hippocampus in human memory."

The architecture maps components onto neuroanatomy: the LLM is the artificial **neocortex**, a retrieval encoder plays the **parahippocampal region** (detecting synonymy to interconnect information), and the open KG is the artificial **hippocampus**. Offline, the LLM processes passages into KG triples that populate the hippocampal index. Online:

```
query
  │
  ├─► LLM extracts named entities
  │
  ├─► encoder links entities to graph nodes by cosine similarity  ── "seed nodes"
  │
  └─► Personalized PageRank, restarting only from seeds
            │
            └─► activation spreads through the local neighborhood,
                not uniformly across the graph
```

[Personalized PageRank](https://medium.com/@tuhinsharma121/how-hipporag-mimics-human-memory-for-smarter-ai-search-86097e1f7bf2) ensures probability mass flows predominantly through the neighborhood of relevant nodes rather than the whole graph — which is, mechanically, **priming**. The system also uses _node specificity_ to bias retrieval toward rare and distinctive facts, mirroring the human tendency to recall distinctive details better than generic ones.

The reported gain is substantial: the paper claims it outperforms state-of-the-art methods on multi-hop QA "by up to 20%," and that single-step retrieval matches or beats iterative retrieval like IRCoT "while being 10–30 times cheaper and 6–13 times faster." And because updates touch only the KG index rather than the encoder weights, the system supports continual learning without retraining.

HippoRAG 2 documents the original's flaw honestly: an [entity-centric approach that causes context loss](https://arxiv.org/abs/2502.14802) during both indexing and inference. The fix is "deeper passage integration" — seeding PPR from passages and triples rather than entities alone.

**Why should a human care about a retrieval algorithm?** Because it's the highest-fidelity mechanical model we have of the thing your knowledge system is supposed to do — cue-triggered spreading activation over an associative index. If you understand PPR, you understand why densely-linked atomic notes retrieve better than long documents: seed nodes with tight neighborhoods concentrate activation, sprawling nodes diffuse it.

The general lesson from the field is unambiguous: [hybrid architectures combining vector and graph retrieval outperform either alone](https://zylos.ai/research/2026-04-05-ai-agent-memory-architectures-persistent-knowledge/). The production pattern is semantic entry via vector similarity to identify candidate nodes, graph traversal from those entry points to gather relational context, then reranking that combines similarity score with graph distance.

### 4.4 — Temporal graphs (because your understanding is a moving target)

Standard knowledge graphs assume facts are timeless. Yours aren't. You believed something in March, revised it in June, and the graph should know both — not silently overwrite.

**Graphiti**, the engine behind Zep ([arXiv 2501.13956](https://arxiv.org/abs/2501.13956)), solves this with **bitemporal edge annotation**: every relationship carries both [event time (when the fact was true in the world) and ingestion time (when the agent first observed it)](https://zylos.ai/research/2026-04-05-ai-agent-memory-architectures-persistent-knowledge/). Contradictory or updated facts are handled _without information loss_ — instead of deleting the old edge, you invalidate it and keep the history.

For a learning system this is exactly right. The trajectory of your belief about a concept is often more instructive than its current state, and "what did I think about X before I read Y?" is a question a normal vault cannot answer.

Performance is respectable: hybrid retrieval combining semantic embeddings, BM25, and graph traversal hits [P95 latency around 300 ms with no LLM calls at retrieval time](https://zylos.ai/research/2026-04-05-ai-agent-memory-architectures-persistent-knowledge/), and Zep reports 94.8% on the Deep Memory Retrieval benchmark against MemGPT's 93.4%.

Deployment note: [Zep Community Edition has been deprecated](https://vectorize.io/articles/zep-vs-cognee) — self-hosting means running Graphiti directly against Neo4j, FalkorDB, or Kuzu.

**Cognee** is the adjacent option, oriented toward ingesting heterogeneous corpora rather than conversational state. Its [six-stage `cognify` pipeline plus a self-refining `memify` operation](https://zylos.ai/research/2026-04-05-ai-agent-memory-architectures-persistent-knowledge/) — which prunes stale nodes and reweights edges by usage frequency — lets the graph schema _evolve_, a direct countermeasure to structure ossification. The [distinction](https://vectorize.io/articles/zep-vs-cognee) is clean: Zep/Graphiti for _what happened and when it changed_; Cognee for _reasoning over a large body of existing documents_.

### 4.5 — Structural gap detection (the actual learning payoff)

Everything above improves retrieval. This one improves _you_.

**InfraNodus** represents text as a network and applies graph metrics — modularity-based community detection, degree, betweenness centrality — to find **structural gaps**. The algorithm [identifies "topical clusters on the graph that are distinct from one another and have a high distance"](https://infranodus.com/about/how-it-works), highlights the gap, surfaces the two clusters that could be better connected, and encourages users "to think of a possible connection to bridge the structural gap and generate a new research question or an idea."

Re-read Part I and the significance should land: if a concept map is a picture of your schema, then a structural gap in that map is _a picture of the hole in your understanding_. This is the closest thing in the tooling landscape to automated Socratic questioning.

It [imports Obsidian, Logseq, and Roam markdown](https://infranodus.com/use-case/visualize-knowledge-graphs-pkm) plus PDFs, and exposes an [API usable as a portable GraphRAG layer](https://infranodus.com/api) if you'd rather wire it into your own pipeline.

You can also implement a crude version yourself in a dozen lines — the concept generalizes:

```python
import networkx as nx
from networkx.algorithms.community import louvain_communities

G = load_my_typed_graph()          # nodes = claims, edges = typed relations
U = G.to_undirected(as_view=True)  # modularity is defined on undirected graphs
comms = louvain_communities(U, seed=42)

MIN_COMMUNITY = 8  # ignore clusters too small to count as a topic
MAX_CROSSING = 1   # 0 or 1 edges between two real topics = a structural gap

for i, a in enumerate(comms):
    for b in comms[i + 1:]:
        if len(a) < MIN_COMMUNITY or len(b) < MIN_COMMUNITY:
            continue
        # U, not G: an edge in either direction still bridges the two clusters
        crossing = sum(1 for u in a for v in b if U.has_edge(u, v))
        if crossing <= MAX_CROSSING:
            print(f"GAP: {label(a)} <-> {label(b)}  (crossing edges: {crossing})")
            # -> your next research question lives here
```

(`load_my_typed_graph` and `label` are yours to supply — the first reads your vault into a `nx.DiGraph`, the second names a community from its highest-degree nodes.)

Every line that prints is a prompt to write a note that does not yet exist.

---

## Part V — A reference architecture

Layer the techniques. Each has a distinct job and a distinct refresh cadence.

```
┌──────────────────────────────────────────────────────────────────┐
│ L0  CAPTURE          inbox, raw, unlinked, unprocessed           │
│                      cadence: continuous                         │
├──────────────────────────────────────────────────────────────────┤
│ L1  ATOMIZE          claim-titled notes, your own words          │
│                      cadence: within 48h    ◄── the real work    │
├──────────────────────────────────────────────────────────────────┤
│ L2  MANUAL TYPED     9-relation vocabulary, hand-authored        │
│     EDGES            cadence: at write time ◄── the real work    │
├──────────────────────────────────────────────────────────────────┤
│ L3  SEMANTIC         local embeddings; k-NN candidate edges      │
│     PROPOSALS        machine proposes, human commits             │
│                      cadence: live, as you type                  │
├──────────────────────────────────────────────────────────────────┤
│ L4  EXTRACTED        ontology-constrained LLM triples +          │
│     GRAPH            Leiden communities + summaries              │
│                      cadence: monthly batch (cost wall)          │
├──────────────────────────────────────────────────────────────────┤
│ L5  TEMPORAL         bitemporal edges; belief-change history     │
│     LAYER            cadence: on every L4 run                    │
├──────────────────────────────────────────────────────────────────┤
│ L6  GAP ANALYSIS     structural gaps → research questions        │
│                      cadence: monthly                            │
├──────────────────────────────────────────────────────────────────┤
│ L7  RETENTION        stable claims → FSRS prompts                │
│                      cadence: daily review, weekly authoring     │
└──────────────────────────────────────────────────────────────────┘
```

**The load-bearing rule: L3–L6 may propose. Only you commit.** The moment auto-generated edges land in your graph unreviewed, you have a graph of the model's understanding rather than yours — which fails the Novak criterion (it's no longer a representation of _your_ schema) and eliminates the elaboration that produced the effect size in the first place.

A minimal implementation of the propose-review-commit loop:

```python
from dataclasses import dataclass

@dataclass
class ProposedEdge:
    src: str
    dst: str
    relation: str | None   # None if from embeddings; typed if extracted
    score: float
    provenance: str        # "embed:bge-m3" | "llm:extract@2026-08" | "gap:louvain"
    evidence: str | None   # <=12-word span, for extracted triples


def review_queue(vault):
    proposals = []
    proposals += embedding_knn(vault, k=5, threshold=0.78)   # L3
    proposals += extracted_triples(vault, min_conf=0.70)     # L4
    proposals += gap_bridges(vault)                          # L6

    # Rank by novelty, not similarity: an edge between distant
    # communities is worth more than one inside a cluster.
    return sorted(
        proposals,
        key=lambda p: p.score * community_distance(p),
        reverse=True,
    )
```

That ranking function is the single highest-leverage line in the whole system. **Sorting proposals by raw similarity surfaces things you already know are related.** Weighting by community distance surfaces the edges you'd never have found — which is the entire reason you built the semantic layer.

---

## Part VI — Closing the retention loop

Structure without retention is a library you can't remember visiting. The modern scheduler is worth understanding once.

**FSRS** (Free Spaced Repetition Scheduler), available in Anki since version 23.10 and now at FSRS-6, models memory with three per-card variables — the **DSR model**:

- **Retrievability (R)** — [the probability of successfully recalling the item at a given moment](https://faqs.ankiweb.net/what-spaced-repetition-algorithm), depending on elapsed time and stability. Changes daily.
- **Stability (S)** — [the time, in days, required for R to decrease from 100% to 90%](https://faqs.ankiweb.net/what-spaced-repetition-algorithm). S = 365 means a year passes before recall probability drops to 90%. Changes only on review.
- **Difficulty (D)** — [how difficult it is to _increase_ memory stability after a review](https://faqs.ankiweb.net/what-spaced-repetition-algorithm).

Current FSRS models the forgetting curve as a power law rather than a simple exponential — [in the reference formulation](https://borretti.me/article/implementing-fsrs-in-100-lines), `R(t, S) = (1 + F·t/S)^C` with `F = 19/81` and `C = -0.5`, which correctly gives R(0) = 1. The scheduler then inverts this to find the interval at which R hits your desired retention target. Crucially, FSRS [analyzes your own review history and uses machine learning to fit parameters to it](https://faqs.ankiweb.net/what-spaced-repetition-algorithm) rather than applying one curve to everyone.

**What this means for prompt design:** the algorithm assumes each card has a well-defined, stable difficulty. A card containing five bullet points has _five different_ difficulties smeared into one D estimate, which is why atomicity isn't stylistic advice — it's a modeling requirement. Cloze deletions isolate the specific fact you're actually failing on.

Then apply the graph-native constraint. Matuschak: [prompts should connect and relate ideas](https://notes.andymatuschak.org/z3whk8UxFRFLgUQX9f7Fr2o) rather than drilling isolated facts, because rich understanding _is_ connection. The naive approach yields a heap of protein names and physical constants with no latticework.

Concretely, generate prompts **from your edges, not just your nodes**:

```
Node prompt (weak):    What is Personalized PageRank?

Edge prompt (strong):  Why does HippoRAG use Personalized PageRank
                       rather than global PageRank — what does the
                       "personalized" restart vector buy you?

Refutation prompt:     Karpicke & Blunt found retrieval beat concept
                       mapping. What confound did Mayrhofer et al.
                       (2023) identify, and what happened to the
                       effect once they controlled for it?
```

The third form is the one that builds real understanding, because it requires holding a claim, its challenge, and the resolution simultaneously — a subgraph, not a node.

One property worth exploiting: [evergreen note maintenance approximates spaced repetition](https://notes.andymatuschak.org/Evergreen_note_maintenance_approximates_spaced_repetition). Revisiting and revising notes over time delivers spacing, elaboration, and the generation effect as a side effect of using the system. Matuschak is careful about the limits — the practice does _not_ efficiently leverage the testing effect, since re-reading your own note is not retrieval — so treat it as a supplement to explicit scheduling, not a replacement. It does mean a well-tended graph is never _only_ a storage system.

---

## Part VII — Operating cadence

```
DAILY      capture to inbox (no linking, no organizing)
           FSRS review queue

48-HOUR    distill captures → atomic claim-titled notes, own words
    SLA    author typed edges as you write
           accept/reject L3 embedding proposals inline

WEEKLY     promote stable claims → SRS prompts (edge-form preferred)
           review orphan notes (no in-edges = probably didn't matter)

MONTHLY    batch L4 extraction over new/modified notes
           inspect Leiden communities vs. your folder structure
           run L6 gap analysis → each gap becomes a research question
           prune: delete notes you'd no longer write

QUARTERLY  re-read your oldest cluster; check for ossification
           revise or split your relation vocabulary if it's drifting
```

The monthly gap-analysis step is the one people skip and the one that generates the most value. A structural gap is a _pre-formulated research question you didn't have to think of._

---

## Part VIII — Failure modes

**Tool-hopping instead of processing.** The canonical loop: a new system, a new method, a new tool, starting over each time. [The underlying issue is that you're collecting rather than actively thinking](https://meda.io/why-you-take-notes-but-never-get-smarter/) — and switching tools is a socially acceptable way to feel productive while doing neither. Give any stack six months before evaluating it.

**Optimizing the artifact.** Covered above, but it bears repeating: a dense graph is a _signal_ of intellectual effort, which is not the same as evidence of it.

**Unreviewed auto-edges.** Schema-free extraction yields [inconsistent typing and fragmented relations](https://arxiv.org/abs/2603.25152); role confusion is [documented in the vendors' own tests](https://neo4j.com/blog/developer/unstructured-text-to-knowledge-graph/). An unreviewed extracted graph is plausible-looking and quietly wrong, which is the worst possible property for a system you're using to _learn_.

**Continuous extraction.** LLM-based construction is token-expensive enough that an entire branch of the literature exists to [avoid it](https://arxiv.org/abs/2604.17458). Batch monthly.

**Structure ossification.** [The topology you committed to early becomes a cage.](https://engineeringideas.substack.com/p/reflection-on-two-years-of-writing) Schedule explicit restructuring; treat `memify`-style schema evolution as a feature to use, not a curiosity.

**Building only one loop.** Structure without retention → beautiful graph, no recall. Retention without structure → isolated facts, no transfer. The Karpicke/Novak debate reads as a fight only if you assume you must pick one.

---

## The minimal viable stack

If you take one configuration from this article:

| You are | Build |
| --- | --- |
| **Starting out** | Obsidian + claim-titled atomic notes + Smart Connections. Nothing else. Add typed links only once linking is a habit. |
| **200+ notes, want depth** | Above + Breadcrumbs (9 relation types) + Juggl + monthly InfraNodus gap analysis + Anki/FSRS with edge-form prompts. |
| **Technical, want to build** | Above + monthly ontology-constrained GraphRAG extraction into Neo4j/Kuzu, Graphiti for bitemporal edges, PPR-based retrieval, custom propose-review-commit queue ranked by community distance. |

---

## The one-paragraph version

Build the map yourself, because construction outperforms consumption by roughly 1.7 to 1. Title notes as claims and write them in your own words, because the reformulation _is_ the learning. Type your edges with a small closed vocabulary, because an untyped link discards the information you actually needed. Let embeddings, extraction, and gap analysis _propose_ connections you'd never find alone — and never let them commit, because a graph the machine authored is a picture of the machine's understanding, not yours. Rank proposals by how far apart they sit in the graph, not how similar they look. Then close the loop with spaced repetition on prompts that test relationships rather than facts, because a latticework you cannot recall is indistinguishable from one you never built.

The graph is not the point. The graph is what's left over when you've done the thinking.

---

## Sources

**Learning science**

- Sundar, K. — [Concept Mapping](https://www.aft.org/ae/spring2022/sundar), _American Educator_
- Krieglstein, Schneider, Beege & Rey (2022) — [How the design and complexity of concept maps influence cognitive learning processes](https://pmc.ncbi.nlm.nih.gov/articles/PMC8788906/), _Educational Technology Research and Development_ 70(1), 99–118
- Anastasiou, Wirngo & Bagos (2024) — [The Effectiveness of Concept Maps on Students' Achievement in Science: A Meta-Analysis](https://ir.library.illinoisstate.edu/gred/1/), _Educational Psychology Review_ 36, art. 39
- [Concept Map research summary](https://ablconnect.harvard.edu/concept-map-research), Harvard ABLConnect
- Karpicke & Blunt (2011) — [Retrieval Practice Produces More Learning than Elaborative Studying with Concept Mapping](https://www.science.org/doi/10.1126/science.1199327), _Science_ 331(6018)
- Mintzes et al. (2011) — [Comment on Karpicke & Blunt](https://www.science.org/doi/10.1126/science.1203698), _Science_
- Lechuga et al. (2015) — [Further evidence that concept mapping is not better than repeated retrieval as a tool for learning from texts](https://www.sciencedirect.com/science/article/abs/pii/S0959475215300232), _Learning and Instruction_ 40, 61–68
- Mayrhofer, Kuhbandner & Frischholz (2023) — [Re-examining the testing effect as a learning strategy: the advantage of retrieval practice over concept mapping as a methodological artifact](https://pmc.ncbi.nlm.nih.gov/articles/PMC10783554/), _Frontiers in Psychology_

**Method and practice**

- Tietze, C. — [The Collector's Fallacy](https://zettelkasten.de/posts/collectors-fallacy/), zettelkasten.de
- Matuschak, A. — [Working notes](https://notes.andymatuschak.org/), incl. [prompts should connect and relate ideas](https://notes.andymatuschak.org/z3whk8UxFRFLgUQX9f7Fr2o) and [evergreen note maintenance approximates spaced repetition](https://notes.andymatuschak.org/Evergreen_note_maintenance_approximates_spaced_repetition)
- Matuschak, A. — [Five years of evergreen notes](https://www.patreon.com/posts/five-years-of-109216672) (members post)
- [Evergreen notes: a complete guide](https://fabric.so/learn/evergreen-notes)
- [Reflection on two years of writing evergreen notes](https://engineeringideas.substack.com/p/reflection-on-two-years-of-writing)
- [Why You Take Notes But Never Get Smarter](https://meda.io/why-you-take-notes-but-never-get-smarter/)

**Tools**

- [Obsidian's Graph View Is Beautiful and Almost Completely Useless](https://codeculture.store/blogs/developer-culture/obsidian-graph-view-useful)
- [Smart Connections](https://github.com/brianpetro/obsidian-smart-connections) · [docs](https://smartconnections.app/smart-connections/) · [plugin page](https://community.obsidian.md/plugins/smart-connections)
- [Reor](https://github.com/reorproject/reor/blob/main/README.md) · [Show HN discussion](https://webbindustries.com/hackernews/story/39372159)
- [Juggl — Link Types](https://juggl.io/link-types.html) · [Breadcrumbs](https://github.com/michaelpporter/breadcrumbs)
- [Personal Knowledge Graphs in Obsidian](https://volodymyrpavlyshyn.medium.com/personal-knowledge-graphs-in-obsidian-528a0f4584b9) · [Exporting an Obsidian vault to RDF](https://volodymyrpavlyshyn.medium.com/how-to-export-your-obsidian-vault-to-rdf-00fb2539ed18)
- [Capacities vs Tana](https://fabric.so/comparison/capacities-vs-tana) · [Switching from Tana](https://docs.capacities.io/migration/switching-from-tana) · [Tana review](https://pickuma.com/for-dev/tana-personal-knowledge-management-review/)
- [InfraNodus — how it works](https://infranodus.com/about/how-it-works) · [PKM use case](https://infranodus.com/use-case/visualize-knowledge-graphs-pkm) · [API](https://infranodus.com/api)

**Semantic layer / research**

- Edge et al. (2024) — [From Local to Global: A Graph RAG Approach to Query-Focused Summarization](https://arxiv.org/abs/2404.16130) · [microsoft/graphrag](https://github.com/microsoft/graphrag)
- Gutiérrez et al. (2024) — [HippoRAG: Neurobiologically Inspired Long-Term Memory for LLMs](https://arxiv.org/abs/2405.14831), NeurIPS
- [HippoRAG 2 / From RAG to Memory: Non-Parametric Continual Learning for LLMs](https://arxiv.org/abs/2502.14802)
- Rasmussen et al. (2025) — [Zep: A Temporal Knowledge Graph Architecture for Agent Memory](https://arxiv.org/abs/2501.13956)
- Wang et al. (2026) — [OMD-GraphRAG: Enhancing GraphRAG with Ontology-Guided Extraction, Multi-Dimensional Clustering and Dual-Channel Fusion](https://arxiv.org/abs/2603.25152)
- Song et al. (2026) — [EHRAG: Bridging Semantic Gaps in Lightweight GraphRAG via Hybrid Hypergraph Construction and Retrieval](https://arxiv.org/abs/2604.17458)
- [AI Agent Memory Architectures](https://zylos.ai/research/2026-04-05-ai-agent-memory-architectures-persistent-knowledge/) · [Zep vs Cognee](https://vectorize.io/articles/zep-vs-cognee)
- [How to convert unstructured text to knowledge graphs using LLMs](https://neo4j.com/blog/developer/unstructured-text-to-knowledge-graph/), Neo4j

**Spaced repetition**

- [What spaced repetition algorithm does Anki use?](https://faqs.ankiweb.net/what-spaced-repetition-algorithm), Anki FAQs
- Borretti, F. — [Implementing FSRS in 100 Lines](https://borretti.me/article/implementing-fsrs-in-100-lines)
- [A technical explanation of FSRS](https://expertium.github.io/Algorithm.html)
