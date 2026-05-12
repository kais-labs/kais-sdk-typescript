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

## Code Quality & Best Practices

This SDK follows the **Google TypeScript Style Guide**
(https://google.github.io/styleguide/tsguide.html). The rules below are
project-specific overlays; where this file is silent, defer to the Google
guide. Reviewers may cite either Google guide sections or these overlays.

### TypeScript Standards (MANDATORY)

- **Strict TypeScript** — `strict: true` in tsconfig, zero `// @ts-ignore` without justification
- **No `any`** — use `unknown` + type narrowing. Every `any` is a potential runtime error
- **No type assertions** (`as Foo`) unless provably safe — prefer type guards
- **Explicit return types** on all exported functions
- Run `tsc --noEmit` before every commit — zero type errors

### Error Handling

- **Never empty `catch` blocks** — `catch (e) { /* ignore */ }` is forbidden
- Wrap errors with context: `throw new KaisError(\`create cell: ${e.message}\`, { cause: e })`
- Use typed error classes: `KaisError` → `KaisConnectionError`, `KaisTimeoutError`
- Always use `{ cause: e }` when re-throwing to preserve the stack chain
- **`finally`** for cleanup (connections, resources)

### Async Patterns

- **Async/await for all I/O** — no raw Promise chains or callbacks
- **Timeouts on all network calls** — `AbortSignal.timeout(ms)` — no unbounded waits
- Proper cleanup: use `try/finally` or `using` (TC39 explicit resource management)
- Handle promise rejections — no unhandled rejections in any code path

### API Design

- Exported types for all public interfaces — consumers should never need to infer
- Use discriminated unions for variant types: `type Result = { ok: true; data: T } | { ok: false; error: string }`
- Prefer `interface` for public contracts, `type` for unions and computed types
- Method signatures stable — breaking changes require major version bump
- Use `readonly` on properties that shouldn't be mutated after construction

### Naming & Style

- `camelCase` for functions and variables; `PascalCase` for classes, interfaces, types
- `UPPER_SNAKE_CASE` for constants
- No Hungarian notation — `cells`, not `cellsArray`
- File names: `kebab-case.ts`

### Testing

- **Vitest** for all tests
- Test files co-located: `client.ts` → `client.test.ts`
- Mock at boundaries — mock `fetch`, `nats` transport, not internal functions
- Test the public API surface — don't test private implementation details
- Use `describe`/`it` blocks with clear test names: `it("throws when NATS connection fails")`

### Dependencies & Security

- Minimal dependencies: `nats` — no more without strong justification
- No hardcoded URLs or credentials — everything via environment variables
- Validate all server responses before returning to caller
- Use `crypto.randomUUID()` for IDs, `crypto.getRandomValues()` for security randomness
