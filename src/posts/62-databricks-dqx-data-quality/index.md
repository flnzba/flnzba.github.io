---
title: 'Stop the Garbage Before It Lands: A Deep Look at Databricks Labs DQX'
description: >-
  A practical guide to DQX, the PySpark-native data quality framework from Databricks Labs that quarantines bad data before it reaches your gold tables.
date: '2026-05-29'
updated: '2026-05-29'
tags:
  - data quality
  - databricks
  - pyspark
  - data engineering
  - lakeflow
number: 47
canonical_url: 'https://www.fzeba.com/posts/47-databricks-dqx-data-quality/'
published: true
---
## Stop the Garbage Before It Lands: A Deep Look at Databricks Labs DQX

> *Bad data costs more than missed insights — it costs trust. DQX intercepts the bad rows before they reach your gold tables.*

## The Cost of "Validate Later"

Every data platform eventually runs into the same pattern: data lands in a bronze table, transformations run, dashboards refresh, and *then* someone notices the customer IDs are negative or the timestamps are in the wrong timezone. By then, machine-learning models have trained on the garbage, executives have made decisions on the garbage, and downstream consumers have built reports on the garbage. The cleanup is always more expensive than the prevention.

The traditional answer — run quality checks against persisted tables as a separate batch job, surface dashboards of failures — is *reactive*. It tells you what already went wrong. It doesn't stop the bad data from being written in the first place.

**DQX** (Data Quality eXtended) is a data-quality framework from **Databricks Labs** built for proactive validation: define your rules in code or YAML, intercept the DataFrame *during* processing, drop or quarantine or annotate the rows that fail, and only write the good ones downstream. The full name is sometimes "Databricks Labs DQX," and the project lives under the `databrickslabs/dqx` GitHub organization with documentation at https://databrickslabs.github.io/dqx/.

## What DQX Is (And What It Isn't)

DQX is a **Python library** built on PySpark. It validates PySpark DataFrames and Delta tables. It runs anywhere Spark runs — Databricks Jobs, notebooks, standard clusters, serverless clusters, Lakeflow Pipelines (formerly Delta Live Tables / DLT), even outside Databricks if you bring your own Spark environment.

It is not:

- a replacement for **DLT expectations** if you're already inside a Lakeflow pipeline (DLT expectations work fine for in-pipeline checks; DQX is for the broader set of cases)
- a replacement for **Lakehouse Monitoring** which does retrospective profiling of production tables
- a general-purpose tabular validator outside Spark (use Great Expectations, Pandera, or Soda for that)

The DQX team frames the architectural choice clearly: use DLT expectations *for* DLT pipelines, use Lakehouse Monitoring *for* periodic reactive profiling, use DQX *for* proactive inline validation and quarantining in custom Spark jobs. The three tools complement rather than compete.

## The Two Operating Modes

DQX gives you two ways to apply checks to a DataFrame, picked based on what you want to do with the bad rows:

**Mode 1: Quarantine.** Bad rows go to a separate quarantine DataFrame or table; good rows continue downstream. This is the proactive guardrail — bad data never reaches your gold tables. You investigate the quarantine offline, fix upstream issues, and reprocess.

**Mode 2: Annotate.** Bad rows stay in place but get tagged with additional columns describing what failed and why. Downstream consumers can filter on the tags. This is useful when you can't drop the rows but need to record their quality status.

Both modes give you the *same* rule definitions — you choose at apply time.

## Defining Checks: YAML or Python

DQX gives you two equivalent ways to define rules.

**YAML config-driven**:

```yaml
- criticality: error
  check:
    function: is_not_null_and_not_empty
    arguments:
      column: customer_id
- criticality: warn
  check:
    function: is_in_range
    arguments:
      column: age
      min_limit: 0
      max_limit: 120
```

**Python code-driven**:

```python
from databricks.labs.dqx.rule import DQRule
from databricks.labs.dqx.col_functions import is_not_null_and_not_empty, is_in_range

checks = [
    DQRule(
        name="customer_id_required",
        criticality="error",
        check=is_not_null_and_not_empty("customer_id"),
    ),
    DQRule(
        name="age_in_range",
        criticality="warn",
        check=is_in_range("age", min_limit=0, max_limit=120),
    ),
]
```

Both approaches support the same features. The choice is between *config-driven* (auditable, externalizable, easy for non-engineers to modify) and *code-driven* (testable, refactorable, type-checked).

## Check Levels: Warning vs. Error

Every DQX check has a **criticality**: `error` or `warn`. The distinction is operational:

- **error** — the row is broken. Drop it or quarantine it; do not let it through to gold.
- **warn** — the row is suspicious. Tag it; let it through, but mark it for investigation.

This separation is more important than it looks. Most data-quality frameworks have a single "pass/fail" notion, which forces you to either be too strict (drop legitimate edge cases) or too loose (let bad data through). The warn level captures the real-world middle ground.

## Granularity: Row, Column, and Dataset Level

DQX supports checks at three levels:

- **Row-level** — applied per row: "this row's `customer_id` must not be null"
- **Column-level** — applied across a column: "the `age` column's nulls must be < 5%"
- **Dataset-level** — applied across the whole DataFrame: "the row count must be within 10% of yesterday's"

This is broader than what frameworks like Great Expectations historically supported, and it matches the actual shape of real-world quality concerns. Some failures are local to a row; some are statistical properties of a column; some only make sense as cross-DataFrame invariants.

## Profiling: Generate Your First Pass of Rules Automatically

Writing the first set of rules for a new dataset is the hardest part of any quality framework. DQX includes a **profiler workflow** that analyzes a configurable sample of your dataset and emits a set of candidate quality rules — null thresholds, type constraints, value ranges, distinct-value counts, and more.

The profiler runs as a Databricks workflow (not scheduled by default — minimizing compute cost concerns). You point it at a table, it samples and analyzes, and it writes a YAML or JSON file of candidate checks. You then review the candidates, prune the ones that don't make sense, and commit the rest.

Critically, the profiler can also generate **Lakeflow Pipelines expectation statements** — so if you're moving from DQX to DLT (or running both), the rule definitions translate.

## Anomaly Detection with ML

A newer DQX feature is **row-level anomaly detection** using trained ML models with explanations. Instead of writing explicit rules for every kind of anomaly, you let a model learn the distribution of "normal" rows and flag outliers, with attribution explaining *why* a row was flagged.

This is the right approach for unstructured-ish tabular data where you don't know all the failure modes in advance — financial transactions, sensor readings, behavioral events.

## PII Detection: Built-In via Presidio

DQX shipped a built-in PII (Personally Identifiable Information) detection check (`does_not_contain_pii`) that uses Microsoft's **Presidio** framework under the hood. With `pip install databricks-labs-dqx[pii]`, you can add a check that fails any row containing detected PII — emails, phone numbers, credit-card numbers, SSNs, etc. This integrates compliance into the data quality flow rather than running it as a separate scan.

## Data Contracts: Generate Rules From ODCS

One of the more interesting DQX integrations is with the **Open Data Contract Standard (ODCS)** — a spec for declaring schema and quality requirements as machine-readable contracts. DQX can read an ODCS document and *generate the DQX rules from it*, including schema validation. This means:

- the data contract becomes the single source of truth
- the quality rules are derived rather than authored
- contract changes propagate automatically to enforcement
- consumers can publish ODCS documents and have producers validated against them

For organizations adopting data-contract patterns at scale, this is a key piece of plumbing.

## Streaming Support

DQX works with both **Spark Batch** and **Spark Structured Streaming**. The same rules and the same apply-mode semantics work for both. For streaming workloads, the proactive validation pattern is even more valuable than for batch — bad data in a real-time pipeline propagates fast, and quarantining at ingestion saves downstream incidents.

Lakeflow Pipelines (the rebranded Delta Live Tables) integration is first-class. You can either run DQX checks inside a Lakeflow pipeline, or use the profiler to generate Lakeflow expectations from your DQX rules.

## Why Embed Quality in the Pipeline?

The Hexaware analysis frames it well: traditional retrospective monitoring fails because it identifies issues *after* downstream consumers have already used the bad data. By embedding proactive, scalable checks into PySpark workflows, DQX turns quality control into "a continuous, strategic capability for business-ready data" rather than a periodic audit.

In a **Medallion architecture** (bronze → silver → gold), DQX is most valuable at two stages:

- **Ingestion (Bronze)** — validate raw external data before it propagates. You have no control over the source quality, so this is where the most defects appear.
- **Silver-to-Gold transition** — verify business-rule invariants are met before exposing data to analysts and downstream consumers.

A typical setup: ingest raw data → run DQX checks → quarantine bad rows to a `_quarantine` table → continue processing good rows → publish gold tables. A separate workflow inspects the quarantine table and routes incidents to data engineers via PagerDuty or Slack.

## Observability: Validation Summary and Dashboards

Every DQX run emits a structured validation summary: per-check pass/fail counts, sample failing rows, criticality breakdown, timing. DQX bundles a quality dashboard for visualizing these summaries over time, identifying recurring issues, and triaging incidents.

The detailed per-check failure metadata is what makes incident response practical. When a check fails on 0.2% of rows, you want to know *which* 0.2% and *why* — DQX gives you both, with the row-level failure information preserved.

## When You Reach for DQX

DQX is the right choice when:

- You're already on **Databricks** or running **PySpark** elsewhere
- You want **proactive, inline** validation rather than reactive monitoring
- You need **quarantine semantics** — separating bad rows from good
- You want **profiler-generated** rules as a starting point
- You have **streaming** data quality concerns alongside batch
- You're adopting **data contracts** (ODCS or otherwise)
- You need **PII detection** integrated with quality checks

It's less of a fit when:

- You're on pandas/Polars without Spark — use Great Expectations or Pandera instead
- You only need expectation checks inside DLT — DLT's native expectations work fine
- You only need retrospective profiling — Lakehouse Monitoring is purpose-built

## Installation and Getting Started

```python
# Install
pip install databricks-labs-dqx

# Optional extras for PII detection
pip install 'databricks-labs-dqx[pii]'
```

The standard workflow:

1. **Profile** your input dataset (one-time, generates candidate rules)
2. **Review and edit** the generated YAML
3. **Apply** the rules to your processing pipeline (quarantine or annotate mode)
4. **Schedule** the pipeline (Databricks Jobs, Airflow, etc.)
5. **Monitor** the quality dashboard

The full documentation walks through each step with example code. Demo notebooks are available in the repository.

## The Bigger Picture

The data-quality space has matured rapidly. **Great Expectations** pioneered code-first validation. **Soda** popularized SodaCL. **dbt tests** are now standard for SQL transformations. **Lakehouse Monitoring** ships with Databricks for retrospective monitoring. **DLT expectations** handle in-pipeline checks within Lakeflow.

DQX's distinctive contribution is the combination of:

1. **PySpark-native** validation (not a bolt-on)
2. **Quarantine semantics** that protect downstream tables
3. **Profiler-generated rules** to bootstrap new datasets
4. **Streaming and batch parity**
5. **ML-based anomaly detection** alongside explicit rules
6. **ODCS data contract integration**
7. **PII detection built-in**

For PySpark-based data platforms — especially on Databricks — DQX is the most complete proactive quality framework currently available.

---

## Sources

- DQX official documentation — https://databrickslabs.github.io/dqx/
- DQX motivation page — https://databrickslabs.github.io/dqx/docs/motivation/
- DQX GitHub repository — https://github.com/databrickslabs/dqx
- DQX profiling guide — https://databrickslabs.github.io/dqx/docs/guide/data_profiling/
- DQX releases — https://github.com/databrickslabs/dqx/releases
- Databricks: *"Data Quality Management on the Databricks Lakehouse Platform"* — https://www.databricks.com/discover/pages/data-quality-management
- Sajad Ahmadi: *"DQX, A Spark-based framework for Data Quality Checks"* — https://sajadahmdi.medium.com/dqx-a-spark-based-framework-for-data-quality-checks-part-1-e4d59e91fe09
- Viktor K: *"Preventing Data Disasters: A Guide to Proactive Quality Checks with DQX on Databricks"* — https://medium.com/@vsanmed/preventing-data-disasters-a-guide-to-proactive-quality-checks-with-dqx-on-databricks-e5456be172ec
- Hexaware: *"Databricks DQX: Proactive Data Quality Framework"* — https://hexaware.com/blogs/databricks-dqx-data-quality-framework/
- WaitingForCode: *"Data quality on Databricks — DQX"* — https://www.waitingforcode.com/databricks/data-quality-databricks-dqx/read
- Open Data Contract Standard (ODCS) — https://github.com/bitol-io/open-data-contract-standard
- Microsoft Presidio (PII detection) — https://github.com/microsoft/presidio
- Lakeflow Pipelines (formerly Delta Live Tables) overview — https://docs.databricks.com/en/delta-live-tables/index.html
