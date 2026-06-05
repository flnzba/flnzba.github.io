---
title: 'One Interface, Every Service: A Practical Guide to the Open Service Broker API'
description: >-
  How the Open Service Broker API turned the N x M problem of platform-service integration into N + M, and how it fits alongside Kubernetes Operators today.
date: '2026-05-07'
updated: '2026-05-07'
tags:
  - cloud native
  - kubernetes
  - cloud foundry
  - open source
  - platform engineering
number: 43
canonical_url: 'https://www.fzeba.com/posts/43-open-service-broker-api-guide/'
published: true
---
## One Interface, Every Service: A Practical Guide to the Open Service Broker API

> *Before OSB, every platform needed a custom integration with every backing service. After OSB, one spec covers thousands of services across Kubernetes, Cloud Foundry, and OpenShift.*

## The Problem OSB Solves

A "backing service" is anything your application talks to but doesn't run itself — a Postgres database, a Kafka cluster, a Redis cache, an S3 bucket, an Auth0 tenant, a SendGrid account. In a cloud-native world, applications need backing services on demand, in the right region, with the right plan, and they need credentials wired in automatically.

Before 2016, each platform solved this with **bespoke integrations**. Cloud Foundry had its own Services API. Kubernetes had no answer at all. Each managed service provider had to write a separate integration for each platform they wanted to land on. The Cartesian product was untenable: *N platforms × M services = N×M integrations*.

The **Open Service Broker API (OSB API, or OSBAPI)** turned this matrix into a sum. One specification defines what a "service broker" looks like. Any platform that speaks OSB can talk to any broker that implements OSB. Now it's *N + M integrations*. Today the spec is implemented by thousands of brokers and adopted by Cloud Foundry, Kubernetes (via the Service Catalog project), and Red Hat OpenShift among others.

## A Brief History

The OSB API was forked from the **Cloud Foundry Services API** in late 2016. At KubeCon Seattle 2016, the Kubernetes community unveiled the **Service Catalog** incubator project and announced its adoption of OSB. The Cloud Foundry Foundation, in collaboration with individuals from Fujitsu, Google, IBM, Pivotal, Red Hat, and SAP, formed an independent working group to maintain the specification.

The first independent release was **OSB v2.12** — the first version not tied to Cloud Foundry. Today the project is governed by the CloudFoundry Foundation under the CFF Service Management Working Group, with weekly community calls and a Slack channel under the Cloud Foundry workspace.

## The Five Endpoints That Define the Contract

OSB is deliberately small. The whole API surface fits in five lifecycle operations.

**Fetch the catalog.** `GET /v2/catalog` returns the broker's offerings. Each *service* has a list of *plans* — typically "T-shirt sized" tiers like small / medium / large, or feature tiers like basic / standard / premium. The catalog describes everything the platform might want to provision.

**Provision a service instance.** `PUT /v2/service_instances/:instance_id` asks the broker to create an instance of a specific service+plan. "Create" is deliberately abstract: it might mean spinning up a new VM, reserving rows in a multi-tenant database, allocating a tenant in a SaaS system, or anything else. The spec is opinion-free about implementation. The operation may be synchronous or asynchronous; for async, the platform polls a `last_operation` endpoint until completion.

**Bind an application.** `PUT /v2/service_instances/:instance_id/service_bindings/:binding_id` produces the credentials that an application needs to talk to the service instance — a connection URL, a username, a password, certificates, whatever the service requires. Bindings are independent of instances; one instance can have many bindings (different apps, different containers, different regions).

**Unbind.** `DELETE` on the binding revokes the credentials.

**Deprovision.** `DELETE` on the instance tears it down.

There are also operations for *updating* an instance (changing plans, scaling up) and for *fetching* an instance or binding. That's the entire core API.

## Why the Abstraction Matters

The genius of OSB is that the broker's *implementation* is opaque to the platform. The platform doesn't care whether "provision a small database" creates a new Postgres VM or just reserves 100 MB on a shared cluster. It just gets a service instance back, with bindings that work.

This means:

- **Service providers** ship one broker, deploy it once, and it works on every OSB-compliant platform.
- **Platform operators** stop writing custom integrations and instead maintain a marketplace of brokers.
- **Application developers** self-serve through a uniform interface — `cf create-service`, `kubectl create -f serviceinstance.yaml`, etc. — without caring which provider is on the other end.

The Red Hat OpenShift launch announcement framed it well: "a single, simple, and elegant way to deliver services to applications running within cloud native offerings."

## OSB on Kubernetes: The Service Catalog Project

The OSB spec is platform-neutral, but on Kubernetes it's surfaced through the **Service Catalog** project (originally a Kubernetes Incubator project, now a separate repository). Service Catalog adds Kubernetes-native resources that wrap the OSB API:

- **ClusterServiceBroker / ServiceBroker** — points at an OSB-compliant broker endpoint
- **ClusterServiceClass / ServiceClass** — represents a service from the broker's catalog (e.g., `cleardb-mysql`)
- **ClusterServicePlan / ServicePlan** — the tier under a class (free / standard / enterprise)
- **ServiceInstance** — a concrete provisioned service, namespace-scoped
- **ServiceBinding** — delivers credentials to workloads through Kubernetes `Secret` objects that the pod mounts as env vars or files

A Service Catalog Controller Manager watches these CRDs and translates them into HTTP calls against the broker. Service Catalog migrated from an aggregated API server to a CRD-based architecture in v0.3, with the older v0.2 API server implementation supported through mid-2020.

This positions Kubernetes as not just a workload runtime but a **control plane for external managed services** — a shift the Kubernetes community made deliberately to expand beyond pod scheduling.

## Where OSB Fits Today (And Where It Doesn't)

OSB is still alive — the spec is at v2.x and continues to receive updates, thousands of brokers exist, and Cloud Foundry's services ecosystem is built on it. But the Kubernetes adoption story has evolved.

The Service Catalog project has been largely *displaced* by **Kubernetes Operators** for the most popular use cases. An Operator is a controller that knows how to manage a specific application using CRDs (e.g., a Postgres Operator that handles backups, failover, scaling). For Kubernetes-native workloads where the application *runs inside the cluster*, Operators are usually a better fit than service brokers.

The current rule of thumb:

- **Use OSB** when the service is **external** to Kubernetes — a managed cloud database, a SaaS API, a multi-tenant offering. The broker abstracts the external provider.
- **Use an Operator** when the service runs **inside** the cluster — a self-hosted Postgres, a Redis instance you operate yourself. The Operator manages it natively.

For Cloud Foundry users, OSB remains the standard interface. For Kubernetes users, it's one tool among several, with a clear niche.

## Getting Involved

The OSB community is open and well-documented:

- The spec lives at https://github.com/openservicebrokerapi/servicebroker/blob/master/spec.md
- A Getting Started guide walks through implementing a broker — https://github.com/openservicebrokerapi/servicebroker/blob/master/gettingStarted.md
- Slack: `#open-service-broker-api` in the Cloud Foundry workspace
- A Google Group for async discussion
- Weekly community calls under the CFF Service Management Working Group

Reference broker implementations exist for AWS, Azure, GCP, MongoDB Atlas, ElephantSQL, MySQL, RabbitMQ, and dozens more. If you're a service vendor wanting to ship a broker, you start by reading the spec, generating an OpenAPI-style stub, and implementing the catalog + provision + bind endpoints.

## Project Goals

The OSB project documents three explicit goals:

1. Maintain and evolve the spec with a clear release process.
2. Provide conformance test suites that brokers can run against themselves.
3. Drive industry adoption.

The conformance test suite is particularly valuable for service vendors — it lets them verify their broker behaves correctly across edge cases (async provisioning timeouts, malformed catalogs, binding/unbinding sequences) before deploying to production.

## Conclusion

OSB is a quiet success story in cloud-native infrastructure. It doesn't make headlines like Kubernetes or service meshes, but it solved a real interoperability problem by being deliberately small, deliberately opinion-free about implementation, and deliberately platform-neutral.

If you're integrating a backing service into a cloud-native application, OSB is probably already in the path between you and that service. And if you're a service provider thinking about how to land on every platform without writing N integrations — OSB is still the right answer.

---

## Sources

- Open Service Broker API project homepage — https://www.openservicebrokerapi.org/
- OSB API specification — https://github.com/openservicebrokerapi/servicebroker/blob/master/spec.md
- OSB API Getting Started guide — https://github.com/openservicebrokerapi/servicebroker/blob/master/gettingStarted.md
- OSB API GitHub organization — https://github.com/openservicebrokerapi
- OSB API blog and release notes — https://www.openservicebrokerapi.org/blog
- Red Hat: *"Open Service Broker API and Platform Evolution"* — https://www.redhat.com/en/blog/open-service-broker-api-platform-evolution
- The New Stack: *"Kubernetes Operators and the Open Service Broker API: A Perfect Marriage"* — https://thenewstack.io/kubernetes-operators-and-the-open-service-broker-api-a-perfect-marriage/
- k8s Guru: *"Service Catalog & Open Service Broker: Extending Kubernetes Services"* — https://k8s.guru/blog/2016/12/09/service-catalog-open-service-broker/
- Kubernetes Service Catalog project — https://svc-cat.io
- CFF Service Management Working Group meeting information — https://github.com/cloudfoundry/community/blob/main/toc/working-groups/WORKING-GROUPS.md#service-management
- Pivotal whitepaper: *"An Inside Look at the Open Service Broker API"* — https://content.pivotal.io/white-papers/an-inside-look-at-the-open-service-broker-api
