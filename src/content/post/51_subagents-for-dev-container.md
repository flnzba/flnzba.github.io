---
title: '#51 Implementing a SubAgent Orchestration System for Complex AI Development Tasks in my Dev Container'
description: 'How I built a multi-agent orchestration system using bash to coordinate specialized AI agents.'
publishDate: '19 January 2026'
updatedDate: '19 January 2026'
# coverImage:
#     src: ''
#     alt: ''
tags: ['Docker', 'AI Agents', 'Hetzner']
---

## Building a Multi-Agent AI Orchestra: How I Solved the Coordination Problem

## Part 1 Recap: Where We Left Off

In my [previous blog post](https:fzeba.com/post/50_cloud-based-agentic-dev-container.md), I built a Docker container that unified Claude Code, OpenAI Codex, and OpenCode into a single, portable development environment. I could SSH in from any device and have all my AI tools ready to go.

It was great. For about two weeks.

Then I tried to build something ambitious: a full-stack SaaS application with authentication, payments, a dashboard, and an API. I typed out my detailed prompt, hit enter, and waited for Claude to work its magic.

**The result? Chaos.**

Claude wrote the backend API. Then it wrote the frontend. But the API endpoints it created didn't match the frontend's fetch calls. The database schema was missing fields the UI expected. The authentication flow was designed twice—differently each time. And when I asked Claude to fix the integration issues, it lost context of the original requirements and started making completely different assumptions.

I had hit the wall that every AI-assisted developer eventually hits: **AI coding assistants are brilliant at focused tasks, but they struggle with complex, multi-component projects.**

This post is about how I solved that problem by building a multi-agent orchestration system—where specialized AI agents work in parallel like a well-coordinated development team, with an orchestrator ensuring their work integrates seamlessly.

## The Problem: One AI, Too Many Hats

Let me paint the picture of what happens when you ask a single AI to build a full-stack app:

```
You: "Build a SaaS for project management with auth, Kanban boards,
      time tracking, invoicing, and Stripe payments."

AI (thinking): "Okay, that's... a lot. Let me start with the backend..."

[40 minutes later]

AI: "I've built the User model with email/password auth."

You: "Great, but what about Google OAuth? And the Kanban boards?"

AI: "Right! Let me add OAuth... here's the frontend login component..."

[Switches context, loses track of database schema decisions]

AI: "Done! The login button is styled nicely."

You: "The login button calls /api/auth/login but you created /api/users/authenticate"

AI: "Oh, let me fix that..."

[Fixes frontend, forgets it broke the backend test]

You: "The tests are failing now."

AI: "What tests?"
```

Sound familiar?

The fundamental issue is that AI models, despite their impressive capabilities, work with **limited context windows** and **single-threaded attention**. When you ask one AI to build a complex system, it has to:

1. Hold the entire project architecture in context
2. Remember every decision made hours ago
3. Switch between backend, frontend, testing, and DevOps thinking
4. Maintain consistency across hundreds of files
5. Not lose sight of the original requirements

That's asking too much. Even for Claude Opus with its 200K context window.

**The solution became obvious: don't ask one AI to wear all the hats. Build a team.**

## The Insight: How Human Teams Work

Before diving into code, I thought about how real development teams tackle complex projects.

A startup building a SaaS doesn't have one developer doing everything. They have:

-   A **backend engineer** designing APIs and database schemas
-   A **frontend developer** building the UI
-   A **QA engineer** writing tests
-   A **DevOps person** setting up deployment
-   A **project manager** coordinating everyone

Each person is a specialist. They work in parallel on their domain. They communicate through shared artifacts (design docs, API contracts, git repos). And critically, **someone coordinates them** to ensure the pieces fit together.

What if I could replicate this with AI agents?

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HUMAN TEAM                                      │
│                                                                         │
│   Project Manager                                                       │
│         │                                                               │
│         ├──► Backend Engineer ──► API Code                             │
│         ├──► Frontend Developer ──► UI Code                            │
│         ├──► QA Engineer ──► Tests                                     │
│         └──► DevOps ──► Deployment                                     │
│                                                                         │
│   PM ensures: API contracts match, features are complete, code works   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

                              ↓ TRANSLATE TO ↓

┌─────────────────────────────────────────────────────────────────────────┐
│                         AI AGENT TEAM                                   │
│                                                                         │
│   Orchestrator Script                                                   │
│         │                                                               │
│         ├──► Claude Opus (Backend) ──► API Code                        │
│         ├──► Gemini CLI (Frontend) ──► UI Code                         │
│         ├──► Claude Sonnet (Testing) ──► Tests                         │
│         └──► Claude Sonnet (DevOps) ──► Deployment                     │
│                                                                         │
│   Orchestrator ensures: Integration works, requirements met, verified  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

This insight led to the Multi-Agent Orchestration System.

## Architecture: The Orchestra and Its Instruments

### The Big Picture

The system has three layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     LAYER 1: USER INTERFACE                             │
│                                                                         │
│   orchestrate "Build a SaaS for project management"                    │
│   route multi                                                          │
│   route backend-arch                                                   │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     LAYER 2: ORCHESTRATOR                               │
│                                                                         │
│   • Prompt Analysis & Requirements Gathering                           │
│   • Agent Planning & Task Distribution                                 │
│   • Parallel Execution Management                                      │
│   • Progress Monitoring                                                │
│   • Integration Verification                                           │
│   • Fix Cycles                                                         │
│                                                                         │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        ▼                        ▼                        ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│ LAYER 3:      │        │               │        │               │
│ AI CLI Agents │        │               │        │               │
│               │        │               │        │               │
│ Claude Opus   │        │ Gemini CLI    │        │ Claude Sonnet │
│ Claude Sonnet │        │ Copilot CLI   │        │ Codex CLI     │
│               │        │               │        │               │
└───────────────┘        └───────────────┘        └───────────────┘
```

Let's break down each component.

## The Orchestrator: Bash as the Conductor

Here's a decision that might surprise you: **the orchestrator is a bash script, not an AI agent.**

Why bash? Because the orchestrator needs to:

1. Spawn and manage multiple processes
2. Track PIDs and exit codes
3. Read/write state files
4. Coordinate timing and dependencies
5. Never "forget" what it's doing

AI models can lose context. Bash scripts don't. The orchestrator is deterministic—it follows its coordination logic exactly, every time.

### The Orchestration Lifecycle

```bash
#!/bin/bash
# Multi-Agent Orchestrator - The Conductor

main() {
    show_banner

    # Phase 1: Initialize Session
    SESSION_ID=$(generate_session_id)
    SESSION_DIR="${PROJECTS_DIR}/${SESSION_ID}"
    mkdir -p "$SESSION_DIR"

    # Phase 2: Capture User Prompt (COMPLETE, UNTRUNCATED)
    capture_user_prompt

    # Phase 3: Analyze & Plan
    components=$(analyze_project_request "$ORIGINAL_PROMPT")
    agents=$(map_components_to_agents "$components")

    # Phase 4: Gather Requirements (Clarifying Questions)
    gather_requirements

    # Phase 5: Execute Parallel Agents
    execute_orchestration "$agents"

    # Phase 6: Monitor Until All Complete
    monitor_agents

    # Phase 7: Verify Integration
    verify_integration

    # Phase 8: Fix Cycles if Needed
    if [ $? -ne 0 ]; then
        run_fix_cycle 3  # Up to 3 attempts
    fi

    # Phase 9: Final Report
    final_report
}
```

Each phase solves a specific problem I encountered in my single-agent nightmare.

## Problem 1: The Lost Prompt

**The Problem:** When I gave Claude a detailed prompt, it would start working on one part and gradually forget details from other parts. By the time it got to the fifth feature, it had no memory of the specific requirements for the first feature.

**The Solution: Full Prompt Preservation**

The orchestrator stores the complete, unmodified prompt and passes it to **every** agent:

```bash
# Store the COMPLETE original prompt
echo "$initial_prompt" > "${SESSION_DIR}/original_prompt.txt"

# Later, when launching each agent:
launch_agent() {
    local full_prompt="## Project Context

You are working as part of a multi-agent team coordinated by an orchestrator.
Your role: $agent_type

## Original Project Request

$ORIGINAL_PROMPT   # <-- FULL PROMPT, NOT SUMMARIZED

## Your Specific Task

$task

## Integration Notes

Other agents working on this project:
$(for a in "${ACTIVE_AGENTS[@]}"; do echo "- $a"; done)

Ensure your code is compatible with shared interfaces."

    # Launch with full context
    claude --model opus -p "$full_prompt"
}
```

Now every agent—backend, frontend, testing, DevOps—sees the complete original requirements. The backend architect knows about the Kanban boards (even though they're building APIs). The frontend developer knows about Stripe (even though they're building UI).

This shared context is crucial for **implicit coordination**—agents naturally make compatible decisions because they understand the full picture.

## Problem 2: The One-Track Mind

**The Problem:** A single AI works sequentially. It builds the backend, then the frontend, then the tests. Total time: 3+ hours. And by the time it gets to testing, it's forgotten details about the backend implementation.

**The Solution: True Parallel Execution**

The orchestrator spawns each agent as a **separate background process**:

```bash
launch_agent() {
    local agent_id="$1"
    local agent_type="$2"
    local cli="$3"
    local task="$4"

    # Run in background with subshell
    (
        update_agent_state "$state_file" "status" '"running"'
        update_agent_state "$state_file" "started_at" "\"$(date -Iseconds)\""

        # Execute the AI CLI
        if claude --model opus -p "$full_prompt" >> "$output_file" 2>&1; then
            update_agent_state "$state_file" "status" '"completed"'
            update_agent_state "$state_file" "exit_code" "0"
        else
            update_agent_state "$state_file" "status" '"failed"'
            update_agent_state "$state_file" "exit_code" "$?"
        fi

        touch "$marker_file"  # Signal completion
    ) &

    local pid=$!
    ACTIVE_AGENTS+=("$agent_id:$pid:$state_file")
}
```

Key insight: **Each agent process is completely independent.** They don't share context windows. They don't share memory. They're separate CLI invocations running in parallel.

```
Timeline: Single Agent (Sequential)
─────────────────────────────────────────────────────────────
[  Backend (60min)  ][  Frontend (50min)  ][  Testing (40min)  ]
Total: 2.5 hours

Timeline: Multi-Agent (Parallel)
─────────────────────────────────────────────────────────────
[  Backend (60min)  ]
[  Frontend (50min) ]
[  Testing (40min)  ]
Total: 1 hour (max of all agents)
```

This isn't just faster—it also means each agent has **100% of its context window** dedicated to its specialized task. No context lost to remembering other domains.

## Problem 3: The Context Window Confusion

**The Problem:** When I first designed the system, I worried: "If I run 4 agents, do I have 4x the context available, or does it all share one pool?"

**The Answer: Complete Independence**

This is crucial to understand:

```
┌─────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                           │
│                   (bash script - no AI)                     │
└─────────────────────┬───────────────────────────────────────┘
                      │ spawns separate processes
        ┌─────────────┼─────────────┬─────────────┐
        ▼             ▼             ▼             ▼
┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
│  Claude   │  │  Gemini   │  │  Claude   │  │  Codex    │
│   Opus    │  │   CLI     │  │  Sonnet   │  │   CLI     │
├───────────┤  ├───────────┤  ├───────────┤  ├───────────┤
│ Context:  │  │ Context:  │  │ Context:  │  │ Context:  │
│  200K     │  │   1M+     │  │  200K     │  │  128K     │
│ (SEPARATE)│  │ (SEPARATE)│  │ (SEPARATE)│  │ (SEPARATE)│
└───────────┘  └───────────┘  └───────────┘  └───────────┘
```

Each agent gets its **FULL** context window. Running 4 agents doesn't mean dividing 200K by 4—it means having 200K + 1M + 200K + 128K = **1.5M+ tokens** of context working simultaneously.

But—and this is the trade-off—**agents can't see each other's conversations.** They can only coordinate through:

1. The shared original prompt
2. The filesystem (the actual code they write)
3. The orchestrator's final verification step

This is actually a feature, not a bug. It mirrors how human teams work: the backend engineer doesn't need to see every Slack message the frontend developer sends. They just need to agree on the API contract and deliver compatible code.

## Problem 4: The Blind Orchestrator

**The Problem:** Once I launched parallel agents, how would I know what's happening? Were they stuck? Failed? Done?

**The Solution: Continuous Monitoring Dashboard**

The orchestrator polls agent state files and displays real-time status:

```bash
monitor_agents() {
    while true; do
        local all_done=true
        local status_line=""

        echo -ne "\r[$(date '+%H:%M:%S')] Agent Status: "

        for agent_entry in "${ACTIVE_AGENTS[@]}"; do
            IFS=':' read -r agent_id pid state_file <<< "$agent_entry"
            local status=$(get_agent_state "$state_file" "status")

            case $status in
                pending)   status_line="${status_line}○ "; all_done=false ;;
                running)   status_line="${status_line}● "; all_done=false ;;
                completed) status_line="${status_line}✓ " ;;
                failed)    status_line="${status_line}✗ " ;;
            esac
        done

        echo -ne "$status_line"

        if $all_done; then break; fi
        sleep 5
    done
}
```

What you see in your terminal:

```
[14:32:05] Agent Status: ● ● ● ○

backend-architect    ● Running    [=====>    ] 60%
frontend-developer   ● Running    [===>      ] 40%
test-writer-fixer    ● Running    [=>        ] 15%
security-expert      ○ Waiting    [          ] 0%

Legend: ○ Pending  ● Running  ✓ Complete  ✗ Failed
```

The orchestrator doesn't move to verification until **all agents complete**. No more partial implementations where the backend is done but the frontend is still being written.

## Problem 5: The Integration Nightmare

**The Problem:** Even with parallel agents, there's no guarantee their outputs work together. The backend might create `/api/users/:id` but the frontend calls `/api/user/:userId`. Different names, broken integration.

**The Solution: Automated Integration Verification**

After all agents complete, the orchestrator runs a verification step—using Claude Opus as an integration reviewer:

```bash
verify_integration() {
    local summaries=$(get_agent_summaries)

    local verification_prompt="## Integration Verification Task

You are the project orchestrator verifying that all agent outputs integrate correctly.

## Original Request

$ORIGINAL_PROMPT

## Agent Outputs

$summaries

## Your Tasks

1. **Completeness Check**: Verify all aspects of the original request have been addressed
2. **Integration Check**: Ensure all components work together (APIs match frontend calls, etc.)
3. **Consistency Check**: Verify naming conventions, coding styles, and patterns are consistent
4. **Dependency Check**: Ensure all dependencies are properly declared
5. **Test Coverage Check**: Verify testing covers the implementation

## Output Format

Please provide:
1. A checklist of original requirements and their status (✅ Done, ⚠️ Partial, ❌ Missing)
2. List of any integration issues found
3. List of any conflicts between agent outputs
4. Recommendations for fixes needed
5. Overall project status (READY / NEEDS_FIXES / INCOMPLETE)"

    claude --model opus -p "$verification_prompt" > "$verification_output"

    if grep -q "NEEDS_FIXES\|INCOMPLETE" "$verification_output"; then
        return 1  # Integration failed
    fi
    return 0  # Integration passed
}
```

This is where the magic happens. The verifier:

-   Reads all agent outputs together (summaries of their work)
-   Compares them against the original requirements
-   Identifies mismatches like API contract disagreements
-   Flags incomplete features
-   Produces a clear pass/fail verdict

## Problem 6: The Fix Loop of Doom

**The Problem:** When verification fails, you need to fix issues. But if you just re-run agents, they might introduce new issues while fixing old ones. You end up in an infinite fix loop.

**The Solution: Bounded Fix Cycles**

The orchestrator runs up to 3 fix cycles before requiring human intervention:

```bash
run_fix_cycle() {
    local max_cycles="${1:-3}"
    local cycle=1

    while [ $cycle -le $max_cycles ]; do
        log INFO "Running fix cycle $cycle of $max_cycles..."

        # Create targeted fix prompt from verification output
        local fix_prompt="## Fix Cycle $cycle

Based on the integration verification, please fix the identified issues.

## Issues to Fix

$(grep -A 20 "integration issues\|Issues Found\|NEEDS_FIXES" "$verification_output")

## Instructions

1. Address each identified issue
2. Ensure fixes don't break existing functionality
3. Run tests after fixes
4. Document what was changed"

        # Launch fix agent
        claude --model opus -p "$fix_prompt" > "$fix_output"

        # Re-verify
        if verify_integration; then
            log OK "Fix cycle $cycle resolved all issues!"
            return 0
        fi

        ((cycle++))
    done

    log WARN "Maximum fix cycles reached. Manual intervention needed."
    return 1
}
```

The key improvements:

1. **Targeted fixes**: The fix prompt includes specific issues from verification
2. **Limited attempts**: 3 cycles max prevents infinite loops
3. **Re-verification**: Each fix cycle is verified before continuing
4. **Clear failure**: If 3 cycles can't fix it, the human is alerted with specific details

## The Agent Specialists: Who Does What

Not all agents are created equal. I carefully matched each task type to the optimal AI CLI:

### The Agent Roster

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           AGENT SPECIALISTS                              │
├──────────────────┬──────────────────┬────────────────────────────────────┤
│ Agent Type       │ CLI              │ Why This Pairing?                  │
├──────────────────┼──────────────────┼────────────────────────────────────┤
│ backend-architect│ Claude Opus      │ Deep reasoning for complex APIs    │
│ frontend-developer│ Gemini CLI       │ Multimodal, visual understanding   │
│ test-writer-fixer│ Claude Sonnet    │ Fast, methodical, good for TDD     │
│ devops-engineer  │ Claude Sonnet    │ Infrastructure patterns            │
│ ui-designer      │ Gemini CLI       │ Design eye, component styling      │
│ security-expert  │ Claude Opus      │ Threat modeling, deep analysis     │
│ technical-writer │ Claude Sonnet    │ Clear documentation, fast          │
│ data-engineer    │ Claude Opus      │ Schema design, data modeling       │
└──────────────────┴──────────────────┴────────────────────────────────────┘
```

Each agent gets a tailored task prompt. Here's what the backend-architect receives:

```bash
generate_agent_task() {
    case $agent_type in
        backend-architect)
            echo "Design and implement the backend architecture including:
- API endpoints and routes
- Database schema and models
- Authentication and authorization
- Business logic and services
- Error handling and validation
Ensure APIs are well-documented and follow RESTful conventions."
            ;;

        frontend-developer)
            echo "Design and implement the frontend including:
- UI components and layouts
- State management
- API integration with backend
- Responsive design
- User interactions and feedback
Ensure the UI is intuitive and matches modern design standards."
            ;;

        # ... other agents
    esac
}
```

## The Smart Router: Choosing the Right Tool

Sometimes you don't need a full orchestra—you just need one instrument. That's where the `route` command comes in.

### Automatic Task Detection

```bash
# The route script analyzes your prompt and picks the best CLI

$ route
► Enter your task: "Review this authentication code for security vulnerabilities"

🔍 Analyzing your request...

Detected: Security review task
Recommended: Claude Opus (deep analysis, threat modeling)

Launching claude --model opus...
```

The routing logic uses keyword detection:

```bash
detect_task_category() {
    local prompt="$1"
    local prompt_lower=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')

    # Security tasks → Claude Opus
    if [[ "$prompt_lower" =~ (security|vulnerability|audit|penetration|threat) ]]; then
        echo "security"
        return
    fi

    # UI/Design tasks → Gemini
    if [[ "$prompt_lower" =~ (ui|design|visual|css|animation|component) ]]; then
        echo "design"
        return
    fi

    # GitHub tasks → Copilot CLI
    if [[ "$prompt_lower" =~ (github|workflow|actions|ci/cd|pull.request) ]]; then
        echo "github"
        return
    fi

    # Default to Claude Sonnet for general coding
    echo "general"
}
```

### Manual Routing

For power users who know exactly what they want:

```bash
route backend-arch     # Jump straight to Claude Opus
route frontend         # Jump to Gemini CLI
route testing          # Claude Sonnet for tests
route github           # Copilot CLI for GitHub tasks
```

## A Complete Example: Building TaskFlow SaaS

Let me walk through a real orchestration session, step by step.

### Step 1: Launch the Orchestrator

```bash
$ orchestrate

    ╔═══════════════════════════════════════════════════════════════╗
    ║      🎯 Multi-Agent Project Orchestrator v1.0                ║
    ║      Coordinate AI Agents for Complex Projects               ║
    ╚═══════════════════════════════════════════════════════════════╝

ℹ  Starting orchestration session: orch-20260118-143000-12345

🎯 What would you like to build?
(Describe your project in detail. The more context, the better.)

►
```

### Step 2: Enter the Detailed Prompt

```
► Create a full-stack task management application called TaskFlow for
  freelancers with:

  - User authentication (email/password + Google OAuth)
  - Project and task management with drag-and-drop Kanban boards
  - Time tracking per task with start/stop timer
  - Invoice generation from tracked time entries
  - Client portal where clients can view project progress
  - Stripe integration for subscription billing

  Tech stack: Next.js 14, Prisma ORM, PostgreSQL, Redis for caching

  The UI should be modern, clean, with a dark mode option.
  Mobile-responsive is essential.
```

### Step 3: Requirements Gathering

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Requirements Gathering
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ  Analyzing your request...

Detected project components:
  ✓ backend
  ✓ frontend
  ✓ testing
  ✓ security
  ✓ devops

Please answer a few questions to clarify requirements:
(Press Enter to skip any question)

  → Project type? (MVP/prototype, production, enterprise): MVP
  → Preferred tech stack?: Already specified - Next.js, Prisma, PostgreSQL
  → Any timeline constraints?: 1 week
  → Most important features to prioritize?: Auth and Kanban boards
  → Any specific constraints or requirements?: Must work on mobile
```

### Step 4: Review the Execution Plan

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Execution Plan
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Agents to be deployed:

  1. backend-architect → claude-opus
  2. frontend-developer → gemini
  3. test-writer-fixer → claude-sonnet
  4. security-expert → claude-opus
  5. devops-engineer → claude-sonnet

Execution strategy:
  • Agents will run in parallel where possible
  • Each agent receives full project context
  • Orchestrator monitors progress continuously
  • Integration verification after completion
  • Fix cycles if issues are detected

Proceed with this plan? [Y/n/edit]: Y
```

### Step 5: Watch the Parallel Execution

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 Executing Multi-Agent Orchestration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🤖 Launching backend-architect (claude-opus)...
✓  Agent backend-architect-1 started (PID: 45231)

🤖 Launching frontend-developer (gemini)...
✓  Agent frontend-developer-2 started (PID: 45232)

🤖 Launching test-writer-fixer (claude-sonnet)...
✓  Agent test-writer-fixer-3 started (PID: 45233)

🤖 Launching security-expert (claude-opus)...
✓  Agent security-expert-4 started (PID: 45234)

🤖 Launching devops-engineer (claude-sonnet)...
✓  Agent devops-engineer-5 started (PID: 45235)

ℹ  Monitoring 5 agents...

[14:31:05] Agent Status: ● ● ● ● ●
[14:31:10] Agent Status: ● ● ● ● ●
[14:32:15] Agent Status: ● ● ● ● ✓    (devops-engineer complete)
[14:35:22] Agent Status: ● ● ● ✓ ✓    (security-expert complete)
[14:42:18] Agent Status: ● ● ✓ ✓ ✓    (test-writer-fixer complete)
[14:55:33] Agent Status: ● ✓ ✓ ✓ ✓    (frontend-developer complete)
[15:02:47] Agent Status: ✓ ✓ ✓ ✓ ✓    (backend-architect complete)

✓  All agents completed successfully!
```

### Step 6: Integration Verification

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Integration Verification Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Requirements Checklist

✅ User authentication (email/password + Google OAuth)
✅ Project and task management with Kanban boards
✅ Time tracking per task
✅ Invoice generation from tracked time
✅ Client portal
✅ Stripe integration
✅ Dark mode
✅ Mobile responsive

## Integration Check

✅ API endpoints match frontend calls
✅ Database schema supports all features
✅ Auth flow works end-to-end
✅ Stripe webhooks properly configured

## Minor Issues Found

⚠️ Missing error boundary in Kanban component
⚠️ Client portal missing loading states

## Overall Status: NEEDS_FIXES (minor)
```

### Step 7: Automated Fix Cycle

```
⚠ PROJECT NEEDS ATTENTION

Would you like to run fix cycles? [Y/n]: Y

ℹ  Running fix cycle 1 of 3...

🤖 Dispatching fix agent for identified issues...

[Fixing: Error boundary in Kanban component]
[Fixing: Loading states in client portal]

✓  Changes applied

ℹ  Re-verifying integration...

## Overall Status: READY ✓

✓  Fix cycle 1 resolved all issues!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ PROJECT COMPLETED SUCCESSFULLY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Session ID: orch-20260118-143000-12345
Logs: ~/.orchestrator/logs/orch-20260118-143000-12345/
Total time: 32 minutes
Agents used: 5
Fix cycles: 1
```

### The Result: A Working TaskFlow

After 32 minutes (instead of 3+ hours with a single agent), I have:

```
taskflow/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           # OAuth, session management
│   │   │   ├── projects/       # Project CRUD
│   │   │   ├── tasks/          # Task management
│   │   │   ├── time-entries/   # Time tracking
│   │   │   ├── invoices/       # Invoice generation
│   │   │   └── stripe/         # Webhooks, subscription
│   │   ├── dashboard/          # Main dashboard
│   │   ├── projects/           # Project views
│   │   ├── portal/             # Client portal
│   │   └── settings/           # User settings
│   ├── components/
│   │   ├── KanbanBoard/        # Drag-and-drop board
│   │   ├── TimeTracker/        # Start/stop timer
│   │   ├── InvoiceBuilder/     # Invoice generation
│   │   └── ThemeToggle/        # Dark mode
│   └── lib/
│       ├── prisma.ts           # Database client
│       ├── auth.ts             # Auth utilities
│       └── stripe.ts           # Stripe client
├── prisma/
│   └── schema.prisma           # Full database schema
├── tests/
│   ├── unit/                   # Unit tests
│   ├── integration/            # API tests
│   └── e2e/                    # End-to-end tests
├── docker-compose.yml          # Dev environment
├── .github/workflows/          # CI/CD pipeline
└── README.md                   # Documentation
```

All components work together because they were built with shared context and verified for integration.

## Phase 2: Marketing After the Build

Here's something I intentionally designed: **marketing agents are NOT included in the build phase.**

Why? Because:

1. Marketing needs a finished product to describe
2. Marketing content consumes context better spent on code
3. Marketing is a separate workflow, not part of coding orchestration

After the build completes, I switch to marketing mode:

```bash
# Option 1: Direct routing for specific marketing tasks
$ route content
► Create landing page copy for TaskFlow, a task management SaaS for
  freelancers. Focus on time savings and invoicing automation.

# Option 2: Use Claude with marketing agents
$ claude
> Use content-creator
Create a launch email sequence (5 emails) for TaskFlow targeting
freelancers who struggle with project organization.

> Use seo-specialist
Research keywords for "freelance project management" and create a
content calendar.

> Use social-media-manager
Create a Twitter/LinkedIn launch campaign with 10 posts.
```

This two-phase approach keeps the build focused and gives marketing agents a completed product to work with.

## What I Learned: The Meta-Lessons

### 1. Coordination > Raw Power

Having 5 mediocre agents that coordinate well beats 1 powerful agent that tries to do everything. The orchestration layer is where the real value is created.

### 2. Bash is Underrated for AI Workflows

When you need deterministic coordination, state management, and process control, bash beats AI agents every time. Let AI do what it's good at (reasoning, generation) and let scripts do what they're good at (orchestration).

### 3. Independent Context is a Feature

At first, I worried that agents couldn't see each other's conversations. Then I realized: they don't need to. Just like human teams, they coordinate through shared artifacts (the codebase) and clear contracts (the original prompt).

### 4. Verification is Non-Negotiable

Without the integration verification step, you'll have beautifully written components that don't work together. The extra 2 minutes for verification saves hours of debugging.

### 5. Bounded Failures are Acceptable

The system doesn't pretend to be perfect. If 3 fix cycles can't resolve issues, it stops and asks for human help with specific details about what's wrong. This honesty is more valuable than false confidence.

## What's Next?

The current system handles the coding phase beautifully. Here's what I'm building next:

1. **Phase 2 Marketing Workflow**: Automated marketing launch after code completion
2. **Dependency Detection**: Smarter sequencing when agents depend on each other's output
3. **Learning from History**: Using past sessions to improve agent task assignments
4. **Cost Tracking**: Monitor API spend per agent and optimize for budget
5. **Human Checkpoints**: Pause points where humans can review before continuing

## Try It Yourself

The complete system is in the repository:

```bash
# Clone the repo
git clone https://github.com/your-username/agent-container.git
cd agent-container

# Set up API keys
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY and OPENAI_API_KEY

# Deploy to Hetzner (or run locally)
HETZNER_IP=your-server-ip ./scripts/deploy.sh

# SSH in and orchestrate
ssh ai-dev
orchestrate "Build your amazing project idea here"
```

The `orchestrate` and `route` commands are in `/scripts/`. The agent definitions are in `/claude-agents/`. The documentation is comprehensive.

## Final Thoughts

When I started this project, I was frustrated with the limitations of single AI assistants. They're brilliant at focused tasks but fall apart on complex projects.

The solution wasn't to wait for more powerful AI—it was to orchestrate existing AI into teams. Each agent is a specialist. The orchestrator is the project manager. Together, they deliver what no single agent could.

The future of AI development isn't one superintelligent agent doing everything. It's **AI teamwork**—specialized agents coordinated by smart orchestration. And with the tools in this repo, you can have that future today.

Happy building! 🚀
