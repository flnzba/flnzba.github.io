---
title: '#46 Practical CI/CD with Terraform, Fabric CLI and fabric-cicd'
description: 'Terraform is a powerful tool for infrastructure as code, enabling you to define and manage your Microsoft Fabric resources programmatically.'
publishDate: '15 November 2025'
updatedDate: '15 November 2025'
coverImage:
    src: './cover.webp'
    alt: 'meeting data architecture'
tags: ['terraform', 'cli', 'microsoft-fabric']
---

## TL;DR

- Microsoft Fabric without automation = manual clicks, fragile checklists, and un-auditable deployments across DEV/TEST/PROD.
- Fabric CLI (`fab`) gives you a scriptable, file system–like interface to Fabric (list, navigate, copy, run items) that’s perfect for CI/CD pipelines.
- `fabric-cicd` is a Python library that takes artifacts from Git and fully deploys them into a Fabric workspace, handling:
  - Full “deploy from scratch” each time
  - Orphan cleanup (optional)
  - Environment-specific config via `parameter.yml` (IDs, endpoints, Spark pools, etc.)
- Together:
  - Use Fabric CLI to explore/export workspaces and wire up auth in CI.
  - Use `fabric-cicd` to do repeatable, parameterized deployments from Git into DEV/TEST/PROD.
- Example pattern:
  - Repo with `fab_workspace/` + `parameter.yml` + `deploy_fabric.py`.
  - GitHub Actions job that:
    - Logs in with a service principal
    - Uses `fab` to validate access
    - Runs `deploy_fabric.py` to deploy to PROD and optionally delete orphans.
- Result: no more “clickops”, better traceability, environment-aware config, and CI/CD for Fabric that looks like the rest of your engineering stack.

## Automating Microsoft Fabric deployments with Fabric CLI and fabric-cicd
If your Microsoft Fabric deployment process still involves screenshots, checklists, and “did you remember to update that connection?” messages, this one’s for you.

The Fabric CLI and the fabric-cicd library give you a code-first, automatable way to manage Fabric workspaces, artifacts, and environment promotions—without hand-rolling calls against half a dozen APIs or relying purely on the UI.

This article walks through:
- What Fabric CLI is and where it fits
- What fabric-cicd is and why it exists
- How they work together in a real CI/CD flow
- A concrete example with repo layout, parameterization, and a GitHub Actions pipeline

Audience: Data engineers, analytics engineers, platform/DevOps teams, and Fabric admins who like things repeatable.

### The problem: Fabric without automation

Typical anti-patterns you’ll recognize:
- Manual workspace setup in each environment
- Human-driven deployment steps (“click here, then there, hope for the best”)
- Copy-paste of notebooks, pipelines, and reports between DEV/TEST/PROD
- Mystery GUIDs and connection strings hardcoded all over the place

This does not:
- Scale
- Audit
- Roll back
- Survive people leaving the team

You want:
- Source-controlled definitions
- Automated promotions
- Environment-aware configuration
- Service principal / managed identity friendly workflows

That’s where Fabric CLI and fabric-cicd come in.

### Fabric CLI in a nutshell

Fabric CLI (`fab`) is a command-line interface for Microsoft Fabric that treats Fabric like a file system and makes it scriptable.

Key ideas:
- File system experience:
  - `fab ls` – list workspaces or items
  - `fab cd` – navigate into workspaces/items
  - `fab cp` / `fab rm` – copy/remove items
  - `fab run` – execute operations on items
- Automation-ready:
  - Works great inside GitHub Actions, Azure Pipelines, or any shell/script
  - Uses public Fabric REST, OneLake, and ARM APIs under the hood
- Flexible auth:
  - User, service principal, and managed identity support

Why you should care:
- Quickly inspect and manage Fabric resources from scripts
- No need to manually orchestrate multiple REST endpoints
- Perfect “front door” for pipelines that need to talk to Fabric

Install:
```bash
pip install --upgrade ms-fabric-cli
fab auth login
fab ls
```

### fabric-cicd in a nutshell

fabric-cicd is a Python library for code-first CI/CD with Microsoft Fabric.

Its job:
- Take artifacts from a Git repo
- Deploy them into a Fabric workspace
- Handle full deployments and clean-up of orphaned items
- Manage environment-specific values via parameterization

Core expectations (from the project docs):
- Full deployment every time (no diffing commits)
- Deploys into the tenant of the executing identity
- Works with items that support source control and public create/update APIs

Supported item types (selected examples, evolving over time):
- Notebooks
- DataPipelines
- Lakehouse, Warehouse, KQLDatabase, Eventhouse
- Reports and SemanticModels
- Dataflows, GraphQLApi, DataAgent, OrgApp, etc.

Why it exists:
- Hides direct API complexity
- Encourages Git-based, declarative deployments
- Gives you predictable, repeatable promotion of Fabric workspaces

Install:
```bash
pip install fabric-cicd
```

### Why use Fabric CLI and fabric-cicd together?

Short version: Fabric CLI is your control surface; fabric-cicd is your deployment engine.

Together they let you:
- Explore and export:
  - Use `fab` to inspect workspaces, back up or sync items.
- Codify:
  - Store exported definitions in Git as your source of truth.
- Deploy:
  - Use fabric-cicd to publish those items into target workspaces.
- Automate:
  - Wire all of this into GitHub Actions/Azure Pipelines using service principals.

Benefits:
- No more “clickops”
- Consistent, full, idempotent deployments
- Environment-specific config without forking artifacts
- Auditable, reviewable changes via pull requests

Now let’s make this concrete.

### Practical example: DEV → PROD with GitHub Actions

Goal:
- You maintain your Fabric workspace artifacts in Git
- On merge to main, you:
  - Deploy to a PROD Fabric workspace
  - Apply environment-specific values (IDs, endpoints, etc.)
  - Remove items in PROD that no longer exist in Git (optional, but powerful)

We’ll cover:
- Repo layout
- parameter.yml configuration
- Python deployment script using fabric-cicd
- GitHub Actions workflow using Fabric CLI for auth + fabric-cicd for deployment

#### Example repository structure

Imagine a repo like this:

```text
/.
├─ fab_workspace/
│  ├─ Notebooks/
│  │  ├─ IngestSales.Notebook
│  │  └─ TransformSales.Notebook
│  ├─ DataPipelines/
│  │  └─ SalesPipeline.DataPipeline
│  ├─ Lakehouse/
│  │  └─ SalesLakehouse.Lakehouse
│  ├─ Reports/
│  │  └─ ExecutiveSales.Report
│  └─ parameter.yml
└─ deploy_fabric.py
```

- `fab_workspace/`:
  - Contains artifacts exported via Fabric Git integration or CLI-based tooling.
- `parameter.yml`:
  - Defines environment-specific replacements (e.g., Lakehouse IDs, connection strings).
- `deploy_fabric.py`:
  - Script that uses fabric-cicd to publish.

#### Example parameter.yml

This file lets you map environment keys like DEV, PPE, PROD to different values.

```yaml
find_replace:
  # Replace a dev Lakehouse ID used in notebooks with environment-specific IDs.
  - find_value: "11111111-1111-1111-1111-111111111111"  # DEV Lakehouse ID
    replace_value:
      DEV: "11111111-1111-1111-1111-111111111111"
      PPE: "22222222-2222-2222-2222-222222222222"
      PROD: "33333333-3333-3333-3333-333333333333"
    item_type: "Notebook"

key_value_replace:
  # Replace a JSON property that stores environment names in pipelines.
  - find_key: $.variables[?(@.name=="Environment")].value
    replace_value:
      DEV: "DEV"
      PPE: "PPE"
      PROD: "PROD"

spark_pool:
  # Example Spark pool differences between PPE and PROD.
  - instance_pool_id: "dev-pool-instance-id"
    replace_value:
      PPE:
        type: "Capacity"
        name: "PPE-SparkPool"
      PROD:
        type: "Capacity"
        name: "PROD-SparkPool"
```

Notes:
- `environment` passed into fabric-cicd must match keys here (DEV/PPE/PROD).
- You can scope replacements by item_type, item_name, file_path for control.
- This avoids forking artifacts per environment.

#### Python deployment script (deploy_fabric.py)

This script:
- Initializes a FabricWorkspace
- Publishes all in-scope items
- Optionally unpublishes orphans (items in workspace but not in Git)

```python
from fabric_cicd import (
    FabricWorkspace,
    publish_all_items,
    unpublish_all_orphan_items,
)


def get_workspace_config(env: str) -> dict:
    # In reality, read from env vars or a config file
    config_map = {
        "DEV": {
            "workspace_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        },
        "PPE": {
            "workspace_id": "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        },
        "PROD": {
            "workspace_id": "cccccccc-cccc-cccc-cccc-cccccccccccc",
        },
    }

    if env not in config_map:
        raise ValueError(f"Unsupported environment: {env}")

    return config_map[env]


def main() -> None:
    import os
    import sys

    env = os.environ.get("FABRIC_ENV", "DEV")
    repo_dir = os.environ.get("FABRIC_REPO_DIR", "./fab_workspace")
    delete_orphans = os.environ.get("DELETE_ORPHANS", "false").lower() == "true"

    cfg = get_workspace_config(env)

    workspace = FabricWorkspace(
        workspace_id=cfg["workspace_id"],
        environment=env,
        repository_directory=repo_dir,
        item_type_in_scope=[
            "Notebook",
            "DataPipeline",
            "Lakehouse",
            "Report",
            "SemanticModel",
        ],
    )

    print(f"Deploying to environment={env}, workspace={cfg['workspace_id']}")

    publish_all_items(workspace)

    if delete_orphans:
        print("Unpublishing orphan items not found in repo...")
        unpublish_all_orphan_items(workspace)

    print("Deployment completed successfully.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # noqa: BLE001
        print(f"Deployment failed: {exc}")
        sys.exit(1)
```

Key points:
- Uses `environment` to trigger parameter.yml substitutions.
- Scope is explicitly set via `item_type_in_scope`.
- Fits nicely into CI tools: control behavior via environment variables.

#### GitHub Actions pipeline using Fabric CLI + fabric-cicd

Now let’s tie it together.

What this job will do:
- Authenticate to Azure using a service principal
- Use Fabric CLI to confirm we can reach Fabric
- Run the Python deployment with fabric-cicd into PROD

Create `.github/workflows/fabric-deploy-prod.yml`:

```yaml
name: Deploy Fabric to PROD

on:
  push:
    branches:
      - main

jobs:
  deploy-fabric-prod:
    runs-on: ubuntu-latest

    permissions:
      id-token: write
      contents: read

    env:
      FABRIC_ENV: PROD
      FABRIC_REPO_DIR: ./fab_workspace
      DELETE_ORPHANS: "true"

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.11"

      - name: Install dependencies
        run: |
          pip install --upgrade ms-fabric-cli fabric-cicd

      - name: Azure login (Service Principal)
        uses: azure/login@v2
        with:
          client-id: ${{ secrets.AZURE_CLIENT_ID }}
          tenant-id: ${{ secrets.AZURE_TENANT_ID }}
          client-secret: ${{ secrets.AZURE_CLIENT_SECRET }}

      - name: Fabric CLI Auth using Service Principal
        run: |
          fab auth login \
            -u "${{ secrets.AZURE_CLIENT_ID }}" \
            -p "${{ secrets.AZURE_CLIENT_SECRET }}" \
            --tenant "${{ secrets.AZURE_TENANT_ID }}"

      - name: Sanity check - list Fabric workspaces
        run: |
          fab ls

      - name: Deploy to PROD workspace using fabric-cicd
        run: |
          python deploy_fabric.py
```

Notes:
- Secrets:
  - `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_CLIENT_SECRET` must belong to a service principal with proper Fabric permissions on the target workspace.
- `fab auth login` ensures the environment is authenticated for subsequent API calls.
- fabric-cicd uses the current identity; no additional secret handling inside code.
- If you want environment approvals, put this job behind a protected branch or environment with required reviewers.

### When should you adopt this pattern?

You should strongly consider Fabric CLI + fabric-cicd if:
- You manage multiple workspaces/environments (DEV/TEST/PROD).
- You need traceability: “what changed?” answered via Git.
- You want to align Fabric with your existing DevOps practices.
- You’re tired of one-off scripts against raw APIs.

You might stick to built-in UI-only flows if:
- You’re in a very small team
- Single environment
- Low compliance/audit requirements

But in most serious setups: code-first wins quickly.

### Practical tips and gotchas

A few opinionated best practices:
- Always run deployments using a service principal or managed identity.
- Keep `parameter.yml` small, explicit, and reviewed. Wildcard replacements can hurt.
- Start with read-only operations using `fab`:
  - `fab ls`, `fab tree`, etc., before scripting destructive operations.
- Treat `unpublish_all_orphan_items` with care:
  - Great for drift control, dangerous without discipline.
- Standardize environment keys:
  - Use consistent `DEV`, `PPE`, `PROD` naming across parameter.yml, scripts, secrets, and docs.

### Wrap-up

Fabric CLI and fabric-cicd give you:
- A developer-friendly way to interact with Fabric
- A predictable, code-first pipeline to move from DEV → PROD
- Less wizard-clicking, more infrastructure discipline

If your Fabric workloads are becoming critical, they deserve real CI/CD.

If you tell me your current setup (Git provider, CI system, how you structure Fabric workspaces), I can tailor this example into a drop-in template for your environment.