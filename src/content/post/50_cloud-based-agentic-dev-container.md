---
title: '#50 Cloud-Based Agentic Dev Container: Claude Code, Codex, and OpenCode in One'
description: 'A comprehensive guide to building a cloud-based AI development environment using Docker, Hetzner Cloud.'
publishDate: '18 January 2026'
updatedDate: '18 January 2026'
# coverImage:
#     src: ''
#     alt: ''
tags: ['Docker', 'AI Agents', 'Hetzner']
---

## Building a Cloud-Based AI Development Environment: Claude Code, Codex, and OpenCode in a Single Docker Container

## The Problem: Too Many Tools, Too Little Integration

As a developer working with AI coding assistants in 2026, I found myself juggling multiple tools across different terminals, each with their own configuration, environment requirements, and quirks. Claude Code from Anthropic, OpenAI's Codex CLI, and the open-source OpenCode—all powerful tools, but managing them separately was becoming a productivity drain.

Then came the mobility problem: I wanted to code from my MacBook at the office, my iPad with Termius while traveling, and occasionally from my phone when inspiration struck. But each AI tool had local configurations, different API keys scattered across machines, and no consistent environment.

I needed a solution that was:

-   **Portable**: Access the same environment from any device
-   **Persistent**: Keep my configurations, history, and projects intact
-   **Isolated**: Don't pollute my local machine with conflicting dependencies
-   **Remote-ready**: Run on a cloud server for always-on access

The answer? A Docker container running on Hetzner Cloud, accessible via SSH from anywhere.

## The Solution: A Unified AI Development Container

Here's what I built: a single Docker container that bundles Claude Code, OpenAI Codex CLI, and OpenCode, running on a remote server with persistent storage for configs and projects. The entire environment can be deployed with a single command and accessed from any device.

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│          Your Devices                       │
│  ┌──────┐  ┌──────┐  ┌──────┐              │
│  │ Mac  │  │ iPad │  │Phone │              │
│  └──┬───┘  └──┬───┘  └──┬───┘              │
│     └─────────┼─────────┘                   │
│               │ SSH (port 2222)             │
└───────────────┼─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│      Hetzner Cloud Server                   │
│  ┌───────────────────────────────────────┐  │
│  │  Docker Container                     │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  AI Tools                       │  │  │
│  │  │  • Claude Code (@anthropic)     │  │  │
│  │  │  • Codex (@openai/codex)        │  │  │
│  │  │  • OpenCode (opencode-ai)       │  │  │
│  │  └─────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────┐  │  │
│  │  │  Persistent Volumes             │  │  │
│  │  │  • /workspace (projects)        │  │  │
│  │  │  • ~/.claude (config)           │  │  │
│  │  │  • ~/.codex (config)            │  │  │
│  │  │  • ~/.zsh_history               │  │  │
│  │  └─────────────────────────────────┘  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

## Part 1: Building the Docker Container

### Base Image and Development Tools

I started with Ubuntu 24.04 as the base image and added all the essential development tools. The container needed to support multiple languages since AI assistants work with polyglot codebases:

```dockerfile
FROM ubuntu:24.04

# Prevent interactive prompts during installation
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    zsh \
    tmux \
    htop \
    build-essential \
    python3 \
    python3-pip \
    python3-venv \
    openssh-server \
    ca-certificates \
    gnupg \
    && rm -rf /var/lib/apt/lists/*
```

The key tools here:

-   **zsh + oh-my-zsh**: Modern shell with better autocomplete and history
-   **tmux**: Terminal multiplexing for managing multiple sessions
-   **openssh-server**: Critical for remote access
-   **Build tools**: gcc, make, etc. for compiling dependencies

### Installing Node.js, Go, and Rust

AI coding assistants often work with multiple languages, so I included the major ecosystems:

```dockerfile
# Node.js 20.x (for Claude Code and Codex)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

# Go 1.22
RUN wget https://go.dev/dl/go1.22.0.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.22.0.linux-amd64.tar.gz && \
    rm go1.22.0.linux-amd64.tar.gz

# Rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```

### The AI Tools Installation

Here's where it gets interesting. Each AI tool has its own quirks:

```dockerfile
# Claude Code (Anthropic's official CLI)
RUN npm install -g @anthropic-ai/claude-code

# OpenAI Codex CLI
RUN npm install -g @openai/codex

# OpenCode (open-source alternative)
RUN npm install -g opencode-ai
```

**Important detail**: I initially tried installing Python packages globally, but ran into a pyparsing version conflict. The solution was using `--ignore-installed` to bypass the system package:

```dockerfile
RUN pip3 install --break-system-packages --ignore-installed pyparsing opencode-ai
```

### SSH Server Configuration

This is critical for remote access. The container runs SSH on port 2222 (not 22, to avoid conflicts):

```dockerfile
# Configure SSH
RUN mkdir -p /var/run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin yes/' /etc/ssh/sshd_config && \
    sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Create .ssh directory with proper permissions
RUN mkdir -p /root/.ssh && chmod 700 /root/.ssh
```

Key security settings:

-   **Port 2222**: Separates container SSH from host SSH
-   **PubkeyAuthentication**: Only allow SSH key access, no passwords
-   **PermitRootLogin yes**: We're running as root inside the container (isolated environment)

### Shell Customization

I added oh-my-zsh for a better development experience:

```dockerfile
# Install oh-my-zsh
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Copy custom .zshrc with aliases
COPY .zshrc /root/.zshrc
```

The `.zshrc` includes helpful aliases:

```bash
# AI tool shortcuts
alias cc='claude'           # Quick access to Claude Code
alias ai='aider'            # Quick access to Aider

# Git shortcuts
alias gs='git status'
alias gp='git pull'
alias gc='git commit'
alias gd='git diff'

# Navigation
alias ll='ls -lah'
alias la='ls -A'
alias ..='cd ..'
alias ...='cd ../..'

# System
alias reload='source ~/.zshrc'
```

### The Entrypoint Script

The container startup needs special handling for SSH keys. Docker mounts files as read-only by default, but SSH requires `authorized_keys` to have 600 permissions owned by root. The solution is a two-step dance:

```bash
#!/bin/bash

# Copy authorized_keys from mounted location with correct permissions
if [ -f /tmp/authorized_keys ]; then
    cp /tmp/authorized_keys /root/.ssh/authorized_keys
    chmod 600 /root/.ssh/authorized_keys
    chown root:root /root/.ssh/authorized_keys
    echo "✓ SSH keys configured"
fi

# Start SSH server
/usr/sbin/sshd -D
```

We mount `authorized_keys` to `/tmp/` (read-only is fine), then copy it to `/root/.ssh/` with the right permissions. This happens on every container start.

## Part 2: Docker Compose Configuration

### Local Development Setup

For local development, I created a simple `docker-compose.yml`:

```yaml
version: '3.8'

services:
    ai-dev:
        build: .
        container_name: ai-dev-local
        ports:
            - '2222:2222' # SSH access
        volumes:
            - ./ssh_keys:/root/.ssh/git_keys:ro
            - ~/.ssh:/root/.ssh/host_keys:ro
            - ai-dev-workspace:/workspace
            - ai-dev-history:/root/.zsh_history
        environment:
            - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
            - OPENAI_API_KEY=${OPENAI_API_KEY}
        stdin_open: true
        tty: true

volumes:
    ai-dev-workspace:
    ai-dev-history:
```

**Volume strategy explained:**

1. **Git SSH keys** (`./ssh_keys`): Your GitHub/GitLab keys for the container to clone repos
2. **Host SSH keys** (`~/.ssh`): Read-only access to your local SSH config (optional)
3. **Workspace** (named volume): Persistent storage for projects
4. **History** (named volume): Persist command history across rebuilds

### Production Configuration for Hetzner

The production setup adds persistent volumes for AI tool configurations:

```yaml
version: '3.8'

services:
    ai-dev:
        build: .
        container_name: ai-dev-environment
        ports:
            - '2222:2222'
        volumes:
            # SSH authorization
            - ./authorized_keys:/tmp/authorized_keys:ro

            # Git SSH keys for cloning repos
            - ./ssh_keys:/root/.ssh/git_keys:ro

            # Persistent workspace and configs
            - ai-dev-workspace:/workspace
            - ai-dev-claude-config:/root/.claude
            - ai-dev-codex-config:/root/.codex
            - ai-dev-history:/root/.zsh_history

        environment:
            - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
            - OPENAI_API_KEY=${OPENAI_API_KEY}
        restart: unless-stopped
        stdin_open: true
        tty: true

volumes:
    ai-dev-workspace:
        driver: local
    ai-dev-claude-config:
        driver: local
    ai-dev-codex-config:
        driver: local
    ai-dev-history:
        driver: local
```

**Critical addition**: Persistent volumes for `~/.claude` and `~/.codex`. Without these, you'd lose your AI tool configurations (conversation history, preferences, cached models) on every rebuild.

### Environment Variables

Create a `.env` file (never commit this!):

```bash
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Get your keys from:

-   Anthropic: https://console.anthropic.com/
-   OpenAI: https://platform.openai.com/api-keys

## Part 3: SSH Key Management

This was the trickiest part. The setup uses **two different SSH keys**:

```
Your Mac ──(hetzner_ai_dev)──▶ Container ──(id_ed25519)──▶ GitHub
           SSH access                      git operations
```

### Key 1: Container Access Key

Generate a key for accessing the container:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/hetzner_ai_dev -C "hetzner-ai-dev"
```

Add the **public key** to `authorized_keys`:

```bash
cat ~/.ssh/hetzner_ai_dev.pub >> authorized_keys
```

### Key 2: GitHub Access Key

This key lives inside the container and authenticates git operations:

```bash
ssh-keygen -t ed25519 -f ssh_keys/id_ed25519 -C "your-email@example.com"
```

Add `ssh_keys/id_ed25519.pub` to your GitHub account.

### Multi-Device Access

To access from your phone (Termius):

1. In Termius: Create a new ED25519 key
2. Export the public key
3. Add it to `authorized_keys`:

```bash
echo "ssh-ed25519 AAAA...your-phone-key... phone-termius" >> authorized_keys
```

4. Redeploy the container

Now both your Mac and phone can SSH in using their respective private keys.

## Part 4: Deploying to Hetzner Cloud

### Initial Server Setup

First, create a server on Hetzner:

-   **Image**: Ubuntu 24.04
-   **Type**: CPX11 (2 vCPU, 2GB RAM) - $5/month is enough
-   **Location**: Choose closest to you
-   **SSH Key**: Upload your `hetzner_ai_dev.pub`

Once the server is running, install Docker and security tools:

```bash
#!/bin/bash
# scripts/hetzner-setup.sh

set -e

echo "🔧 Updating system..."
apt-get update && apt-get upgrade -y

echo "🐳 Installing Docker..."
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

echo "🐳 Installing Docker Compose..."
apt-get install -y docker-compose-plugin

echo "🔒 Setting up UFW firewall..."
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # Standard SSH
ufw allow 2222/tcp    # Container SSH
ufw allow 80/tcp      # HTTP (future use)
ufw allow 443/tcp     # HTTPS (future use)

echo "🛡️ Installing fail2ban..."
apt-get install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

echo "✅ Server setup complete!"
```

Run it once:

```bash
ssh -i ~/.ssh/hetzner_ai_dev root@YOUR_SERVER_IP 'bash -s' < scripts/hetzner-setup.sh
```

### The Deployment Script

I automated deployment with a single-command script:

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

# Color codes for pretty output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
HETZNER_IP="${HETZNER_IP}"
HETZNER_USER="${HETZNER_USER:-root}"
HETZNER_SSH_KEY="${HETZNER_SSH_KEY:-$HOME/.ssh/hetzner_ai_dev}"
REMOTE_DIR="${REMOTE_DIR:-/root/agent-container}"

# Validate inputs
if [ -z "$HETZNER_IP" ]; then
    echo -e "${RED}Error: HETZNER_IP not set${NC}"
    echo "Usage: HETZNER_IP=<ip> ./scripts/deploy.sh"
    exit 1
fi

if [ ! -f "$HETZNER_SSH_KEY" ]; then
    echo -e "${RED}Error: SSH key not found at $HETZNER_SSH_KEY${NC}"
    exit 1
fi

# Check for .env file
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Create one from .env.example and add your API keys"
    exit 1
fi

SSH_OPTS="-i $HETZNER_SSH_KEY -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null"

echo -e "${GREEN}=========================================="
echo "🚀 Deploying AI Dev Environment"
echo "=========================================="
echo "Server: $HETZNER_USER@$HETZNER_IP"
echo "SSH Key: $HETZNER_SSH_KEY"
echo "Remote Dir: $REMOTE_DIR"
echo -e "==========================================${NC}"

# Create remote directory
echo -e "${GREEN}📁 Creating remote directory...${NC}"
ssh ${SSH_OPTS} "${HETZNER_USER}@${HETZNER_IP}" "mkdir -p ${REMOTE_DIR}"

# Sync files
echo -e "${GREEN}📦 Syncing files...${NC}"
rsync -avz --progress \
    -e "ssh ${SSH_OPTS}" \
    --exclude '.git' \
    --exclude 'node_modules' \
    --exclude '.DS_Store' \
    ./ "${HETZNER_USER}@${HETZNER_IP}:${REMOTE_DIR}/"

# Set SSH key permissions
echo -e "${GREEN}🔧 Setting permissions...${NC}"
ssh ${SSH_OPTS} "${HETZNER_USER}@${HETZNER_IP}" "chmod 600 ${REMOTE_DIR}/ssh_keys/* 2>/dev/null || true"

# Check for --no-cache flag
BUILD_FLAGS="--build"
if [ "$1" == "--no-cache" ] || [ "$NO_CACHE" == "1" ]; then
    echo -e "${YELLOW}🔄 Building with --no-cache (full rebuild)...${NC}"
    BUILD_FLAGS="--build --no-cache"
fi

# Build and start container
echo -e "${GREEN}🐳 Building and starting container...${NC}"
ssh ${SSH_OPTS} "${HETZNER_USER}@${HETZNER_IP}" "cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml up -d ${BUILD_FLAGS}"

echo ""
echo -e "${GREEN}=============================================="
echo "✅ Deployment complete!"
echo "=============================================="
echo "Connect: ssh -i $HETZNER_SSH_KEY -p 2222 root@${HETZNER_IP}"
echo -e "==============================================\n${NC}"
```

Deploy with one command:

```bash
HETZNER_IP=123.45.67.89 ./scripts/deploy.sh
```

For a fresh build (no cache):

```bash
HETZNER_IP=123.45.67.89 ./scripts/deploy.sh --no-cache
# or
NO_CACHE=1 HETZNER_IP=123.45.67.89 ./scripts/deploy.sh
```

The script:

1. Validates that you have your `.env` file
2. Creates the remote directory
3. Syncs all files via rsync (excludes .git, node_modules)
4. Sets proper permissions on SSH keys
5. Builds and starts the Docker container
6. Shows connection command

## Part 5: SSH Configuration for Easy Access

Typing `ssh -i ~/.ssh/hetzner_ai_dev -p 2222 root@123.45.67.89` gets old fast. Create an SSH config:

```bash
# ~/.ssh/config

Host hetzner
    HostName 123.45.67.89
    User root
    IdentityFile ~/.ssh/hetzner_ai_dev
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

Host ai-dev
    HostName 123.45.67.89
    Port 2222
    User root
    IdentityFile ~/.ssh/hetzner_ai_dev
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

Host ai-dev-local
    HostName localhost
    Port 2222
    User root
    IdentityFile ~/.ssh/hetzner_ai_dev
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
```

Now you can simply:

```bash
ssh hetzner        # Connect to host server
ssh ai-dev         # Connect to remote container
ssh ai-dev-local   # Connect to local container
```

## Part 6: Daily Usage and Workflow

### Connecting and Starting Work

```bash
# Connect to the container
ssh ai-dev

# You'll land in /root - navigate to workspace
cd /workspace

# Clone a project (this is persistent!)
git clone git@github.com:your-username/your-project.git
cd your-project
```

**Important filesystem concept**: When you SSH in, you land in `/root` (the root user's home directory). Running `ls` shows what's in that directory:

```
/                    ← filesystem root
├── root/            ← where you land (home directory)
│   ├── .claude/     ← Claude config (persistent volume)
│   ├── .codex/      ← Codex config (persistent volume)
│   └── .zshrc       ← shell config
├── workspace/       ← YOUR PROJECTS GO HERE
├── home/
├── etc/
└── ...
```

To see all directories at the filesystem root:

```bash
ls /
```

### Using Claude Code

```bash
cd /workspace/your-project

# Start Claude Code
claude

# Or use the alias
cc
```

Claude Code will:

-   Read your codebase
-   Understand context across files
-   Make multi-file edits
-   Run tests and iterate
-   Commit changes

Example session:

```
You: Refactor the authentication module to use JWT tokens instead of sessions

Claude: I'll help refactor the authentication to use JWT. Let me first examine the current implementation...

[Claude reads auth.js, user.js, middleware/auth.js]

Claude: I've identified the changes needed. I'll:
1. Install jsonwebtoken package
2. Update the login endpoint to issue JWT tokens
3. Replace session middleware with JWT verification
4. Update user model to store refresh tokens

Shall I proceed?

You: Yes

[Claude makes the changes, runs tests, fixes issues, commits]

Claude: ✓ Refactoring complete. All 24 tests passing.
```

### Using OpenAI Codex

```bash
# Start Codex in your project
codex

# Natural language commands
> Create a React component for a user profile card
> Add TypeScript types for the API responses
> Write unit tests for the validator functions
```

### Using OpenCode

```bash
# Start OpenCode
opencode

# Or specific model
opencode --model gpt-4
```

### Listing Services and Processes

To see what's running inside the container:

```bash
# View all processes
ps aux

# Interactive process viewer
htop

# Check if AI tools are available
which claude codex opencode
```

From your Mac, check the container status:

```bash
# Check if container is running
ssh hetzner "docker ps"

# View container logs
ssh hetzner "docker logs ai-dev-environment"

# Check processes inside container
ssh ai-dev "ps aux"
```

### Working with Hidden Files

When listing files, use:

```bash
ls        # Regular files
ls -a     # Show hidden files (starting with .)
ls -la    # Detailed list with hidden files
ls -lah   # Human-readable sizes

# Common hidden files you'll see:
# .git       - Git repository
# .env       - Environment variables
# .gitignore - Git ignore rules
# .claude    - Claude configuration
```

## Part 7: Persistence and Data Management

### What Persists Across Rebuilds?

**Persistent (Docker volumes):**

-   `/workspace` - All your projects and code
-   `/root/.claude` - Claude Code configuration and history
-   `/root/.codex` - Codex configuration
-   `/root/.zsh_history` - Your command history

**Ephemeral (lost on rebuild):**

-   Files created in `/root` (except those above)
-   System packages installed with `apt-get` (unless added to Dockerfile)
-   Temporary files in `/tmp`

### Backing Up Your Work

The volumes live on the Hetzner server. To back up:

```bash
# From your Mac
ssh hetzner "docker run --rm -v ai-dev-workspace:/data -v /root/backups:/backup ubuntu tar czf /backup/workspace-$(date +%Y%m%d).tar.gz -C /data ."

# Download the backup
scp root@123.45.67.89:/root/backups/workspace-20260118.tar.gz ./
```

Or use git for your projects:

```bash
# Inside container
cd /workspace/your-project
git add .
git commit -m "Progress checkpoint"
git push
```

### Updating the Container

When you modify the Dockerfile or add new tools:

```bash
# Deploy with no-cache to rebuild everything
NO_CACHE=1 HETZNER_IP=123.45.67.89 ./scripts/deploy.sh
```

Your volumes (workspace, configs) remain intact!

## Part 8: Advanced Tips and Tricks

### 1. Using tmux for Multiple Sessions

tmux is pre-installed. Use it to run multiple AI tools simultaneously:

```bash
# Start tmux
tmux

# Create new pane: Ctrl+b then "
# Switch panes: Ctrl+b then arrow keys
# New window: Ctrl+b then c
# Switch windows: Ctrl+b then window number

# Example: Run Claude in one pane, Codex in another
# Pane 1: claude
# Pane 2 (Ctrl+b "): codex
```

### 2. Git Configuration

Set your git identity inside the container:

```bash
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
git config --global core.editor "vim"
```

Or mount a `.gitconfig` in the Dockerfile:

```dockerfile
COPY .gitconfig /root/.gitconfig
```

### 3. Custom Aliases

Add more aliases to `.zshrc`:

```bash
# Project shortcuts
alias work='cd /workspace'
alias proj='cd /workspace/my-main-project'

# Git workflows
alias gpo='git push origin'
alias gpl='git pull origin'
alias gco='git checkout'
alias gcb='git checkout -b'

# Docker (from host)
alias dps='docker ps'
alias dlogs='docker logs -f ai-dev-environment'
```

### 4. Monitoring Resource Usage

Inside the container:

```bash
# Memory usage
free -h

# Disk usage
df -h

# Top processes
htop
```

From the host:

```bash
ssh hetzner "docker stats ai-dev-environment"
```

### 5. Setting Resource Limits

If running multiple containers or large workloads, add to `docker-compose.prod.yml`:

```yaml
services:
    ai-dev:
        # ... other config ...
        deploy:
            resources:
                limits:
                    memory: 4G
                    cpus: '2'
                reservations:
                    memory: 2G
                    cpus: '1'
```

### 6. Automatic Workspace Switching

Add to `.zshrc` to always start in your workspace:

```bash
# Auto-navigate to workspace on login
if [[ $PWD == $HOME ]]; then
    cd /workspace
fi
```

### 7. Port Forwarding for Web Projects

If your AI tool generates a web app, forward the port:

```yaml
# docker-compose.prod.yml
services:
    ai-dev:
        ports:
            - '2222:2222'
            - '3000:3000' # React/Next.js
            - '8080:8080' # Common dev server
```

Then access at `http://123.45.67.89:3000`

### 8. Environment-Specific Configurations

Use different `.env` files for local vs production:

```bash
# Local
cp .env.local .env
docker compose up -d

# Production
cp .env.prod .env
HETZNER_IP=123.45.67.89 ./scripts/deploy.sh
```

## Part 9: Troubleshooting Common Issues

### Issue 1: "Permission denied (publickey)"

**Symptoms:** Can't SSH into container

**Causes:**

-   Wrong SSH key
-   `authorized_keys` has wrong permissions
-   Key not in `authorized_keys`

**Solutions:**

```bash
# Verify key is in authorized_keys
cat authorized_keys | grep "$(cat ~/.ssh/hetzner_ai_dev.pub)"

# Check from host server
ssh hetzner "docker exec ai-dev-environment cat /root/.ssh/authorized_keys"

# Check permissions
ssh hetzner "docker exec ai-dev-environment ls -la /root/.ssh/authorized_keys"
# Should show: -rw------- 1 root root (600 permissions)

# Force redeploy
HETZNER_IP=123.45.67.89 ./scripts/deploy.sh --no-cache
```

### Issue 2: API Keys Not Working

**Symptoms:** AI tools can't authenticate

**Solutions:**

```bash
# Check if env vars are set inside container
ssh ai-dev "echo \$ANTHROPIC_API_KEY"

# Verify .env file exists
ls -la .env

# Check for trailing spaces in .env
cat -A .env  # Should not show extra spaces

# Rebuild to reload env vars
HETZNER_IP=123.45.67.89 ./scripts/deploy.sh
```

### Issue 3: Container Won't Start

**Symptoms:** Container exits immediately

**Solutions:**

```bash
# Check logs
ssh hetzner "docker logs ai-dev-environment"

# Common issues:
# - Port 2222 already in use
# - Missing .env file
# - Syntax error in docker-compose.yml

# Verify compose file
docker compose -f docker-compose.prod.yml config

# Try running interactively
ssh hetzner "docker run -it --rm $(docker build -q .)"
```

### Issue 4: Lost Work After Rebuild

**Symptoms:** Files disappeared after rebuilding container

**Cause:** Files were stored outside `/workspace`

**Prevention:**

```bash
# ALWAYS work in /workspace
cd /workspace

# Check what's in volumes
ssh hetzner "docker volume ls"
ssh hetzner "docker volume inspect ai-dev-workspace"
```

### Issue 5: Slow Performance

**Symptoms:** AI tools running slowly

**Solutions:**

```bash
# Check system resources
ssh ai-dev "free -h && df -h"

# Check Docker stats
ssh hetzner "docker stats ai-dev-environment --no-stream"

# Upgrade Hetzner instance
# CPX11 (2GB RAM) → CPX21 (4GB RAM) → CPX31 (8GB RAM)

# Clean up Docker
ssh hetzner "docker system prune -a"
```

### Issue 6: Git Clone Fails

**Symptoms:** "Permission denied" when cloning private repos

**Cause:** Git SSH key not configured

**Solutions:**

```bash
# Verify git SSH key is mounted
ssh ai-dev "ls -la /root/.ssh/git_keys/"

# Test GitHub connection
ssh ai-dev "ssh -i /root/.ssh/git_keys/id_ed25519 -T git@github.com"

# Add GitHub key to ssh agent
ssh ai-dev
eval "$(ssh-agent -s)"
ssh-add /root/.ssh/git_keys/id_ed25519

# Or create ~/.ssh/config
cat > ~/.ssh/config << EOF
Host github.com
    IdentityFile /root/.ssh/git_keys/id_ed25519
    StrictHostKeyChecking no
EOF
```

## Part 10: Real-World Usage Examples

### Example 1: Building a Full-Stack App

```bash
# Connect to container
ssh ai-dev
cd /workspace

# Start Claude Code
claude

# Natural language prompt
You: Create a full-stack todo app with:
- Next.js 14 frontend
- Prisma + SQLite backend
- shadcn/ui components
- CRUD operations
- TypeScript throughout

[Claude creates the project structure, installs dependencies,
 generates components, sets up database, writes API routes]

# Test locally (if you forwarded port 3000)
cd todo-app
npm run dev

# Visit http://123.45.67.89:3000
```

### Example 2: Refactoring Legacy Code

```bash
# Clone existing project
cd /workspace
git clone git@github.com:company/legacy-app.git
cd legacy-app

# Start Codex
codex

You: Analyze this codebase and identify code smells

Codex: I've found:
- 15 functions over 100 lines
- Duplicate code in user auth (3 places)
- No error handling in API calls
- Missing TypeScript types

You: Refactor the authentication module

[Codex extracts auth logic, adds proper error handling,
 adds TypeScript types, writes tests]

# Commit changes
git checkout -b refactor/auth
git add .
git commit -m "Refactor: Extract and type auth module"
git push origin refactor/auth
```

### Example 3: Multi-AI Workflow

Use tmux to run multiple AI tools:

```bash
ssh ai-dev
tmux

# Pane 1: Claude for architecture
claude
You: Design a microservices architecture for an e-commerce platform

# Split pane (Ctrl+b ")
# Pane 2: Codex for implementation
codex
You: Implement the product service API

# Split pane again (Ctrl+b %)
# Pane 3: OpenCode for tests
opencode
You: Generate integration tests for the product service

# Switch between panes with Ctrl+b arrow keys
```

### Example 4: Documentation Generation

```bash
cd /workspace/my-library
claude

You: Generate comprehensive documentation for this library:
- README with examples
- API documentation
- Contributing guide
- JSDoc comments for all functions

[Claude analyzes code, generates docs, adds examples]

# Review and commit
git add .
git commit -m "docs: Add comprehensive documentation"
git push
```

## Part 11: Cost Analysis

### Infrastructure Costs

**Hetzner Cloud (CPX11):**

-   2 vCPUs, 2GB RAM, 40GB SSD
-   €4.51/month (~$5/month)
-   20TB traffic included

**Hetzner Cloud (CPX21 - recommended for heavy use):**

-   3 vCPUs, 4GB RAM, 80GB SSD
-   €8.21/month (~$9/month)

**Hetzner Cloud (CPX31 - for large projects):**

-   4 vCPUs, 8GB RAM, 160GB SSD
-   €15.40/month (~$17/month)

### API Costs

**Anthropic Claude Code:**

-   Sonnet: $3/M tokens (input), $15/M tokens (output)
-   Opus: $15/M tokens (input), $75/M tokens (output)
-   Typical session: $0.10 - $2.00

**OpenAI Codex:**

-   GPT-4: $0.03/1K tokens (input), $0.06/1K tokens (output)
-   GPT-3.5: $0.0015/1K tokens (input), $0.002/1K tokens (output)
-   Typical session: $0.05 - $1.00

**Total monthly estimate:**

-   Server: $9/month (CPX21)
-   AI usage (moderate): $50-100/month
-   **Total: ~$60-110/month**

Much cheaper than a GitHub Copilot subscription + separate AI tool subscriptions + local resource costs!

## Part 12: Security Considerations

### SSH Security

✅ **What we did:**

-   Key-based authentication only (no passwords)
-   Non-standard SSH port (2222)
-   fail2ban for brute-force protection
-   UFW firewall

❌ **Additional hardening (optional):**

```bash
# Disable root login (after creating non-root user)
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config

# Allow only specific IPs
ufw delete allow 2222
ufw allow from YOUR_HOME_IP to any port 2222
ufw allow from YOUR_OFFICE_IP to any port 2222
```

### API Key Security

✅ **What we did:**

-   `.env` file (gitignored)
-   Environment variables (not hardcoded)

❌ **Additional security:**

```bash
# Use Docker secrets (production)
docker secret create anthropic_key ./anthropic_key.txt
```

### Container Isolation

The container runs as root, but it's isolated from the host:

-   Separate network namespace
-   Separate filesystem
-   No privileged access to host

For even more isolation:

```yaml
# docker-compose.prod.yml
services:
    ai-dev:
        security_opt:
            - no-new-privileges:true
        cap_drop:
            - ALL
        cap_add:
            - NET_BIND_SERVICE
```

### Regular Updates

```bash
# Update container base image
# Edit Dockerfile: FROM ubuntu:24.04 -> ubuntu:24.10
NO_CACHE=1 HETZNER_IP=123.45.67.89 ./scripts/deploy.sh

# Update AI tools
# They're npm packages, so they update automatically when rebuilding
```

## Part 13: Future Enhancements

### Ideas to Extend This Setup

**1. Multiple Environments**

```yaml
# docker-compose.dev.yml
# docker-compose.staging.yml
# docker-compose.prod.yml
```

**2. Code Server (VS Code in Browser)**

Add to Dockerfile:

```dockerfile
RUN curl -fsSL https://code-server.dev/install.sh | sh
```

Access VS Code at `http://123.45.67.89:8080`

**3. Database Containers**

```yaml
# Add to docker-compose.prod.yml
services:
    ai-dev:
        # ... existing config ...

    postgres:
        image: postgres:16
        volumes:
            - postgres-data:/var/lib/postgresql/data
        environment:
            POSTGRES_PASSWORD: ${DB_PASSWORD}

volumes:
    postgres-data:
```

**4. Monitoring and Metrics**

```yaml
services:
    prometheus:
        image: prom/prometheus
        ports:
            - '9090:9090'

    grafana:
        image: grafana/grafana
        ports:
            - '3001:3000'
```

**5. Automated Backups**

```bash
# Add to crontab on Hetzner server
0 2 * * * docker run --rm -v ai-dev-workspace:/data -v /root/backups:/backup ubuntu tar czf /backup/workspace-$(date +\%Y\%m\%d).tar.gz -C /data .
```

**6. CI/CD Integration**

```yaml
# .github/workflows/deploy.yml
name: Deploy to Hetzner

on:
    push:
        branches: [main]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - name: Deploy
              env:
                  HETZNER_IP: ${{ secrets.HETZNER_IP }}
                  HETZNER_SSH_KEY: ${{ secrets.HETZNER_SSH_KEY }}
              run: ./scripts/deploy.sh
```

## Conclusion: The Power of Containerized AI Development

After several weeks using this setup, here's what I've gained:

**Productivity wins:**

-   🚀 Access my dev environment from any device
-   💾 Never lose configurations or project state
-   🔄 Consistent environment (no "works on my machine")
-   🤝 Easy collaboration (share SSH access)

**Cost savings:**

-   💰 $9/month server vs expensive local GPU
-   ⚡ Offload AI computation to cloud
-   📦 No local resource consumption

**Workflow improvements:**

-   🎯 All AI tools in one place
-   📱 Code from phone during commute
-   🌍 Same environment at office, home, travel
-   🔐 Secure, isolated, backed up

**The bottom line:** This setup transformed how I work with AI coding assistants. Instead of juggling tools across machines, I have a single, always-available, persistent environment that follows me everywhere.

The initial setup takes a few hours, but the daily workflow is seamless. One SSH command and you're in your fully-configured AI development environment, with all your projects, history, and tools exactly as you left them.

## Complete File Listing

For reference, here's the final project structure:

```
agent-container/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .env
├── .gitignore
├── .zshrc
├── .gitconfig
├── authorized_keys
├── ssh_config.example
├── README.md
├── HETZNER.md
├── blogpost.md (this file)
└── scripts/
    ├── deploy.sh
    ├── entrypoint.sh
    ├── hetzner-setup.sh
    └── start.sh
└── ssh_keys/
    ├── config
    ├── id_ed25519
    ├── id_ed25519.pub
    └── known_hosts
```

## Quick Start Command Summary

```bash
# One-time setup
git clone https://github.com/your-username/agent-container.git
cd agent-container
cp .env.example .env
# Edit .env with your API keys
ssh-keygen -t ed25519 -f ~/.ssh/hetzner_ai_dev
cat ~/.ssh/hetzner_ai_dev.pub >> authorized_keys

# Deploy to Hetzner (first time)
ssh -i ~/.ssh/hetzner_ai_dev root@YOUR_IP 'bash -s' < scripts/hetzner-setup.sh
HETZNER_IP=YOUR_IP ./scripts/deploy.sh

# Daily usage
ssh ai-dev
cd /workspace
claude  # or codex, or opencode

# Update deployment
HETZNER_IP=YOUR_IP ./scripts/deploy.sh

# Force rebuild
NO_CACHE=1 HETZNER_IP=YOUR_IP ./scripts/deploy.sh
```

# Conclusion

The dev container provides natural guardrails to keep your AI-assisted coding efficient, secure, and consistent. With everything set up, you can focus on building great software with the help of powerful AI tools, no matter where you are or what device you're using. Happy coding!
