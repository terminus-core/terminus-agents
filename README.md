# 🤖 Terminus Agent Node

Run AI agents on any machine and earn by processing requests from the Terminus Network.

---

## 📋 Prerequisites

Before starting, make sure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)
- **Ethereum Wallet** - Address + Private Key for payments

**LLM Provider (choose one):**
| Provider | Type | Cost | Link |
|----------|------|------|------|
| xAI Grok | Cloud API | Paid | [console.x.ai](https://console.x.ai) |
| Ollama | Local | Free | [ollama.com](https://ollama.com) |
| LM Studio | Local | Free | [lmstudio.ai](https://lmstudio.ai) |

---

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
git clone https://github.com/terminus-agent/terminus-agents.git
cd terminus-agents
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Build the Project

```bash
npm run build
```

### Step 4: Initialize Your Agent

```bash
npx terminus-agent init
```

This starts the interactive setup wizard (see below for details).

### Step 5: Start the Agent

```bash
npx terminus-agent run
```

Your agent is now connected and processing requests! 🎉

---

## 🧙 Setup Wizard Flow

When you run `npx terminus-agent init`, you'll go through these steps:

### 1️⃣ Select Agent Type

```
? Select agent type: (Use arrow keys)
❯ Travel Planner - AI travel planning assistant
  Budget Planner - Personal finance and budgeting advisor
  Health Advisor - Health and wellness guidance
  Crypto Advisor - Cryptocurrency market analysis
  ... (15 agents available)
```

### 2️⃣ Enter Wallet Address

```
? Enter your wallet address (for payments): 0x1234...
```
- Must be a valid Ethereum address (starts with `0x`, 42 characters)
- This is where your earnings will be sent

### 3️⃣ Enter Private Key (Optional)

```
? Enter wallet private key (for NFT verification): ****
```
- Used to prove wallet ownership
- Press Enter to skip if not required

### 4️⃣ Select LLM Provider

```
? Select LLM provider: (Use arrow keys)
❯ 🌐 Grok API (xAI Cloud)
  🦙 Ollama (Local LLM)
  🔧 OpenAI-Compatible (LM Studio, LocalAI, etc.)
```

**Based on your selection:**

#### If Grok API:
```
? Enter your Grok API key: xai-xxxxx...
```

#### If Ollama:
```
✅ Ollama detected with 3 models available

? Ollama server URL: (http://localhost:11434)
? Select/Enter model: (Use arrow keys)
❯ llama3
  mistral
  codellama
```

#### If OpenAI-Compatible:
```
? OpenAI-compatible server URL: (http://localhost:1234)
? Model name: (local-model)
? API key (if required, else press enter): 
```

### 5️⃣ Enter Control Plane URL

```
? Control Plane URL: ws://YOUR_AWS_IP:8081
```

Replace `YOUR_AWS_IP` with the production server IP.

### ✅ Setup Complete!

```
✅ Configuration saved!
   Location: /Users/you/.terminus/config.json
   Node ID: travel-planner-0x1234
   Agent: travel-planner
   LLM Provider: ollama
   Model: llama3

Run `terminus-agent run` to start.
```

---

## 🌐 Control Plane URL

### Production (AWS)
```
ws://YOUR_AWS_IP:8081
```
> ⚠️ **Replace `YOUR_AWS_IP`** with the actual server IP. Contact admin for the URL.

### Local Development
```
ws://localhost:8081
```

---

## 🧠 LLM Provider Setup

### Option 1: 🌐 Grok API (xAI Cloud)

Best for production - high quality responses.

1. Get API key from [console.x.ai](https://console.x.ai)
2. Select "Grok API" during init
3. Enter your key (starts with `xai-`)

### Option 2: 🦙 Ollama (Free, Local)

Run models locally - completely free!

**Install Ollama:**
```bash
# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows: Download from https://ollama.com/download
```

**Download a model:**
```bash
ollama pull llama3          # Fast, 8B params
ollama pull llama3:70b      # Better quality (48GB+ RAM)
ollama pull mistral         # Good balance
ollama pull codellama       # Code-focused
```

**Start Ollama:**
```bash
ollama serve
```

The setup wizard will auto-detect Ollama and list available models!

### Option 3: 🔧 LM Studio / LocalAI

**LM Studio:**
1. Download from [lmstudio.ai](https://lmstudio.ai)
2. Load a model in the app
3. Click "Start Server" (default: `http://localhost:1234`)

**LocalAI:**
```bash
docker run -p 8080:8080 localai/localai
```

---

## 📁 Available Agent Types (15)

| Agent ID | Name | Description |
|----------|------|-------------|
| `travel-planner` | Travel Planner | Trip planning, flights, hotels |
| `budget-planner` | Budget Planner | Personal finance, budgeting |
| `health-advisor` | Health Advisor | Health tips, diet plans |
| `fundamental-analyst` | Fundamental Analyst | Stock fundamentals, company analysis |
| `technical-analyst` | Technical Analyst | Chart patterns, trading signals |
| `crypto-advisor` | Crypto Advisor | Cryptocurrency market analysis |
| `food-expert` | Food Expert | Recipes, nutrition advice |
| `fitness-coach` | Fitness Coach | Workout plans, exercise guidance |
| `legal-advisor` | Legal Advisor | Basic legal guidance |
| `real-estate` | Real Estate | Property investment advice |
| `career-coach` | Career Coach | Career guidance, resume tips |
| `event-planner` | Event Planner | Event organization, party planning |
| `tech-support` | Tech Support | Technical troubleshooting |
| `shopping-assistant` | Shopping Assistant | Product recommendations |
| `language-tutor` | Language Tutor | Language learning assistance |

---

## 🔧 CLI Commands

| Command | Description |
|---------|-------------|
| `npx terminus-agent init` | Interactive setup wizard |
| `npx terminus-agent run` | Start agent and connect to Control Plane |
| `npx terminus-agent status` | Show current configuration |

---

## ⚙️ Configuration File

Config is stored at `~/.terminus/config.json`:

```json
{
  "agentType": "travel-planner",
  "wallet": "0x1234...abcd",
  "privateKey": "0x...",
  "apiKey": "xai-xxxxx",
  "controlPlaneUrl": "ws://YOUR_AWS_IP:8081",
  "nodeId": "travel-planner-0x1234",
  "llmProvider": "grok",
  "llmBaseUrl": null,
  "llmModel": null
}
```

**With Ollama:**
```json
{
  "agentType": "health-advisor",
  "wallet": "0x5678...efgh",
  "apiKey": "local-llm",
  "controlPlaneUrl": "ws://YOUR_AWS_IP:8081",
  "nodeId": "health-advisor-0x5678",
  "llmProvider": "ollama",
  "llmBaseUrl": "http://localhost:11434",
  "llmModel": "llama3"
}
```

**Reconfigure:**
```bash
rm ~/.terminus/config.json
npx terminus-agent init
```

---

## 🔄 Running as Background Service

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start agent
pm2 start "npx terminus-agent run" --name terminus-agent

# View logs
pm2 logs terminus-agent

# Stop agent
pm2 stop terminus-agent

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Using Screen (Linux/macOS)

```bash
# Start in screen
screen -S terminus
npx terminus-agent run

# Detach: Ctrl+A, then D
# Reattach later:
screen -r terminus
```

---

## 📊 Architecture

```
                    ┌─────────────────────────────────────┐
                    │       Terminus Control Plane        │
                    │     ws://YOUR_AWS_IP:8081           │
                    └─────────────────┬───────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          │                           │                           │
          ▼                           ▼                           ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   Agent Node    │       │   Agent Node    │       │   Agent Node    │
│   (Your PC)     │       │   (Server 2)    │       │   (Server 3)    │
│                 │       │                 │       │                 │
│ travel-planner  │       │  health-advisor │       │  crypto-advisor │
│ Ollama + llama3 │       │  Grok API       │       │  LM Studio      │
│ Wallet: 0x1234  │       │  Wallet: 0x5678 │       │  Wallet: 0x9abc │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## 💰 Earnings

- Each processed query earns **$0.09 USDC**
- Payments go to your configured wallet address
- Track earnings at [Dashboard](https://termn.xyz)

---

## 🐛 Troubleshooting

### "Connection refused" error
- Check Control Plane URL is correct
- Ensure server is running and accessible
- Verify firewall allows port 8081

### "Invalid API key" error
- Verify key at [console.x.ai](https://console.x.ai)
- Make sure key has remaining credits

### Ollama not detected
- Run `ollama serve` first
- Check Ollama is on port 11434: `curl http://localhost:11434`

### Agent not receiving requests
- Verify WebSocket connection is established
- Check agent type matches user queries
- Run `npx terminus-agent status`

---

## 📝 Logs

**Real-time logs:**
```bash
npx terminus-agent run
```

**Save to file:**
```bash
npx terminus-agent run 2>&1 | tee agent.log
```

---

## 🔐 Security

- **Never share your private keys**
- **Use a dedicated wallet** for agent operations
- Keep `~/.terminus/config.json` secure (contains private key)
- API keys are stored locally only

---

## 📞 Support

- **Website**: [termn.xyz](https://termn.xyz)
- **GitHub**: [Open an issue](https://github.com/terminus-agent/terminus-agents/issues)

---

## 📄 License

MIT
