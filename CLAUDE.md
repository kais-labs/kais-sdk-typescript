# kais-sdk-typescript

TypeScript SDK for the kAIs platform. Provides two client interfaces for interacting with kAIs services.

## Project Setup

- TypeScript 5.5, target ES2022, CommonJS output
- Dependency: `nats ^2.28`
- Test runner: vitest
- Build: `tsc`

## Clients

- **KaisClient** -- NATS-based messaging client
- **KaisHTTP** -- REST API client using native fetch

## Resource Services

Both clients expose the same resource services:
- Cells
- Formations
- Rules
- Files
- Completions

## Environment Variables

| Variable | Description |
|---|---|
| `KAIS_NATS_URL` | NATS server connection URL |
| `KAIS_NAMESPACE` | Target namespace |
| `KAIS_APP_NAME` | Application identifier |
| `KAIS_API_URL` | REST API base URL (KaisHTTP) |
| `KAIS_API_KEY` | API authentication key (KaisHTTP) |

Note: this SDK uses `KAIS_NATS_URL` (not `NATS_URL` like the Go and Python SDKs).

## Build and Test

```sh
npm install
npm run build    # runs tsc
npm test         # runs vitest
```

## Code Style

- Strict TypeScript, no `any` where avoidable
- Exported types for all public interfaces
- Async/await for all I/O operations
