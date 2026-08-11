// "Where the work was done" — one paragraph per organisation for the home
// page. The timeline above it names them; this says what they are and what the
// actual relationship was.
//
// Scope matches src/_data/cv.js: the published history starts at PwC
// Österreich (Jun 2022). `start` exists only to sort these rows into the same
// newest-first order as the CV, and is never rendered.

const orgs = [
  {
    name: "ORBIS Austria",
    relationship: "Employment",
    start: "2026-08-01",
    period: "2026 — present",
    summary: "Enterprise data and AI architecture",
    body:
      "A European business consultancy and systems integrator working across SAP, Microsoft and manufacturing IT. As Principal Enterprise Architect for Data & AI I own the platform and AI strategy: what gets built, on which stack, and how governance, security and scale are designed in rather than retrofitted.",
    url: "https://www.orbis.de/",
  },
  {
    name: "CANCOM Austria",
    relationship: "Employment",
    start: "2025-11-01",
    period: "2025 — 2026",
    summary: "Data and AI platforms for enterprise clients",
    body:
      "One of Austria's larger IT service providers. Solutions architect in the Digital Makers team, advising enterprise architects, solution designers and C-level on data and AI architecture, and delivering data-intensive business cases end to end — from the first requirements workshop to a running platform.",
    url: "https://www.cancom.at/",
  },
  {
    name: "FZEBA.com",
    relationship: "Founded & led",
    start: "2025-02-01",
    period: "2025 — present",
    summary: "My own name, my own engagements",
    body:
      "Data-driven software development taken on directly rather than through an employer, and the vehicle for work that does not fit inside a consultancy engagement. It has run alongside every employed role since 2025.",
    url: "https://www.fzeba.com",
  },
  {
    name: "SOFTWERK",
    relationship: "Employment",
    start: "2025-02-01",
    period: "2025",
    summary: "Data engineering for finance, manufacturing and agriculture",
    body:
      "A software engineering firm building custom systems for Austrian mid-market clients. Led data engineering projects from requirements to delivery, and automated pipelines in Azure Data Factory with PySpark that replaced manual data handling in finance, manufacturing and agriculture.",
    url: "https://www.softwerk.at/",
  },
  {
    name: "PwC Österreich",
    relationship: "Employment",
    start: "2022-06-01",
    period: "2022 — 2025",
    summary: "Management and BI consulting, then tax technology",
    body:
      "The Austrian arm of the professional services firm. Two years and eight months across two roles: first as Senior Associate building automated data pipelines and BI dashboards for controlling and logistics, then in Tax Technology, where the work was automating tax, accounting and controlling processes with RPA and making ERP data — BMD, Business Central, Dynamics — actually usable for analytics.",
    url: "https://www.pwc.at/",
  },
];

// Same newest-first order as cv.roles, applied here rather than maintained by
// hand.
orgs.sort((a, b) => b.start.localeCompare(a.start));

export default orgs;
