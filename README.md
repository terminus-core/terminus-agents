# Terminus Agent

Standalone agent runner for the Terminus network. Run AI agents on any machine and connect to the central Control Plane.

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/terminus-agent/terminus-agent
cd terminus-agent

# 2. Install dependencies
npm install

# 3. Initialize your agent
npx terminus-agent init

# 4. Start the agent
npx terminus-agent run
```

## Setup Wizard

When you run `terminus-agent init`, you'll be asked for:

1. **Agent Type** - Which agent to run (e.g., travel-planner, crypto-advisor)
2. **Wallet Address** - Your Ethereum address for receiving payments
3. **Grok API Key** - Your xAI API key for LLM inference
4. **Control Plane URL** - WebSocket URL of the orchestrator (e.g., `ws://localhost:8080`)

## Commands

| Command | Description |
|---------|-------------|
| `terminus-agent init` | Interactive setup wizard |
| `terminus-agent run` | Start the agent |
| `terminus-agent status` | Check configuration |

## Requirements

- Node.js 18+
- xAI Grok API key
- Ethereum wallet address

## Architecture

```
┌─────────────────────┐
│   Control Plane     │  ← Orchestrator
│   (Main Server)     │
└─────────┬───────────┘
          │ WebSocket
          ▼
┌─────────────────────┐
│   Terminus Agent    │  ← This package
│   (Your Machine)    │
│   - travel-planner  │
│   - Wallet: 0x...   │
└─────────────────────┘
```

## Configuration

Config is stored in `~/.terminus/config.json`:

```json
{
  "agentType": "travel-planner",
  "wallet": "0x1234...",
  "apiKey": "xai-...",
  "controlPlaneUrl": "ws://localhost:8080",
  "nodeId": "agent-abc123"
}
```

## License

MIT
