---
title: '#48 Architectural Considerations for OpenShift On-Prem vs. Microsoft Fabric'
description: 'A deep dive into the architectural differences between OpenShift Fabric.'
publishDate: '26 November 2025'
updatedDate: '26 November 2025'
coverImage:
    src: './cover.webp'
    alt: 'Architectural Comparison between OpenShift and Microsoft Fabric'
tags: ['Microsoft Fabric', 'OpenShift']
---

## TL;DR

-   Core Decision: OpenShift on-prem vs. Microsoft Fabric is a choice between Platform Engineering (owning infrastructure) vs. Analytics Engineering (owning logic)
-   OpenShift Philosophy: Build a "Private Data Cloud" with full control—requires assembling storage (ODF/MinIO), compute engines (Kafka, Spark), orchestration (Airflow), and governance tools (DataHub/Amundsen)
-   Fabric Philosophy: "OneLake Paradigm"—unified SaaS platform with integrated storage and compute, but requires on-prem gateways, clean Entra ID setup, and strict cost governance
-   OpenShift-Only Capabilities
-   Decision Factors
-   Recommended Approach

## Introduction

For the modern Data Architect, the choice between building an on-premises data platform on **Red Hat OpenShift** or adopting a SaaS ecosystem like **Microsoft Fabric** is not merely a selection of tools; it is a selection of philosophy. It represents a fundamental decision between **Platform Engineering** (owning the stack) and **Analytics Engineering** (owning the logic).

While both platforms ultimately serve the same business goal—transforming raw data into Business Intelligence (BI) and AI insights—the operational realities, required skill sets, and total cost of ownership (TCO) models are diametrically opposed. Furthermore, while there is functional overlap—both can run Spark, manage pipelines, and handle IoT streams—there are "hard limits" regarding what a SaaS platform can physically do compared to an edge-capable container platform.

This article breaks down the decision framework, the hidden requirements of each, and the strategic implications for your enterprise.

## Part 1: The OpenShift Approach (The "Sovereign Cloud")

Choosing OpenShift is a decision to build a **Private Data Cloud**. You are not just a consumer of software; you are a provider of infrastructure.

### The Philosophy: "Composable and Controlled"

OpenShift treats the data platform as a collection of microservices. You are bringing the compute to the data, which is often necessary when the data has "high gravity"—meaning it is too large, too sensitive, or requires too low latency to leave the building (e.g., Factory IoT, Healthcare Imaging, High-Frequency Trading).

### The Architectural "Bill of Materials"

When you buy Microsoft Fabric, the platform is ready. When you install OpenShift, you have a kernel. To replicate the functionality of a modern data platform, the architect must explicitly design and deploy the following components:

1.  **The Storage Layer (The Foundation)**

    -   OpenShift does not store data; it manages compute. You must integrate a storage solution.
    -   **Requirement:** You need **OpenShift Data Foundation (ODF)**, **MinIO**, or **Ceph** to provide S3-compatible object storage (your Data Lake). You also need high-performance Block Storage (CSI drivers) for databases like Postgres or reduced-latency logs.
    -   _Architect’s Note:_ You are responsible for the replication, backup, and disaster recovery strategies of this storage.

2.  **The Compute Engines (The Operators)**

    -   You do not simply "run SQL." You deploy engines via **Kubernetes Operators**.
    -   **Requirement:** You will deploy **Strimzi** to run Kafka for streaming. You will deploy **Spark** clusters (likely via the Radanalytics operator or simple pods) for processing. You might deploy **Trino** or **Presto** for federated querying.
    -   _Architect’s Note:_ You must manage the version compatibility between these tools. Does Spark 3.4 work with your version of the Kafka connector? That is now your problem to solve.

3.  **The Control Plane (Orchestration & Gateway)**

    -   How do you trigger jobs? How do users access the data?
    -   **Requirement:** You need **Apache Airflow** (or OpenShift Pipelines/Tekton) to orchestrate the ETL.
    -   **Requirement:** You need an **API Gateway** (like Red Hat 3scale, Kong, or Istio) to expose your data products safely to the corporate network.

4.  **The Missing Link: Governance**
    -   OpenShift has no native concept of a "Data Catalog."
    -   **Requirement:** You must deploy and maintain a tool like **DataHub**, **Amundsen**, or **Atlas** to track lineage and schemas.

## Part 2: The Microsoft Fabric Approach (The "Unified SaaS")

Choosing Fabric is a decision to embrace **integration over isolation**. It is an opinionated stack that forces you to work the "Microsoft Way," but rewards you with immense speed to market.

### The Philosophy: "The OneLake Paradigm"

Fabric fundamentally changes the architecture by abstracting storage entirely. **OneLake** acts as the "OneDrive for Data." Whether you are doing Data Science (Spark), Warehousing (SQL), or Real-time Analytics (KQL), you are operating on the same copy of data in the Delta-Parquet format.

### The Architectural Reality: What is actually included?

In Fabric, the "Bill of Materials" is largely virtual, but the architectural challenges shift from _installation_ to _configuration and optimization_.

1.  **Storage & Compute (Separated):**

    -   Storage is cheap (Azure Data Lake Storage Gen2). Compute is purchased in "Capacity Units" (F-SKUs).
    -   _The Integration:_ You do not need to mount volumes or configure storage classes. It just works.

2.  **The "Hidden" Requirements for Fabric:**
    -   **On-Premises Data Gateways:** If your ERP or manufacturing systems are on-prem, Fabric cannot reach them by magic. You must architect a secure Gateway layer to tunnel data into the cloud.
    -   **Identity Architecture (Entra ID):** Security in Fabric is granular (Row-Level Security). This requires a pristine Active Directory setup. If your AD groups are messy, your data security will be messy.
    -   **FinOps Governance:** In OpenShift, a bad query slows down the server. In Fabric, a bad query costs actual money (or burns through your capacity, throttling everyone else). You need strict monitoring policies.

## Part 3: The Capability Gap: What OpenShift Can Do That Fabric Cannot

It is true that Fabric supports IoT analysis, Notebooks, and Pipelines. However, a common misconception is that feature parity exists between a SaaS Data Platform and a Container Orchestrator.

There is a hard technical line where Fabric stops and OpenShift begins. This line is usually defined by **Physicality, Latency, and Runtime Flexibility**.

### 1. The "Air-Gapped" Requirement (The Disconnected Stack)

Fabric is a SaaS product. It lives in an Azure Region. It requires connectivity.

-   **The Gap:** If you need to run a data platform on an oil rig, inside a submarine, or in a high-security manufacturing bunker with _zero internet access_, Fabric is physically impossible.
-   **The OpenShift Advantage:** OpenShift can run autonomously on a single server ("Single Node OpenShift") at the edge. It processes, stores, and serves insights locally without ever "phoning home."

### 2. Sub-Millisecond "Closed Loop" Control

Fabric is excellent for **analyzing** IoT data (e.g., "The machine vibrated abnormally 5 minutes ago"). It is poor at **acting** on it in real-time.

-   **The Gap:** The round-trip latency to send sensor data to the Azure cloud, process it, and send a command back to the factory floor is too slow for critical safety mechanisms.
-   **The OpenShift Advantage:** OpenShift allows for "Closed Loop" control. It can ingest sensor data, run an ML inference locally, and send a "STOP" command to a robotic arm in single-digit milliseconds.

### 3. Arbitrary Containers & Legacy Code

Fabric runs specific, curated runtimes: Spark, SQL, KQL, and Python environments.

-   **The Gap:** Fabric is a _Data_ Platform, not a generic _Application_ Platform. You cannot upload a Docker container running a 15-year-old C++ binary required to decode a proprietary video format. You cannot run a complex microservice written in Rust that needs system-level kernel access.
-   **The OpenShift Advantage:** OpenShift runs _anything_ that can be containerized. You can collocate your data processing pipelines next to your custom web applications, legacy binaries, and specialized microservices within the same namespace.

### 4. Granular Hardware Control

Fabric abstracts the hardware. You buy "Capacity," not specifications.

-   **The Gap:** You cannot tell Fabric, "Run this specific neural network training job on an NVIDIA A100 GPU, but run this ETL job on cheap CPU cores."
-   **The OpenShift Advantage:** You have access to the metal. You can use node affinity to pin high-performance workloads to machines with NVMe SSDs or specific GPU accelerators, ensuring you squeeze every ounce of performance out of the hardware.

## Part 4: The Decision Matrix for Architects

When standing at this crossroads, the Data Architect must weigh four critical dimensions:

### 1. The Talent Dimension

-   **OpenShift requires "Full Stack" Data Teams.** You need engineers who understand `kubectl`, persistent volumes, and networking _in addition_ to SQL and Python. If you lack a strong DevOps/Platform Engineering team, an OpenShift data platform will likely fail or become unmanageable.
-   **Fabric requires "Analytics" Teams.** You need people who understand data modeling (Star Schema), SQL, and DAX. The infrastructure is invisible.

### 2. The Data Gravity & Latency Dimension

-   **Latency:** If you are training AI models on images generated by machines on a factory floor, uploading 10TB of video to the cloud daily is impractical. OpenShift allows you to process that data _at the edge_, keeping only the insights.
-   **Regulatory:** If you are a Defense Contractor or a Central Bank, the definition of "Cloud" might be legally restricted. OpenShift provides the cloud-native workflow (containers/CI/CD) without the public cloud risk.

### 3. The Cost Model (CapEx vs. OpEx)

-   **OpenShift (CapEx):** High upfront cost (servers, licenses). Low marginal cost. Ideal for heavy, continuous workloads (e.g., streaming 24/7).
-   **Fabric (OpEx):** Low upfront cost. Variable marginal cost. Ideal for bursty workloads (e.g., monthly reporting cycles) where you can pause capacity when not in use.
    -   _Warning:_ Fabric costs can spiral if not governed. A poorly written cross-join in a Spark notebook pays the "stupidity tax" in cash.

### 4. Integration vs. Customization

-   **Fabric:** You get seamless integration with Teams, Excel, and Outlook. If your C-Suite lives in Office 365, the friction to get data to them is near zero.
-   **OpenShift:** You have infinite customization. Need a specific version of a Vector Database that Azure doesn't support? Just spin up the container. You are never blocked by a vendor roadmap.

## Conclusion: The Hybrid Reality

Rarely is this a binary choice. The most sophisticated enterprises often adopt a **Hybrid Architecture**:

They use **OpenShift at the Edge/On-Prem** to handle the "heavy lifting," closed-loop control, and sensitive aggregation. They then push the high-value, aggregated "Gold" data to **Microsoft Fabric** for user-facing analytics, dashboards, and integration with the corporate ecosystem.

-   **Choose OpenShift** if you need to build a factory (Control, Customization, Edge).
-   **Choose Fabric** if you need to build a showroom (Speed, Integration, BI).
-   **Choose Both** if you want to manufacture on-site and sell globally.
