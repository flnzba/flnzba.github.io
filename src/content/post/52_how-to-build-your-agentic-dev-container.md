---
title: '#52 Your AI Development Team in a Box - How I Built a Container for AI Coding Assistants'
description: 'How I built a unified AI development environment in a Docker container, accessible from anywhere.'
publishDate: '20 January 2026'
updatedDate: '20 January 2026'
# coverImage:
#     src: ''
#     alt: ''
tags: ['Docker', 'AI Agents', 'Hetzner']
---

## Your AI Development Team in a Box: How I Built a Portable Command Center for AI Coding Assistants

## The Dream: Code from Anywhere, with Any AI, Without the Mess

Picture this: You're on a train, inspired by a brilliant idea for a new project. You pull out your iPad, connect via SSH to a server, and within seconds you have access to Claude Code, GitHub Copilot, Gemini CLI, and OpenAI Codex—all working together, with your projects, your history, and your configurations exactly where you left them.

Now picture the alternative: Juggling five different local installations across three devices, managing conflicting dependencies, keeping API keys synced, and praying you don't accidentally break your Mac's Python environment again.

I chose the first option. This is the story of how I built a unified AI development environment that lives in a Docker container, runs on a €5/month cloud server, and gives me superpowers no matter where I am or what device I'm using.

---

## What This Actually Is (Without the Tech Jargon)

At its core, this project solves a simple problem: **I want all my AI coding tools in one place, accessible from anywhere, without polluting my personal computer.**

Think of it like this:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         THE OLD WAY                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Your MacBook                    Your iPad                             │
│   ┌────────────────┐              ┌────────────────┐                   │
│   │ Claude Code ✓  │              │ Claude Code ✗  │ (can't install)   │
│   │ Codex CLI ✓    │              │ Codex CLI ✗    │                   │
│   │ Different API  │              │ No access      │                   │
│   │ keys scattered │              │                │                   │
│   │ everywhere     │              │                │                   │
│   └────────────────┘              └────────────────┘                   │
│                                                                         │
│   Your Phone                      Your Work Computer                    │
│   ┌────────────────┐              ┌────────────────┐                   │
│   │ Can't run any  │              │ IT won't let   │                   │
│   │ of these tools │              │ you install    │                   │
│   │                │              │ anything       │                   │
│   └────────────────┘              └────────────────┘                   │
│                                                                         │
│   Result: Fragmented tools, inconsistent environments, lost history    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                                 ↓

┌─────────────────────────────────────────────────────────────────────────┐
│                         THE NEW WAY                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│       MacBook   iPad    Phone    Work PC    Friend's Laptop            │
│          │        │       │         │            │                      │
│          └────────┼───────┼─────────┼────────────┘                      │
│                   │       │         │                                   │
│                   ▼       ▼         ▼                                   │
│            ┌──────────────────────────────┐                            │
│            │    SSH Connection            │                            │
│            │    (Works from any device    │                            │
│            │     with a terminal app)     │                            │
│            └──────────────┬───────────────┘                            │
│                           │                                             │
│                           ▼                                             │
│   ┌─────────────────────────────────────────────────────────────┐      │
│   │               YOUR AI DEVELOPMENT CONTAINER                  │      │
│   │                   (Lives in the cloud)                       │      │
│   │                                                              │      │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │      │
│   │   │ Claude   │ │ GitHub   │ │ Gemini   │ │ OpenAI   │      │      │
│   │   │ Code     │ │ Copilot  │ │ CLI      │ │ Codex    │      │      │
│   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘      │      │
│   │                                                              │      │
│   │   ┌─────────────────────────────────────────────────────┐   │      │
│   │   │  Your Projects • Your History • Your Configurations │   │      │
│   │   │          (Always there, always synced)              │   │      │
│   │   └─────────────────────────────────────────────────────┘   │      │
│   └─────────────────────────────────────────────────────────────┘      │
│                                                                         │
│   Result: One environment, everywhere, always ready                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## The Magic: What You Actually Get

### 1. Six AI Coding Assistants, Zero Conflicts

The container comes pre-loaded with the most powerful AI coding tools available:

| Tool                   | What It Does Best                     | My Favorite Use             |
| ---------------------- | ------------------------------------- | --------------------------- |
| **Claude Code**        | Deep reasoning, complex architecture  | Refactoring legacy code     |
| **GitHub Copilot CLI** | GitHub integration, quick completions | Managing repos and Actions  |
| **Gemini CLI**         | Visual understanding, web research    | UI design and prototyping   |
| **OpenAI Codex**       | Fast code generation                  | Quick scripts and utilities |
| **Aider**              | Git-aware pair programming            | Long coding sessions        |
| **OpenCode**           | Open-source flexibility               | Experimenting with models   |

Each tool has different strengths. Having them all in one place means I can pick the right one for each job—like having a full toolbox instead of just a hammer.

### 2. Smart Routing: Ask Questions, Get the Right Tool

Here's where it gets interesting. Instead of memorizing which AI is best for what, I built a **smart router** that figures it out for me:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    SMART ROUTING IN ACTION                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   You type: route                                                       │
│   System asks: "What do you want to work on?"                          │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ "I need to design an API for user authentication"               │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                            │                                            │
│                            ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                    ROUTING ANALYSIS                              │  │
│   │                                                                  │  │
│   │   Detected keywords:                                             │  │
│   │   • "API" → Backend work                                        │  │
│   │   • "design" → Architecture needed                              │  │
│   │   • "authentication" → Security-critical                        │  │
│   │                                                                  │  │
│   │   Best match: Claude Opus (deep reasoning, security analysis)   │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                            │                                            │
│                            ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ 🚀 Launching Claude Code with Opus model...                     │  │
│   │                                                                  │  │
│   │ Claude: "I'll help you design a secure authentication API.      │  │
│   │ Let me start by understanding your requirements..."             │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Different requests route to different tools:

```
"Create a landing page"           → Gemini CLI (visual design strength)
"Review this code for bugs"       → Claude Opus (deep analysis)
"Set up GitHub Actions"           → Copilot CLI (GitHub integration)
"Write unit tests"                → Claude Sonnet (fast, methodical)
"Build a quick prototype"         → Gemini CLI (rapid prototyping)
```

No more guessing. No more switching terminals. Just describe what you want, and you're connected to the best AI for the job.

### 3. Multi-Agent Orchestration: AI Teams, Not Solo Players

This is my favorite feature—and the one that changed how I build software.

**The problem with asking one AI to build a complex application:** It loses context. It forgets what it did earlier. It makes inconsistent decisions. By the time it's building the frontend, it's forgotten the exact API endpoints it created for the backend.

**The solution:** Don't ask one AI to do everything. Assemble a team.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MULTI-AGENT ORCHESTRATION                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   You: "Build a SaaS for project management"                           │
│                                                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                       ORCHESTRATOR                               │  │
│   │        (Coordinates the team, ensures integration)               │  │
│   └───────────────────────────┬─────────────────────────────────────┘  │
│                               │                                         │
│         ┌─────────────────────┼─────────────────────┐                  │
│         │                     │                     │                  │
│         ▼                     ▼                     ▼                  │
│   ┌───────────┐        ┌───────────┐        ┌───────────┐             │
│   │ BACKEND   │        │ FRONTEND  │        │ TESTING   │             │
│   │ ARCHITECT │        │ DEVELOPER │        │ ENGINEER  │             │
│   │           │        │           │        │           │             │
│   │ Claude    │        │ Gemini    │        │ Claude    │             │
│   │ Opus      │        │ CLI       │        │ Sonnet    │             │
│   │           │        │           │        │           │             │
│   │ Building: │        │ Building: │        │ Building: │             │
│   │ • APIs    │        │ • UI      │        │ • Tests   │             │
│   │ • Database│        │ • Pages   │        │ • Mocks   │             │
│   │ • Auth    │        │ • Forms   │        │ • E2E     │             │
│   └───────────┘        └───────────┘        └───────────┘             │
│         │                     │                     │                  │
│         └─────────────────────┼─────────────────────┘                  │
│                               │                                         │
│                               ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │                   INTEGRATION CHECK                              │  │
│   │                                                                  │  │
│   │   ✓ API endpoints match frontend calls                          │  │
│   │   ✓ Database schema supports all features                       │  │
│   │   ✓ All tests passing                                           │  │
│   │   ✓ Authentication flow works end-to-end                        │  │
│   │                                                                  │  │
│   │   Status: READY TO SHIP 🚀                                       │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Here's the key insight:** These agents work **in parallel**, not sequentially. While the backend architect is designing APIs, the frontend developer is building UI components, and the testing engineer is setting up the test framework. What used to take 3+ hours now takes 1 hour (the time of the slowest agent).

And because each agent has its own context window, they can each focus 100% on their specialty. The backend architect isn't distracted by CSS decisions. The frontend developer isn't thinking about database indexes.

---

## A Real Example: Building TaskFlow in One Hour

Let me walk you through what using this actually looks like. I wanted to build a task management app for freelancers.

### Step 1: Start the Orchestrator

```bash
$ orchestrate

    ╔═══════════════════════════════════════════════════════════════╗
    ║      🎯 Multi-Agent Project Orchestrator                      ║
    ║      Coordinate AI Agents for Complex Projects                ║
    ╚═══════════════════════════════════════════════════════════════╝

🎯 What would you like to build?
```

### Step 2: Describe What I Want

```
► Build a task management app for freelancers with:
  - User login (email + Google)
  - Kanban boards for projects
  - Time tracking per task
  - Invoice generation from tracked time
  - Stripe for payments
```

### Step 3: Answer a Few Quick Questions

```
📋 Requirements Gathering

  → Project type? MVP
  → Tech stack? Next.js, PostgreSQL
  → Timeline? 1 week
  → Priority features? Auth and Kanban boards
  → Constraints? Must be mobile-friendly
```

### Step 4: Watch the Magic

```
📋 Execution Plan

Agents to be deployed:
  1. backend-architect   → Claude Opus    (APIs, database, auth)
  2. frontend-developer  → Gemini CLI     (UI, Kanban, dashboard)
  3. test-writer-fixer   → Claude Sonnet  (unit tests, E2E tests)
  4. security-expert     → Claude Opus    (security review)

Proceed? [Y/n]: Y

🚀 Launching agents...

[14:32:05] Agent Status:

backend-architect    ● Running    [======>   ] 65%
frontend-developer   ● Running    [====>     ] 45%
test-writer-fixer    ● Running    [==>       ] 25%
security-expert      ○ Waiting    [          ] 0%
```

### Step 5: Integration Verified, Project Complete

```
✅ Integration Verification Complete

All components verified:
• API endpoints match frontend calls ✓
• Database schema supports all features ✓
• Authentication flow works ✓
• 47 tests passing ✓
• No security vulnerabilities ✓

📁 Project created in /workspace/taskflow/
```

One hour. A complete, working application with authentication, a Kanban board, time tracking, invoicing, and payment integration. All components tested and verified to work together.

---

## The Isolation Advantage: Your Computer Stays Clean

Here's something that might not be immediately obvious but matters a lot: **everything runs inside the container, completely isolated from your personal computer.**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ISOLATION ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   YOUR MAC / PC                          THE CLOUD                      │
│   ┌─────────────────────┐               ┌─────────────────────────────┐│
│   │                     │               │   HETZNER SERVER            ││
│   │  Clean system       │               │   ┌─────────────────────┐   ││
│   │                     │               │   │   DOCKER CONTAINER   │   ││
│   │  • No npm packages  │    SSH        │   │                     │   ││
│   │  • No Python deps   │◄─────────────►│   │  All AI tools       │   ││
│   │  • No API keys      │   (encrypted) │   │  All dependencies   │   ││
│   │  • No conflicts     │               │   │  All your projects  │   ││
│   │                     │               │   │  All API keys       │   ││
│   │  Only needed:       │               │   │                     │   ││
│   │  • Terminal app     │               │   │  Isolated from      │   ││
│   │  • SSH key          │               │   │  everything else    │   ││
│   │                     │               │   └─────────────────────┘   ││
│   └─────────────────────┘               └─────────────────────────────┘│
│                                                                         │
│   What this means for you:                                              │
│                                                                         │
│   ✓ Your Mac never gets cluttered with development dependencies        │
│   ✓ No "works on my machine" problems—it's always the same machine     │
│   ✓ API keys stay on the server, not on every device you own          │
│   ✓ If something breaks, rebuild the container—your Mac is untouched  │
│   ✓ Easy to share: give someone SSH access, they have the full setup  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why This Matters

**1. Your Personal Computer Stays Fast and Clean**

Every developer knows the creeping slowness that comes from installing tools over years. Node modules here, Python environments there, Go binaries somewhere else. My Mac used to have 40GB of development cruft. Now? Zero.

**2. API Keys Are Centralized and Secure**

Instead of your Anthropic and OpenAI keys being scattered across three laptops and a desktop, they're in one place—the server. Your devices only need an SSH key (which never leaves your device) to connect.

**3. Disaster Recovery Is Trivial**

Laptop stolen? Hard drive crashed? No problem. Get a new device, transfer your SSH key, and you're back to work in 5 minutes. All your projects, history, and configurations are safe in the cloud.

**4. Reproducible Environment**

The container is defined by a Dockerfile. If anything goes wrong, you can rebuild it from scratch and get exactly the same environment. No more "let me try reinstalling Node" debugging sessions.

---

## Remote Control: Connecting from Anywhere

The container is controlled entirely through SSH—the same secure protocol that powers most of the internet's infrastructure.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REMOTE ACCESS FLOW                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│                        ┌───────────────────┐                           │
│                        │   YOUR DEVICE     │                           │
│                        │                   │                           │
│   MacBook              │  ┌─────────────┐  │                           │
│   ───────────────────► │  │ Terminal    │  │                           │
│                        │  │ ssh ai-dev  │  │                           │
│   iPad + Termius       │  └─────────────┘  │                           │
│   ───────────────────► │         │        │                           │
│                        │         ▼        │                           │
│   iPhone + Blink       │  ┌─────────────┐  │                           │
│   ───────────────────► │  │ SSH Key     │  │ (your private key)        │
│                        │  │ [encrypted] │  │                           │
│   Work Computer        │  └──────┬──────┘  │                           │
│   ───────────────────► │         │        │                           │
│                        └─────────┼────────┘                           │
│                                  │                                     │
│                                  ▼                                     │
│                        ┌─────────────────┐                            │
│                        │   ENCRYPTED     │                            │
│                        │   CONNECTION    │                            │
│                        │   over Internet │                            │
│                        └────────┬────────┘                            │
│                                 │                                      │
│                                 ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────┐ │
│   │                     HETZNER CLOUD                                │ │
│   │   ┌─────────────────────────────────────────────────────────┐   │ │
│   │   │                DOCKER CONTAINER                          │   │ │
│   │   │                                                          │   │ │
│   │   │   You're now inside. Full control:                       │   │ │
│   │   │                                                          │   │ │
│   │   │   $ claude            # Start Claude Code                │   │ │
│   │   │   $ route frontend    # Route to Gemini for UI work     │   │ │
│   │   │   $ orchestrate       # Launch multi-agent system       │   │ │
│   │   │   $ cd /workspace     # Access your projects            │   │ │
│   │   │                                                          │   │ │
│   │   │   Everything persists between sessions                   │   │ │
│   │   │                                                          │   │ │
│   │   └─────────────────────────────────────────────────────────┘   │ │
│   └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Connecting Is Simple

Once set up, connecting is a single command:

```bash
ssh ai-dev
```

That's it. You're in. Same environment whether you're connecting from your MacBook at the office, your iPad on a train, or your phone during a power outage at home.

### Recommended Apps by Device

| Device  | App                 | Notes                        |
| ------- | ------------------- | ---------------------------- |
| Mac     | Terminal (built-in) | Just works                   |
| Windows | Windows Terminal    | Install from Microsoft Store |
| iPad    | Termius             | Excellent keyboard support   |
| iPhone  | Blink Shell         | Full SSH with mosh support   |
| Android | Termux              | Free and powerful            |
| Browser | Any web-based SSH   | For emergencies              |

---

## The 40 Specialized Agents

Beyond the AI coding assistants themselves, the system includes **40 specialized agent personas** across different domains:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    THE AGENT ROSTER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ENGINEERING (7 agents)          DESIGN (5 agents)                     │
│   ├── backend-architect          ├── ui-designer                       │
│   ├── frontend-developer         ├── ux-researcher                     │
│   ├── mobile-developer           ├── design-system-architect           │
│   ├── api-integrations           ├── animation-specialist              │
│   ├── rapid-prototyper           └── accessibility-expert              │
│   ├── test-writer-fixer                                                │
│   └── code-reviewer              PRODUCT (6 agents)                    │
│                                   ├── product-planner                   │
│   OPERATIONS (7 agents)          ├── user-researcher                   │
│   ├── devops-engineer            ├── analytics-specialist              │
│   ├── sre-specialist             ├── competitor-analyst                │
│   ├── security-expert            ├── feature-specs-writer              │
│   ├── database-administrator     └── product-launcher                  │
│   ├── performance-optimizer                                            │
│   ├── monitoring-specialist      PROJECT MANAGEMENT (5 agents)         │
│   └── cost-optimizer             ├── project-manager                   │
│                                   ├── scrum-master                      │
│   MARKETING (6 agents)           ├── technical-writer                  │
│   ├── content-creator            ├── qa-coordinator                    │
│   ├── seo-specialist             └── documentation-specialist          │
│   ├── social-media-manager                                             │
│   ├── email-marketer             DATA (2 agents)                       │
│   ├── growth-strategist          ├── data-engineer                     │
│   └── brand-voice-guardian       └── ml-engineer                       │
│                                                                         │
│   + 1 Project Orchestrator that coordinates them all                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Each agent has specialized prompts and is routed to the optimal AI model for their task. The backend architect goes to Claude Opus for deep reasoning. The UI designer goes to Gemini for its visual understanding. The test writer goes to Claude Sonnet for speed and methodical thoroughness.

---

## Cost: Surprisingly Affordable

Let's talk money. This entire setup costs less than a fancy coffee habit:

| Component                              | Cost                       |
| -------------------------------------- | -------------------------- |
| Hetzner CPX11 Server (2 vCPU, 2GB RAM) | ~€5/month                  |
| Anthropic API (Claude)                 | Pay per use                |
| OpenAI API (Codex)                     | Pay per use                |
| Google AI (Gemini)                     | Free tier available        |
| GitHub Copilot                         | Included with subscription |

For about **€5-10/month** for the server plus your normal API usage, you get a professional development environment accessible from anywhere.

Compare this to the time lost managing multiple local installations, fixing dependency conflicts, and recreating setups across devices. The ROI is immediate.

---

## Getting Started: The Quick Version

1. **Clone the repository** to your computer
2. **Add your API keys** to a `.env` file
3. **Run the deploy script** pointing to your Hetzner server
4. **Connect via SSH** and start coding

```bash
# On your Mac
git clone https://github.com/yourusername/agent-container
cd agent-container
cp .env.example .env
nano .env  # Add your API keys

# Deploy to your server
HETZNER_IP=your.server.ip ./scripts/deploy.sh

# Connect and start working
ssh ai-dev
cd /workspace
orchestrate "Build something amazing"
```

---

## Why This Changes Everything

Before this setup, I felt like I was fighting my tools. Different AI assistants on different machines with different configurations. Context switching between terminals. Losing my command history when I switched laptops. Worrying about API keys scattered across devices.

Now? I have one unified command center. Every AI tool at my fingertips, accessible from any device, with my entire project history preserved. When I describe what I want to build, specialized agents collaborate to make it happen—in parallel, verified to work together.

**It's not about having more AI tools. It's about having them work together as a team.**

The container runs quietly on a server in Germany, ready whenever I need it. My Mac stays clean. My API keys stay secure. My projects stay synchronized.

And when inspiration strikes on a train, I pull out whatever device is handy, type `ssh ai-dev`, and I'm coding with the full power of multiple AI assistants—exactly where I left off.

That's the dream realized.
