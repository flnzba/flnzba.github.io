---
title: 'Lock-less Python with bocpy: Behavior-Oriented Concurrency on CPython'
description: >-
  How Microsoft Research's bocpy library brings deadlock-free, ownership-based concurrency to Python through cowns, behaviors, and CPython sub-interpreters.
date: '2026-04-25'
updated: '2026-04-25'
tags:
  - python
  - concurrency
  - parallelism
  - microsoft research
  - sub-interpreters
number: 41
canonical_url: 'https://www.fzeba.com/posts/bocpy-behavior-oriented-concurrency/'
published: true
---
## Lock-less Python with bocpy: Behavior-Oriented Concurrency on CPython

> *Concurrency in Python has been an exercise in working around the GIL for nearly twenty years. Microsoft Research's `bocpy` doesn't work around it — it sidesteps it entirely.*

## The Long Shadow of the GIL

Concurrent Python programming has historically meant choosing one of three uncomfortable trade-offs. You could use **threads** and pay the price of the Global Interpreter Lock (GIL), getting concurrent I/O but no real parallel compute. You could use **multiprocessing** and pay the price of serialization, IPC overhead, and lost shared state. Or you could use **asyncio** and rewrite your program around `async`/`await` while still running on a single core.

CPython 3.12 changed the game by stabilizing **sub-interpreters** — independent interpreter instances inside one process, each with its own GIL. CPython 3.13 added a `concurrent.interpreters` standard-library module exposing them. For the first time, a pure-Python program could achieve genuine multi-core parallelism without spawning OS processes.

But sub-interpreters alone don't solve the *programming problem*. They give you parallel slots — they don't give you a sane way to *coordinate* shared mutable data across those slots. That's where `bocpy` enters.

## What Is Behavior-Oriented Concurrency?

`bocpy` (currently v0.6.0, MIT-licensed) is Microsoft's Python implementation of **Behavior-Oriented Concurrency** (BOC), a concurrency paradigm originally developed for Microsoft Research's experimental systems language **Verona**. BOC was formally introduced in the OOPSLA 2023 paper *"When Concurrency Matters: Behaviour-Oriented Concurrency"* by Cheeseman, Parkinson, Clebsch, Kogias, Drossopoulou, Chisnall, Wrigstad, and Liétar.

The paradigm draws from three older ideas — **the actor model, join calculus, and structural lock correlation** — but it differs from actors in a critical way: in BOC, **data is decoupled from threads of control**. Where an actor system gives each piece of data a permanent owning thread, BOC gives each *task* exclusive temporal access to whatever pieces of data it needs.

This re-framing matters because the actor model has a known weakness: coordinating updates across multiple actors requires bespoke protocols (two-phase commit, message-passing handshakes) that are easy to get wrong. BOC handles multi-resource coordination natively. The OOPSLA paper proves a simulation theorem: any actor-model program has an equivalent BOC program, but BOC programs can express things actors cannot express compactly.

## The Two Primitives: Cowns and Behaviors

`bocpy`'s API rests on exactly two concepts.

A **cown** (concurrent-owned variable) is a wrapper around a piece of data that can only be accessed by one interpreter at a time. Internally, cowns use Python's cross-interpreter data API (XIData) to move data safely across interpreter boundaries. When one interpreter holds a cown, any attempt by another to acquire it raises an exception — there's no spinning, no blocking, no priority inversion. Critically, cowns are implemented as **C-level data structures using lock-free atomic compare-and-swap operations**. There is no Python-level mutex sitting under the abstraction. Ownership is tracked and transferred in memory by wait-free protocols.

A **behavior** is a function decorated with `@when(cown1, cown2, ...)` that lists the cowns it requires. When all the listed cowns become available, the runtime acquires them and runs the function. From the programmer's perspective, this is a normal Python function. From the runtime's perspective, it's a scheduling constraint.

The simplest possible example, from the official tutorial:

```python
from bocpy import Cown, when, wait

knife = Cown(Utensil("knife"))
onion = Cown(Ingredient("onion"))

@when(knife, onion)
def dice_onion(knife, onion):
    knife.value.dice(onion.value)

wait()
```

The behavior `dice_onion` will run as soon as both `knife` and `onion` are free, on whichever worker is available, with no explicit thread management.

## Why BOC Is Deadlock-Free *By Construction*

The most important property of BOC isn't ergonomics — it's correctness. When a behavior needs multiple cowns, the runtime uses **two-phase locking over a deterministic total order**. Every cown in the system has a globally consistent position in an ordering, and behaviors always acquire their cowns in that order. This is implemented in C using lock-free linked lists.

Because the acquisition order is fixed system-wide, the classic deadlock cycle (thread A holds X waiting for Y; thread B holds Y waiting for X) is impossible. The runtime cannot produce that situation no matter how many cowns a behavior requests or in what order the behaviors are scheduled. This is the same reasoning the original BOC paper formalizes for Verona.

Compare this to threads-and-locks code. The `bocpy` documentation walks through cooking an omelette with two cooks — eight resources, five steps, ordering constraints between steps. The threads-and-locks version requires nested `with` blocks for every lock, `Condition` variables to coordinate state transitions, and a manual partitioning of work across worker threads. The BOC version is a straight transcription of the recipe: each step declares the resources it needs, and the scheduler figures out the rest.

## True Parallelism on Sub-Interpreters

`bocpy` runs behaviors on **CPython sub-interpreters**, each with its own GIL on Python 3.12+. Combined with a **lock-free work-stealing scheduler** and **zero-copy cown handoff** through XIData, this produces near-linear throughput scaling. The team's benchmark on a 14-core AMD machine using a 16×16 matrix payload tracks perfect linear scaling closely — something that no GIL-locked threading approach has been able to achieve in 30 years of CPython.

The scheduler, the cown handoff protocol, and the worker dispatch are all non-blocking C code. The only place Python-level synchronization could appear is inside user code, which is — by design — never running on a shared cown.

## Beyond the Basics: Noticeboard and Matrix

Two additional features round out `bocpy` for real workloads.

**The Noticeboard** is a global key-value store for lightweight eventually-consistent state. It's designed for things like configuration, counters, and status flags that many behaviors read but few update. Writes are fire-and-forget via `notice_write`, applied asynchronously by a dedicated noticeboard thread. Reads from inside a behavior get a frozen snapshot — no torn reads, no lock contention. Atomic read-modify-write is available via `notice_update` with a picklable function. The store caps at 64 keys and is explicitly *not* a replacement for cowns; it's a sidecar for ambient state.

**The Matrix type** is a dense FP64 2-D matrix backed entirely by C, supporting element-wise arithmetic, matrix multiplication (`@`), slicing, reductions, and `Matrix.uniform`/`Matrix.normal` constructors. It is — critically — XIData-compatible, so it can sit inside a cown and move between interpreters with zero-copy overhead. The repository documents it as the *reference example* for users who want to build their own BOC-aware C types. The Boids flocking simulation in the examples folder uses `Matrix` to update hundreds of agents concurrently across interpreters.

## Where BOC Sits in the Landscape

BOC has been implemented in several environments. The original C++ runtime lives inside the Verona project. A Rust binding called **boxcars** wraps the same Verona runtime for Rust users. `bocpy` is the Python implementation, and a related PLDI 2025 paper ("Dynamic Region Ownership for Concurrency Safety") generalizes the underlying region-ownership idea further with co-authors including Guido van Rossum and Eric Snow — signaling that the ideas are converging back into CPython itself.

For Python developers, the practical comparison points are:

- **Threading**: works for I/O-bound code, fails for CPU-bound code due to the GIL, deadlock-prone, error-prone locking
- **Multiprocessing**: real parallelism but expensive IPC, copy semantics, no shared mutable state
- **asyncio**: cooperative scheduling, single-core, requires async-aware libraries
- **Ray / Dask**: distributed task scheduling, heavier infrastructure, designed for clusters
- **`bocpy`**: real parallelism within a single process, no locks, no deadlocks, ergonomic shared mutable state

The closest mental model is "actors that can talk to each other transactionally," which is the niche BOC was built to fill.

## Getting Started

Installation is a single command:

```
pip install bocpy
```

Then declare some cowns, write behaviors with `@when`, and call `wait()` at the bottom of your main routine to block until all scheduled behaviors finish. `wait()` accepts an optional timeout that raises `TimeoutError` if the scheduled work isn't done in time.

The official documentation includes a full omelette tutorial, a noticeboard walkthrough, the Matrix API, and scaling benchmarks. The `examples/` folder on GitHub contains additional patterns including the Boids simulation.

## Why This Matters

`bocpy` is one of the first libraries to make a serious effort at using CPython sub-interpreters for general-purpose concurrent programming. The combination of a sound theoretical model (BOC), a deadlock-free implementation, and zero-copy data movement gives Python a credible answer to "how do I write multi-core code without leaving Python?" for the first time in the language's history.

It is still v0.6 — APIs may shift, and the ecosystem of BOC-aware libraries is small. But the design choices are the right ones, and they're grounded in published research that has been refined over multiple years across Verona, C++, Rust, and now Python.

If you've ever written a `with lock_a: with lock_b:` block and hoped you got the order right, `bocpy` is worth a long look.

---

## Sources

- `bocpy` official documentation and tutorial — https://microsoft.github.io/bocpy/
- `bocpy` GitHub repository — https://github.com/microsoft/bocpy
- Cheeseman, Parkinson, Clebsch, Kogias, Drossopoulou, Chisnall, Wrigstad, Liétar. *"When Concurrency Matters: Behaviour-Oriented Concurrency"*, OOPSLA 2023 — https://www.microsoft.com/en-us/research/publication/when-concurrency-matters-behaviour-oriented-concurrency/
- BOC paper PDF — https://marioskogias.github.io/docs/boc.pdf
- Project Verona publications page — https://microsoft.github.io/verona/publications.html
- Stoldt et al. *"Dynamic Region Ownership for Concurrency Safety"*, PLDI 2025
- `boxcars` (Rust bindings for the Verona BOC runtime) — https://github.com/aDotInTheVoid/boxcars
- Python `concurrent.interpreters` standard-library docs — https://docs.python.org/3/library/concurrent.interpreters.html
- Tobias Wrigstad seminar overview of BOC — https://www.usi.ch/en/feeds/25889
- Lobsters discussion of BOC and its Verona / Pony lineage — https://lobste.rs/s/64eywc/when_concurrency_matters_behaviour
