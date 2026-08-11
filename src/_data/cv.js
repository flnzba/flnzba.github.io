// Canonical CV source. The /cv/ page, the home-page career section and the
// "roles held, to scale" timeline figure all read from here — edit this file,
// not the templates.
//
// Roles carry ISO `start` and a nullable `end` (null === ongoing) so the
// timeline can be drawn to scale. `type` drives the bar colour and the
// relationship chip: industry | founded | advisory.
//
// Source: LinkedIn profile export (tmp/Profile.pdf). Bullets were written in
// German there and are translated here to match the site language.
//
// Scope: the published history starts at PwC Österreich (Jun 2022). Earlier
// roles are deliberately not listed here, so nothing downstream can render
// them. Anything derived from the history — the "years" metric, the timeline
// axis — reads from this array rather than a hardcoded date.

const cv = {
  headline: "Delivering value with software · Information systems design",
  location: "Linz · Wels · Steyr, Austria",
  summary:
    "AI, data and software architecture are my fields of expertise. I design the platforms enterprises run their data on, and I still write the pipelines that fill them. Studied law, AI and computer science at Johannes Kepler University Linz and FernUniversität in Hagen.",

  // Shown as the credentials line under the hero.
  credentials: ["MSc Computer Science", "MSc Information Systems", "LL.B.", "Ing."],

  roles: [
    {
      org: "ORBIS Austria GmbH",
      shortOrg: "ORBIS Austria",
      role: "Principal Enterprise Architect Data & AI",
      start: "2026-08-01",
      end: null,
      type: "industry",
      location: "Austria",
      url: "https://www.orbis.de/",
      stack: ["Azure", "Microsoft Fabric", "AWS", "Foundry"],
      bullets: [
        "Design data-driven and AI solutions across the client portfolio.",
        "Own data platform and AI strategy.",
        "Architect data and AI systems and platforms.",
        "Build solutions for governance, process optimisation and efficiency with AI.",
        "Technical consulting and solution system design.",
      ],
    },
    {
      org: "FZEBA.com",
      shortOrg: "FZEBA.com",
      role: "AI / Data / Software Engineer",
      start: "2025-02-01",
      end: null,
      type: "founded",
      location: "Austria",
      url: "https://www.fzeba.com",
      stack: ["Python", "TypeScript", "SQL", "Azure"],
      bullets: ["Data-driven software development under my own name."],
    },
    {
      org: "CANCOM Austria",
      shortOrg: "CANCOM Austria",
      role: "Data & AI Architect",
      start: "2025-11-01",
      end: "2026-07-01",
      type: "industry",
      location: "Linz, Upper Austria",
      url: "https://www.cancom.at/",
      team: "Digital Makers",
      stack: ["Azure", "Microsoft Fabric", "Databricks", "Python"],
      bullets: [
        "Solutions architect for data and AI platforms.",
        "Advised enterprise architects, solution designers, C-level and IT leads on data and AI architecture and strategy.",
        "Delivered data-intensive business cases end to end, from requirements to running system.",
        "Planned data architectures for business intelligence and AI solutions.",
        "Built AI architectures for enterprise settings — scalability, governance and security.",
        "Pre-sales engineering on data and AI use cases.",
      ],
    },
    {
      org: "SOFTWERK GmbH",
      shortOrg: "SOFTWERK",
      role: "Software Engineering",
      start: "2025-02-01",
      end: "2025-11-01",
      type: "industry",
      location: "Austria",
      url: "https://www.softwerk.at/",
      stack: ["Python", "Pandas", "scikit-learn", "PostgreSQL", "Azure Data Factory", "PySpark"],
      bullets: [
        "Led end-to-end data engineering projects from requirements analysis through to scalable delivery, using Python, SQL and REST API integrations.",
        "Architected and automated complex data processing pipelines in Azure Data Factory with PySpark, sharply reducing manual data handling for clients in finance, manufacturing and agriculture.",
        "Built and shipped data-driven software that gave clients actionable insight, on a stack of Apache Spark, SQL and Azure services.",
      ],
    },
    {
      org: "PwC Österreich",
      shortOrg: "PwC Österreich",
      role: "Tax Technology",
      start: "2024-05-01",
      end: "2025-02-01",
      type: "industry",
      location: "Vienna, Austria",
      url: "https://www.pwc.at/",
      stack: ["Power BI", "Alteryx", "KNIME", "RPA", "BMD", "MS Dynamics"],
      bullets: [
        "Extended existing information systems and built new ones.",
        "Raised efficiency in tax advisory, accounting and controlling by designing and automating processes with RPA and robust data workflows.",
        "Created transparent decision bases through strategic data models in Power BI, Alteryx and KNIME, making ERP data (BMD, MS Business Central / Dynamics) usable.",
        "Optimised data flows out of core ERP systems to improve data quality and give automation and analytics a consistent foundation.",
      ],
    },
    {
      org: "PwC Österreich",
      shortOrg: "PwC Österreich",
      role: "Senior Associate — Management & Business Intelligence Consulting",
      start: "2022-06-01",
      end: "2024-05-01",
      type: "industry",
      location: "Linz / Graz, Austria",
      url: "https://www.pwc.at/",
      stack: ["Alteryx", "KNIME", "Power BI", "SAP", "Excel"],
      bullets: [
        "Raised efficiency in controlling and logistics processes by designing and implementing automated data pipelines (Alteryx, KNIME) and interactive BI dashboards (Power BI, Excel).",
        "Built decision bases for management through precise data models and digital analytics solutions in the SAP environment.",
        "Supported strategic decisions at SMEs with analytical advice on M&A, restructuring, liquidation and company valuation (per KFS/BW 1).",
      ],
    },
  ],

  // The LinkedIn export carries no dates for any degree, so `period` stays
  // null and simply renders nothing. `status` marks a degree still in
  // progress — that is a fact, not a missing value.
  education: [
    {
      school: "FernUniversität in Hagen",
      degree: "Master of Science — Computer Science",
      period: null,
      status: "Ongoing",
      url: "https://www.fernuni-hagen.de/",
    },
    {
      school: "Ferdinand Porsche FERNFH",
      degree: "Master of Science — Information Systems",
      period: null,
      status: "Ongoing",
      url: "https://www.fernfh.ac.at/",
    },
    {
      school: "Hochschule Burgenland",
      degree: "Master's degree — Business Informatics & Management",
      period: null,
      url: "https://www.hochschule-burgenland.at/",
    },
    {
      school: "Johannes Kepler Universität Linz",
      degree: "Bachelor of Laws (LL.B.) — Wirtschaftsrecht",
      period: null,
      url: "https://www.jku.at/",
    },
    {
      school: "HTL Wels",
      degree: "Ingenieur (Ing.) — Mechatronics, Robotics & Automation",
      period: null,
      url: "https://www.htlwels.at/",
    },
  ],

  skills: [
    { group: "Data platforms", items: ["Data lakes", "Data governance", "Microsoft Fabric", "Databricks", "Azure Data Factory", "Delta Lake"] },
    { group: "Engineering", items: ["Python", "SQL", "PySpark", "TypeScript", "REST APIs", "PHP"] },
    { group: "Analytics & BI", items: ["Power BI", "Qlik Sense", "Alteryx", "KNIME", "SAP", "Excel"] },
    { group: "Cloud", items: ["Azure", "AWS", "Foundry", "Terraform", "Kubernetes"] },
    { group: "Advisory", items: ["Enterprise architecture", "AI strategy", "Pre-sales engineering", "Company valuation", "M&A analysis"] },
  ],

  certifications: [
    { name: "KNIME L1", issuer: "KNIME" },
    { name: "Bloomberg Market Concepts (BMC)", issuer: "Bloomberg" },
    { name: "Alteryx Designer Core", issuer: "Alteryx" },
    { name: "Qlik Sense Business Analyst", issuer: "Qlik" },
  ],

  languages: [
    { name: "German", level: "Native or bilingual" },
    { name: "Croatian", level: "Native or bilingual" },
    { name: "English", level: "Full professional" },
  ],
};

// One canonical order, applied here rather than in each template: newest role
// first. The timeline figure, the /cv/ experience list and the home-page
// organisation rows all inherit it.
cv.roles.sort((a, b) => b.start.localeCompare(a.start));

// Earliest published role, for anything that measures "how long" — so the
// figure can never drift from the history actually shown.
cv.since = cv.roles[cv.roles.length - 1].start;

export default cv;
