# Age of AI

RTS multiplayer — monorepo escalável.

## Arquitetura

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Apps

| App | Porta | Comando |
|-----|-------|---------|
| web (landing) | 8080 | `pnpm dev:web` |
| panel (jogador) | 8081 | `pnpm dev:panel` |
| api | 3001 | `pnpm dev:api` |
| game-server | 3002 | `pnpm dev:game` |

## Arranque

```bash
pnpm install
pnpm dev
```

Infra local (Mongo + Redis):

```bash
docker compose up -d
```

## Estrutura

```
apps/api
apps/game-server   # duplicável (vários nós)
apps/web
apps/panel
apps/store         # placeholder
packages/shared
docs/ARCHITECTURE.md
infra/
```
