// Research entries shown on /research/ and summarised on the home page.
//
// `papers` are formal write-ups; `applied` are long-form investigations
// published as posts here. Every figure in `metrics` carries a `source` —
// nothing goes on the page that cannot be pointed at.

export default {
  statement:
    "The thread through the work is the same question in two settings: how do you know a system did what it was asked? In enterprise data platforms that means lineage, contracts and tests that fail a build rather than a review. In agentic systems it means governance you can prove, not guardrails you hope hold. Both are the same problem — making a result checkable instead of plausible.",

  papers: [
    {
      title: "Cortex: A Fixed-Point Theory of Governed Coding Agents",
      authors: ["Marius-Constantin Dinu", "Florian Zeba"],
      // Rendered in bold so co-authorship reads at a glance.
      me: "Florian Zeba",
      affiliation: "Alpha Omega Labs",
      status: "Draft",
      year: 2026,
      date: "2026-06-29",
      pages: 21,
      // Citation metadata. Only the BibTeX-specific bits live here — author
      // list, title, year, date and page count are reused from the fields
      // above by the `bibtex` / `plainCitation` filters, so a citation can
      // never drift from the card it sits under.
      //
      // `bibtexTitle` differs from `title` on purpose: the brace group stops
      // BibTeX's title-casing from rewriting the hyphenated compound. Values
      // match the co-author's canonical entry at dinu.at.
      citation: {
        type: "techreport",
        // The BibTeX cite key. Named citeId rather than "key" because a
        // field literally called `key` holding an alphanumeric value trips
        // gitleaks' generic-api-key rule and fails CI on a false positive.
        citeId: "dinu2026cortex",
        bibtexTitle: "Cortex: A {Fixed-Point} Theory of Governed Coding Agents",
        institution: "dinu.at",
        howpublished: "Published at https://www.dinu.at",
        url: "https://www.dinu.at/research/cortex-fixed-point-theory-governed-coding-agents",
      },
      abstract:
        "A coding agent is a large language model (LLM) wrapped in a control loop — a harness — that lets it plan, write, and execute code. Raw harnesses optimize next-token capability, not governed behavior: under adversarial input they can be induced to exfiltrate secrets or run destructive commands, and over a long task they silently abandon requirements. We study Cortex, a meta-level control layer that supervises a base harness. Cortex couples three faculties over the base agent: governance — deterministic pre-execution checks and capability/dependency policies that constrain which actions may run; orchestration — instruction analysis and long-horizon planning that decompose a task into a tracked requirement structure with milestones and a semantic contract; and a validate–repair loop that drives those requirements to verified completion. In control-theoretic terms it is a supervisory controller, and in AI terms a metareasoner over the base policy: it decides not only whether an action is admissible but what the agent should attempt next and whether further computation is worthwhile — direction a guardrail layer alone cannot provide (a filter cannot plan a long-horizon task). Our contributions are fourfold. First, we give Cortex a precise semantics: its governance checks are a projection onto an admissible action set, and its planning–validate–repair loop is an inflationary, monotone operator on the lattice of satisfied requirements. Second, we prove that this loop converges to a least fixed point in a bounded number of iterations, is sound with respect to a validation oracle, and is independent of execution order (Theorem 1) — a guarantee absent from single-pass agents. Third, we define a chance-calibrated suite of evaluation metrics for safety (adversarial attack-success with exact confidence intervals) and capability (trajectory similarity and a gated multi-signal composite), and characterize their range and calibration. Fourth, as a non-replacing addition, we add a probabilistic execution view — a monotone Markov transition layer over the same requirement lattice: it does not define correctness (the fixed-point semantics do that) but makes iteration count, reasoning budget, completion probability, expected hitting time, and risk reduction measurable. Empirically, across five task families, placing the same base model behind Cortex sharply reduces adversarial attack-success while preserving or improving capability, with the largest gains over long horizons where single-pass harnesses decay.",
      summary:
        "Treats an agent's validate–repair cycle as a monotone operator on a lattice of satisfied requirements, so \"done\" becomes a least fixed point you can prove rather than a heuristic stopping rule. Guardrails can only remove an unsafe action; they cannot supply direction, which is why filtering alone does not fix the second failure mode — an agent quietly abandoning requirements halfway through a long task.",
      metrics: [
        {
          label: "Adversarial attack success",
          value: "42.4% → 24.1%",
          source: "Frontier models, 43% relative reduction",
        },
        {
          label: "Capability on single-file tasks",
          value: "Parity",
          source: "Gains concentrated on long-horizon work",
        },
        { label: "Pages", value: "21", source: "Draft, 29 June 2026" },
      ],
      tags: ["research-paper", "ai-agents", "formal-methods", "ai-safety"],
      links: [
        {
          label: "PDF",
          href: "https://www.dinu.at/papers/cortex-fixed-point-theory-governed-coding-agents.pdf",
          external: true,
        },
        {
          label: "Co-author's entry",
          href: "https://www.dinu.at/research/cortex-fixed-point-theory-governed-coding-agents",
          external: true,
        },
        {
          label: "Benchmark docs",
          href: "https://benchmark.cortex.a2olabs.com/docs.html",
          external: true,
        },
      ],
    },
  ],

  // Long-form applied work published here. `post` is a slug under /posts/.
  applied: [
    {
      title: "The Graph Is Not the Point",
      post: "64-graphs-for-learning",
      year: 2026,
      note:
        "What the learning-science literature actually supports about concept maps, why the untyped wikilink is a lossy encoding, and how to layer embeddings, LLM triple extraction and structural gap detection on top without letting the machine author your graph.",
    },
  ],

  // Not yet supplied — rendered as styled placeholders.
  talks: [],
};
