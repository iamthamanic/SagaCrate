#!/bin/bash

# ===========================================
# SagaTree Self-Host Setup Script
# Default: core stack (slim VPS / cloud LLM)
# Optional profiles: ai-local | graph | dev-tools | full
# See docs/ops/compose-profiles.md
# ===========================================

set -e

COMPOSE=(docker compose)
if ! docker compose version &>/dev/null; then
  if command -v docker-compose &>/dev/null; then
    COMPOSE=(docker-compose)
  fi
fi

echo "🚀 SagaTree Self-Host Setup"
echo "=============================="

# Check prerequisites
echo ""
echo "📦 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "   Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed!"
    echo "   Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker: $(docker --version)"
echo "✅ Docker Compose: $(docker-compose --version 2>/dev/null || docker compose version)"

# Generate secrets
echo ""
echo "🔐 Generating secrets..."

# Mint HS256 Supabase-style JWTs (Kong key-auth + PostgREST expect role claims).
mint_supabase_jwt() {
    local role="$1"
    local secret="$2"
    if ! command -v node &>/dev/null; then
        echo "❌ node is required to mint SUPABASE_ANON_KEY / SERVICE_ROLE JWTs" >&2
        exit 1
    fi
    node -e '
const crypto = require("crypto");
const role = process.argv[1];
const secret = process.argv[2];
const b64url = (value) =>
  Buffer.from(typeof value === "string" ? value : JSON.stringify(value)).toString("base64url");
const header = b64url({ alg: "HS256", typ: "JWT" });
const now = Math.floor(Date.now() / 1000);
const payload = b64url({
  role,
  iss: "supabase",
  iat: now,
  exp: now + 10 * 365 * 24 * 3600,
});
const sig = crypto.createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
process.stdout.write(`${header}.${payload}.${sig}`);
' "$role" "$secret"
}

if [ ! -f .env ]; then
    # Generate JWT Secret (32 bytes hex)
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Generate POSTGRES Password (32 bytes hex)
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    
    # Signed anon / service_role JWTs (not raw base64)
    ANON_KEY=$(mint_supabase_jwt anon "$JWT_SECRET")
    SERVICE_ROLE_KEY=$(mint_supabase_jwt service_role "$JWT_SECRET")
    
    # Generate Neo4j Password (only used with --profile graph|full)
    NEO4J_PASSWORD=$(openssl rand -hex 16)

    # openssl base64 wraps at 64 cols — strip newlines for a valid dotenv value
    SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -d '\n\r')
    DB_ENC_KEY=$(openssl rand -hex 8)
    
    cat > .env << EOF
# ===========================================
# SagaTree Self-Host Configuration
# GENERATED - Keep this file secure!
# Core: docker compose up -d
# Profiles: docs/ops/compose-profiles.md
# ===========================================

# JWT Secret (for auth tokens)
JWT_SECRET=${JWT_SECRET}
API_JWT_SECRET=${JWT_SECRET}

# PostgreSQL Password
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}

# Realtime (#604)
SECRET_KEY_BASE=${SECRET_KEY_BASE}
DB_ENC_KEY=${DB_ENC_KEY}
FLY_APP_NAME=sagatree
FLY_REGION=us-east-1
REALTIME_SEED_SELF_HOST=true
REALTIME_SELF_HOST_TENANT=localhost

# Supabase Keys
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=${ANON_KEY}

# Site URL
SITE_URL=http://localhost:3004
ADDITIONAL_REDIRECT_URLS=http://localhost:3004/auth/callback

# Email (optional)
MAILER_AUTOCONFIRM=true
DISABLE_SIGNUP=false

# Neo4j Password (profile graph|full)
NEO4J_PASSWORD=${NEO4J_PASSWORD}

# AI — prefer cloud on small VPS (do not enable ai-local)
# CHARACTER_AI_PROVIDER=openai-compatible
# CHARACTER_AI_BASE_URL=https://your-provider.example/v1
# CHARACTER_AI_API_KEY=
# CHARACTER_AI_MODEL=your-model
CHARACTER_AI_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
CHARACTER_AI_ALLOWED_ORIGIN=http://localhost:3004
EOF
    
    echo "✅ Generated .env file with secrets"
else
    echo "✅ Using existing .env file"
fi

echo ""
echo "🦙 LLM"
echo "------"
echo "Default stack has NO local Ollama (good for ~8 GB VPS)."
echo "Point CHARACTER_AI_* at a cloud/remote API in .env, or later:"
echo "  docker compose --profile ai-local up -d"
echo "  docker exec -it sagatree-ollama ollama pull llama3.2"
echo ""

# Start services
echo ""
echo "🐳 Starting Docker services (core profile)..."
echo ""

# Check if we should start
read -p "Start core services now? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    "${COMPOSE[@]}" up -d
    
    echo ""
    echo "⏳ Waiting for services to start..."
    sleep 10
    
    # Check services
    echo ""
    echo "🔍 Checking service health..."
    
    # PostgreSQL
    if docker exec sagatree-db pg_isready -U postgres &>/dev/null; then
        echo "✅ PostgreSQL: Running"
    else
        echo "⏳ PostgreSQL: Starting..."
    fi
    
    # Kong
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/auth/v1/health 2>/dev/null | grep -qE '200|401|404'; then
        echo "✅ Kong gateway: Reachable"
    else
        echo "⏳ Kong gateway: Starting..."
    fi
    
    # Redis
    if docker exec sagatree-redis redis-cli ping &>/dev/null; then
        echo "✅ Redis: Running"
    else
        echo "⏳ Redis: Starting..."
    fi

    if docker ps --format '{{.Names}}' | grep -q '^sagatree-neo4j$'; then
        if curl -s http://127.0.0.1:7474 &>/dev/null; then
            echo "✅ Neo4j: Running"
        else
            echo "⏳ Neo4j: Starting..."
        fi
    else
        echo "⏭ Neo4j: skipped (use --profile graph)"
    fi

    if docker ps --format '{{.Names}}' | grep -q '^sagatree-ollama$'; then
        if curl -s http://127.0.0.1:11434/api/tags &>/dev/null; then
            echo "✅ Ollama: Running"
        else
            echo "⏳ Ollama: Starting..."
        fi
    else
        echo "⏭ Ollama: skipped (use --profile ai-local or cloud LLM)"
    fi
    
    echo ""
    echo "🎉 Setup complete!"
    echo ""
    echo "📱 Access Points (core):"
    echo "   API Gateway:   http://localhost:8000"
    echo "   Functions:     via Kong /functions/v1 (loopback :9998)"
    echo "   PostgreSQL:    127.0.0.1:5432"
    echo "   Redis:         127.0.0.1:6379"
    echo ""
    echo "📚 Next Steps:"
    echo "   1. Apply migrations: ./scripts/apply-migrations.sh"
    echo "   2. Configure cloud LLM in .env (CHARACTER_AI_*) if needed"
    echo "   3. Optional profiles:"
    echo "        docker compose --profile graph up -d"
    echo "        docker compose --profile dev-tools up -d"
    echo "        docker compose --profile ai-local up -d"
    echo "        docker compose --profile full up -d"
    echo "   4. Docs: docs/ops/compose-profiles.md"
    echo ""
else
    echo ""
    echo "To start services manually:"
    echo "  docker compose up -d"
    echo "  ./scripts/apply-migrations.sh"
    echo ""
fi

echo "✅ Setup script completed"
