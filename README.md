# Vault Dashboard

StreetVault internal inventory and profit tracker.

## Setup

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local with your values
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VAULT_PASSWORD` | Login password |
| `JWT_SECRET` | Secret for JWT session tokens |
| `EXCHANGERATE_API_KEY` | Optional API key for exchangerate-api.com |

## Deploy (Render)

Uses persistent disk at `/data/vault.db` in production. See `render.yaml`.
