---
title: '#14 The Current State of Quantum Computing Dec 2024'
description: 'This article provides a analysis and comparison of the latest quantum CPUs from leading companies.'
publishDate: '28 December 2024'
updatedDate: '28 December 2024'
coverImage:
  src: './cover1.webp'
  alt: 'Quantum Computing'
tags: ['quantum computing', 'general']
---

Quantum computing has evolved from a theoretical concept into a practical tool that is transforming how we approach complex computational problems. By leveraging the principles of quantum mechanics, this technology has the potential to revolutionize industries such as cryptography, drug discovery, and optimization. The year 2023 has marked significant advancements in quantum hardware, with key players like Google, IBM, and Intel achieving critical milestones. These developments demonstrate progress not only in the number of qubits available but also in the critical areas of error correction, scalability, and utility-scale computation.

This article provides a detailed analysis of the latest quantum CPUs from leading companies, comparing their technological advancements and addressing the challenges that remain on the path to fully operational quantum computing systems.

## Google's Willow Chip: A Leap in Quantum Error Correction

Google's **Willow quantum chip** represents a landmark in quantum computing. The chip features **105 qubits** and excels in its ability to scale error correction, a critical aspect of quantum computing. Error correction addresses the inherent instability of quantum systems, ensuring that computations yield reliable results. Google's breakthrough with Willow shows that adding qubits to the system does not exponentially increase errors—a major hurdle in earlier systems.

For example, Willow recently completed a computation in under **five minutes**, a task that would take the most powerful classical supercomputers an estimated **10 septillion years**. This illustrates not only the power of the chip but also the practical advantages it brings to solving problems intractable for classical systems. One notable area of application is **quantum simulation**, where Willow could be used to model complex molecular interactions, accelerating drug discovery processes by simulating molecules that classical methods cannot handle.

Moreover, Willow's design focuses on modularity and precision, positioning it as a critical step toward fault-tolerant quantum computing. Google’s success with this chip lays the groundwork for scaling quantum systems to the thousands of qubits necessary for tackling more significant industrial challenges.

## IBM's Heron Processor: Modular and Scalable Quantum Systems

IBM's **Heron processor**, released as part of its **Quantum System Two** architecture, represents another milestone in quantum computing. Heron comprises **133 qubits**, and while the increase in qubit count compared to Willow is incremental, IBM emphasizes modularity and enhanced error correction as key innovations.

### Key Features

1. **Improved Error Rates**: The Heron processor achieves a five-fold reduction in error rates compared to its predecessor, the Eagle processor. For instance, this enables more precise simulations in material science, such as predicting the behavior of novel compounds.
2. **Modular Design**: IBM Quantum System Two integrates classical computation with quantum processors, allowing multiple Heron chips to work collaboratively. This design is a cornerstone of IBM's vision for **quantum-centric supercomputing**, where quantum and classical resources are combined seamlessly.

IBM has also focused on optimizing Heron for **utility-scale computations**. For example, the chip can handle simulations in quantum chemistry that are essential for developing new energy materials, such as batteries with higher energy densities. The company’s roadmap includes scaling to a **1,000-qubit Condor processor**, although challenges related to coherence and error mitigation persist at such high qubit counts.

## Intel's Contributions: Tangle Lake and Beyond

While Intel's quantum processors may not yet match IBM and Google in terms of qubit count, their approach highlights a different set of priorities. Intel’s **Tangle Lake processor** features **49 superconducting qubits**, and the company has also developed the **Tunnel Falls processor**, which uses **semiconductor spin qubits**. These qubits are smaller and potentially more scalable than their superconducting counterparts.

Intel’s focus is on long-term scalability and manufacturability. For example, spin qubits leverage existing semiconductor fabrication technologies, which could make large-scale production more feasible. This aligns with Intel’s vision of creating practical quantum processors that can eventually integrate into existing computational infrastructures.

## Comparing Key Metrics Across Quantum Systems

| **Company** | **Processor**    | **Qubit Count**  | **Key Features**                                                               |
| ----------- | ---------------- | ---------------- | ------------------------------------------------------------------------------ |
| **Google**  | Willow           | 105              | Advanced error correction; performed task beyond supercomputers in <5 minutes. |
| **IBM**     | Heron            | 133              | Modular architecture; optimized for utility-scale computation and scalability. |
| **Intel**   | Tunnel Falls     | 12 (spin qubits) | Focused on manufacturability and precision; exploring spin qubit technologies. |
| **IBM**     | Condor (planned) | 1,000 (exp.)     | Experimental chip for exploring high qubit counts and distributed systems.     |

## The Challenges Ahead: Error Rates and Scalability

Despite the impressive advancements, quantum computing remains in the **Noisy Intermediate-Scale Quantum (NISQ)** era, where systems are limited by error rates, qubit coherence times, and computational stability. Key challenges include:

1. **Error Correction**: Scaling error correction methods, as demonstrated by Google’s Willow chip, is critical for larger quantum systems.
2. **Coherence**: Maintaining qubit stability over time remains an issue, particularly for computations requiring multiple steps.
3. **Scalability**: Systems like IBM’s planned 1,000-qubit Condor processor aim to address scalability, but achieving high fidelity at such scales is a significant technical challenge.
4. **Cost-Effectiveness**: Quantum computing is still an expensive endeavor, with costs associated with cooling, maintenance, and error correction. Reducing these costs will be essential for widespread adoption.

## Conclusion: The Path Toward Practical Quantum Computing

The advancements achieved by Google, IBM, and Intel in 2023 illustrate the significant progress being made toward practical quantum computing. Each company has taken a unique approach: Google focuses on error correction and utility-scale computation with its Willow chip; IBM emphasizes modularity and scalability with Heron and Quantum System Two; Intel explores manufacturable solutions with its spin qubit technology.

Despite these achievements, the road to fault-tolerant, scalable quantum computing remains long. Overcoming challenges such as qubit coherence, error rates, and cost-effective scaling will be critical for quantum systems to achieve widespread applicability. However, with breakthroughs such as Google's demonstration of practical computations and IBM's modular designs, the field is steadily moving closer to realizing the transformative potential of quantum technology. As these systems mature, they are poised to redefine computation, offering unprecedented capabilities across industries.

## Sources

**Google's Willow Quantum Chip**:

- [Meet Willow, our state-of-the-art quantum chip](https://blog.google/technology/research/google-willow-quantum-chip/)
- [Google's Quantum Chip, Willow](https://finance.yahoo.com/news/googles-quantum-chip-willow-143300408.html)
- [Google claims its new Willow quantum chip can swiftly solve a problem](https://www.tomshardware.com/tech-industry/quantum-computing/google-claims-its-new-willow-quantum-chip-can-swiftly-solve-a-problem-that-would-take-a-standard-supercomputer-10-septillion-years)
- [Google unveils 'mind-boggling' quantum computing chip](https://www.bbc.com/news/articles/c791ng0zvl3o)
- [Google's Quantum Computing Chip 'Willow' Fortifies Its Moat In AI](https://seekingalpha.com/article/4744935-googles-quantum-computing-chip-willow-fortifies-its-moat-in-ai)

**IBM's Heron Processor**:

- [IBM Debuts Next-Generation Quantum Processor & IBM Quantum System Two](https://newsroom.ibm.com/2023-12-04-IBM-Debuts-Next-Generation-Quantum-Processor-IBM-Quantum-System-Two%2C-Extends-Roadmap-to-Advance-Era-of-Quantum-Utility)
- [IBM Launches Its Most Advanced Quantum Computers, Fueling New Scientific Value and Progress Towards Quantum Advantage](https://newsroom.ibm.com/2024-11-13-ibm-launches-its-most-advanced-quantum-computers%2C-fueling-new-scientific-value-and-progress-towards-quantum-advantage)
- [IBM’s Quantum Processor and Modular Computer Are Now in Operation](https://www.techrepublic.com/article/ibm-quantum-heron-system-two/)
- [IBM unveils first 'utility scale' quantum processor](https://www.theregister.com/2023/12/05/ibm_heron_quantum_processor/)
- [IBM Heron - Wikipedia](https://en.wikipedia.org/wiki/IBM_Heron)

**Intel's Tunnel Falls Processor**:

- [Intel Announce 'Tunnel Falls' Quantum Research Chip](https://www.tomshardware.com/news/intel-announce-tunnel-falls-quantum-research-chip)
- [Intel’s New Chip to Advance Silicon Spin Qubit Research for Quantum Computing](https://www.intc.com/news-events/press-releases/detail/1626/intels-new-chip-to-advance-silicon-spin-qubit-research)
- [Tunnel Falls: Intel reveals 12-qubit quantum chip for research](https://www.siliconrepublic.com/innovation/tunnel-falls-intel-quantum-chip-processor-research)
