# SagaTree Self-Host

**Self-hosted TTRPG platform with Supabase, Edge Functions, and AI Game Master.**

## 🎯 Features

- ✅ **Supabase Self-Host** - Auth, Database, Storage, Realtime
- ✅ **Edge Functions** - Deno runtime, managed via Studio
- ✅ **AI Game Master** - Ollama-powered LLM integration
- ✅ **Lorekeeper** - Neo4j knowledge graph for NPCs/worlds
- ✅ **DM Tools** - Dice, combat, rulesets
- ✅ **Session Management** - Real-time sync

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Docker Stack                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Frontend   │  │    Studio    │  │   Edge RT    │          │
│  │   :3000      │  │    :3000     │  │    :9998     │          │
│  │   (Vite)     │  │  (Dashboard) │  │  (Functions) │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Supabase Core                         │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │  │
│  │  │  Auth   │ │  DB     │ │ Storage │ │Realtime│         │  │
│  │  │ (GoTrue)│ │(Postgres)│ │  (S3)  │ │(WS)    │         │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Ollama    │  │   Neo4j     │  │   Redis     │            │
│  │   :11434    │  │   :7474     │  │   :6379     │            │
│  │   (LLM)     │  │  (Graph)    │  │  (Cache)    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- **Core (default):** ~8 GB RAM / 40+ GB disk (e.g. Hostinger KVM 2) + cloud/remote LLM
- **Full stack + local Ollama:** 16 GB+ RAM recommended

### Setup

```bash
# Clone repository
git clone https://github.com/iamthamanic/sagatree-selfhost.git
cd sagatree-selfhost

# Run setup script
chmod +x setup.sh
./setup.sh

# Or manually:
cp .env.example .env
# Edit .env with your secrets
# Core only (Postgres, Auth, Rest, Realtime, Storage, Kong, Edge, Redis):
docker compose up -d
./scripts/apply-migrations.sh
```

Compose profiles (optional extras — see [`docs/ops/compose-profiles.md`](docs/ops/compose-profiles.md)):

```bash
docker compose --profile graph up -d          # + Neo4j
docker compose --profile dev-tools up -d      # + Studio
docker compose --profile ai-local up -d       # + local Ollama
docker compose --profile full up -d           # everything
```

### LLM (cloud preferred on small VPS)

Set cloud/remote credentials in `.env` (`CHARACTER_AI_PROVIDER=openai-compatible` + `CHARACTER_AI_BASE_URL` / `CHARACTER_AI_API_KEY`). Do **not** enable `ai-local`.

Local Ollama only when you have RAM/GPU:

```bash
docker compose --profile ai-local up -d
docker exec -it sagatree-ollama ollama pull llama3.2
# or: docker exec -it sagatree-ollama ollama pull llama3.1:8b
```

## 📱 Access Points

| Service | URL | Description |
|---------|-----|-------------|
| **API Gateway** | http://localhost:8000 | Kong API Gateway |
| **Functions** | http://127.0.0.1:9998 | Edge (prefer Kong `/functions/v1`) |
| **PostgreSQL** | 127.0.0.1:5432 | Database |
| **Redis** | 127.0.0.1:6379 | Session Cache |
| **Studio** | http://127.0.0.1:3000 | Dashboard (`--profile dev-tools`) |
| **Neo4j Browser** | http://127.0.0.1:7474 | Graph (`--profile graph`) |
| **Ollama** | http://127.0.0.1:11434 | Local LLM (`--profile ai-local`) |

## 🔧 Edge Functions

### Available Functions

| Function | Endpoint | Description |
|----------|----------|-------------|
| **ai-gm** | `/functions/v1/ai-gm` | AI Game Master narrative generation |
| **lorekeeper** | `/functions/v1/lorekeeper` | Knowledge graph operations |
| **dm-tools** | `/functions/v1/dm-tools` | Dice, combat, rulesets |
| **sessions** | `/functions/v1/sessions` | Session management |

### Using Functions

```bash
# Roll dice
curl -X POST http://localhost:9998/functions/v1/dm-tools/dice \
  -H "Content-Type: application/json" \
  -d '{"notation": "d20", "modifier": 5}'

# AI Game Master
curl -X POST http://localhost:9998/functions/v1/ai-gm \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "test-session",
    "action": "I explore the dark cave",
    "context": {
      "characters": [{"name": "Aragorn", "race": "Human", "class": "Ranger", "level": 5}],
      "location": "Dark Cave"
    }
  }'

# Create World Graph
curl -X POST http://localhost:9998/functions/v1/lorekeeper/graph \
  -H "Content-Type: application/json" \
  -d '{"projectId": "my-campaign", "name": "Forgotten Realms"}'
```

## 🗂️ Directory Structure

```
sagatree-selfhost/
├── docker-compose.yml          # Main compose file
├── .env                        # Environment variables
├── setup.sh                    # Setup script
├── README.md                   # This file
└── supabase/
    ├── config/
    │   ├── kong.yml           # Kong API Gateway config
    │   ├── import_map.json    # Deno import map
    │   └── nginx-proxy.template
    ├── functions/
    │   ├── ai-gm/
    │   │   └── index.ts        # AI Game Master function
    │   ├── lorekeeper/
    │   │   └── index.ts        # Knowledge Graph function
    │   ├── dm-tools/
    │   │   └── index.ts        # DM Tools function
    │   └── sessions/
    │       └── index.ts        # Session Management function
    └── migrations/        # Apply via ./scripts/apply-migrations.sh (not initdb mount)
```

## 🗃️ Database Schema

### Core Tables

- `projects` - Campaigns/Worlds
- `characters` - Player characters
- `sessions` - Game sessions
- `session_players` - Active players
- `npc_memories` - NPC knowledge (Lorekeeper)
- `combat_states` - Combat tracking (DM Tools)
- `world_graphs` - Neo4j references
- `chat_messages` - Real-time chat

### Row Level Security

All tables have RLS policies for:
- Players can only see their own data
- GMs can manage their projects
- Session-based access control

## 🎮 Frontend Integration

### Connect from SagaTree

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://localhost:8000'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Use functions
const { data, error } = await supabase.functions.invoke('ai-gm', {
  body: {
    sessionId: 'my-session',
    action: 'I attack the goblin',
    context: { ... }
  }
})
```

## 🔐 Security

### Default Credentials

Change these in `.env`:

- `JWT_SECRET` - Auth token secret
- `POSTGRES_PASSWORD` - Database password
- `SUPABASE_ANON_KEY` - Public API key
- `SUPABASE_SERVICE_ROLE_KEY` - Admin API key
- `NEO4J_PASSWORD` - Knowledge graph password

### Production Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS
- [ ] Configure email (SMTP)
- [ ] Set up backups
- [ ] Configure firewall
- [ ] Enable monitoring

## 📚 Documentation

- [Supabase Self-Host](https://supabase.com/docs/guides/self-hosting)
- [Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Runtime](https://deno.land/manual)
- [Ollama API](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Neo4j Cypher](https://neo4j.com/docs/cypher-manual/)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

Platform software is **AGPL-3.0-only** ([LICENSE](LICENSE)). Written SagaTree Core rules use the **ORC License**; future standalone SDKs are intended for **Apache-2.0**. Details and exclusions: [LICENSES.md](LICENSES.md).

---

Built with ❤️ for the TTRPG community.