// Canonical career source. The /about/ profile page, the home-page career
// section and the "roles held, to scale" figure all read from here — edit this
// file, not the templates.
//
// DELIBERATELY ANONYMOUS. This file names no employer, no client and no date.
// Roles carry a job title, a sector descriptor and a position on an abstract
// axis. That is enough to show seniority, trajectory and how the work
// overlapped, and not enough to reconstruct an employment history. Do not add
// organisation names, start dates or per-role task descriptions back in — the
// figure is built to need none of them.
//
// `type` drives the bar colour and the relationship chip: industry | founded.

// Timeline geometry. `from` and `to` are positions on an arbitrary axis, not
// dates: only their differences and overlaps mean anything, and the unit is
// deliberately undefined. `to: null` means ongoing — the bar runs to the end of
// the axis and is masked to fade out. To add a role, place it on the same axis
// relative to the others; the percentages below are recomputed from the data.
const cv = {
  location: "Austria",

  // Shown as the credentials line under the hero.
  credentials: ["MSc Computer Science", "MSc Information Systems", "LL.B.", "Ing."],

  roles: [
    {
      role: "Principal Enterprise Architect · Data & AI",
      short: "Principal Enterprise Architect",
      sector: "Business consultancy & systems integrator",
      type: "industry",
      from: 50,
      to: null,
    },
    {
      role: "AI, Data & Software Engineer",
      short: "Independent practice",
      sector: "Independent practice — my own engagements",
      type: "founded",
      from: 32,
      to: null,
    },
    {
      role: "Data & AI Architect",
      short: "Data & AI Architect",
      sector: "IT services provider",
      type: "industry",
      from: 41,
      to: 49,
    },
    {
      role: "Software Engineering",
      short: "Software Engineering",
      sector: "Software engineering firm",
      type: "industry",
      from: 32,
      to: 41,
    },
    {
      role: "Tax Technology Engineer & Consultant",
      short: "Tax Technology Engineer",
      sector: "Professional services firm",
      type: "industry",
      from: 23,
      to: 32,
    },
    {
      role: "Senior Associate · Management & BI Consulting",
      short: "Senior Associate · BI",
      sector: "Professional services firm",
      type: "industry",
      from: 0,
      to: 23,
    },
  ],

  // Degrees without institutions: the qualification is the ability claim, the
  // school is an identifier. `status` marks a degree still in progress — that
  // is a fact, not a missing value.
  education: [
    { degree: "Master of Science — Computer Science", status: "Ongoing" },
    { degree: "Master of Science — Information Systems", status: "Ongoing" },
    { degree: "Master's degree — Business Informatics & Management" },
    { degree: "Bachelor of Laws (LL.B.) — Business Law" },
    { degree: "Ingenieur (Ing.) — Mechatronics, Robotics & Automation" },
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

// One canonical order, applied here rather than in each template: latest role
// first. Ties keep declaration order, so concurrent roles stay in the order
// written above.
cv.roles.sort((a, b) => b.from - a.from);

// ── Bar geometry ────────────────────────────────────────────────────────────
// Computed here rather than in a template filter so the figure has exactly one
// source of truth and the axis can never drift from the roles it draws.
//
// Headroom keeps an ongoing bar from running flush into the edge of the axis,
// which would read as "ends here" rather than "still running".
const HEADROOM = 8;
// A very short role still has to be visible; below this it reads as a gap.
const MIN_WIDTH = 3;

const origin = Math.min(...cv.roles.map((r) => r.from));
// The axis has to clear the latest thing on it — the last role to end, and the
// last role to start, since an ongoing role may begin after every other ends.
const furthest = Math.max(...cv.roles.map((r) => (r.to === null ? r.from : r.to)));
const axis = furthest - origin + HEADROOM;

for (const r of cv.roles) {
  if (r.to !== null && r.to < r.from) {
    throw new Error(`cv.js: role "${r.role}" ends (${r.to}) before it starts (${r.from}).`);
  }
  const round2 = (n) => Math.round(n * 100) / 100;
  const pct = (n) => ((n - origin) / axis) * 100;

  r.left = round2(pct(r.from));
  // Ongoing roles run to the end of the axis; the bar is masked to fade out.
  r.width = round2(Math.max(pct(r.to === null ? origin + axis : r.to) - r.left, MIN_WIDTH));
}

export default cv;
