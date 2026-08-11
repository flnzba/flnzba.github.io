// Consulting services. Copy here is a first draft written from the CV — read
// it before this page goes live. Anything commercial (rates, availability) is
// left null and renders nothing at all; the templates only show these once a
// real value is set, so nothing is ever invented or advertised as "TBC".

export default {
  intro:
    "I work on enterprise data platforms and the AI built on top of them. Most of the value is not in picking a model — it is in the architecture around it: where the data comes from, who is allowed to see it, what breaks the build when it drifts, and whether anyone can reconstruct why a number is what it is six months later.",

  positioning:
    "Engineering, consulting and enterprise architecture — PwC, SOFTWERK, CANCOM, ORBIS — plus my own practice run alongside them. Austria-based, remote or on-site.",

  services: [
    {
      id: "advisory",
      name: "Advisory",
      basis: "Hourly",
      rate: null,
      summary: "Pressure-test a decision before it becomes an architecture.",
      body:
        "Working sessions on a specific decision — build versus buy, platform selection, how to structure a migration. You get a written summary with the alternatives named and the trade-offs stated, plus async follow-up. Usually a handful of sessions rather than an ongoing engagement.",
      deliverables: ["Written summary per session", "Named alternatives and trade-offs", "Async follow-up"],
    },
    {
      id: "diagnostic",
      name: "Technical diagnostic",
      basis: "Fixed scope",
      rate: null,
      summary: "A bounded review of a platform that is not behaving.",
      body:
        "Three to five days looking at an existing data or AI platform: architecture, data flow, governance, evaluation and the failure modes nobody has written down. Ends in a ranked findings document and a walkthrough with the engineers who have to act on it.",
      deliverables: ["Ranked findings document", "Engineer walkthrough", "Fixed scope, fixed price"],
    },
    {
      id: "delivery",
      name: "Project delivery",
      basis: "Per engagement",
      rate: null,
      summary: "Design and build the platform, not just the diagram.",
      body:
        "End-to-end delivery of a data or AI platform — requirements, architecture, pipelines, governance and handover. Azure, Microsoft Fabric, Databricks, AWS. Specification first, fixed price against it, working software and documentation at the end.",
      deliverables: ["Written specification up front", "Working software", "Handover documentation"],
    },
    {
      id: "architect",
      name: "Fractional architect",
      basis: "Monthly retainer",
      rate: null,
      summary: "Senior data and AI architecture without the headcount.",
      body:
        "Technical direction for teams that need architectural judgement more often than they need another full-time architect: platform strategy, vendor evaluation, reviewing what the team is building, and translating between engineering and the people funding it.",
      deliverables: ["Technical direction", "Vendor and build-versus-buy strategy", "Stakeholder translation"],
    },
  ],

  process: [
    {
      step: "01",
      name: "A short call",
      body: "Thirty minutes to work out whether this is a problem I can actually help with. Free, and I will say so if the answer is no.",
    },
    {
      step: "02",
      name: "A written specification",
      body: "Scope, approach and price in writing before anything is built. Charged, and credited against delivery if we go ahead.",
    },
    {
      step: "03",
      name: "Visible progress",
      body: "Work lands in your repository as it happens, not in a status deck at the end of the month.",
    },
  ],

  // Not published. Set a string here to show an availability line.
  availability: null,
};
