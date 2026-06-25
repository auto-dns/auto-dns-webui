# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

## What this is

`auto-dns-webui` is a **read-only** web UI — plus an optional MCP server — for
browsing the DNS records that
[`docker-coredns-sync`](https://github.com/auto-dns/docker-coredns-sync) writes
into etcd in [SkyDNS/CoreDNS format](https://coredns.io/plugins/etcd/). It does
not create or mutate records; it reads what the upstream producer wrote.

The repo is two halves:

- **`backend/`** — a Go service (Cobra + Viper) that reads etcd and serves
  `GET /api/records`, serves the embedded React SPA, and optionally runs an MCP
  server.
- **`frontend/`** — a React + TypeScript + Vite SPA (SCSS modules) that renders
  the record list with client-side search/filter/sort.

For production the built frontend is embedded into the Go binary via `go:embed`.

## Build & Run

```bash
# Dev: Vite (:5173) + Go backend (:8080) with the backend reverse-proxying to Vite
make dev

# Build the Go backend in dev mode (no embedded frontend)
make build

# Full production build: build the frontend and embed it into the Go binary
make prod

# Run the production binary locally
make run-prod
```

The backend can be configured by env vars (`AUTO_DNS_WEBUI_*`), a `config.yaml`,
or CLI flags (precedence: flags → env → file → defaults). See the README for the
full configuration reference.

## Testing & quality

> Note: a test suite and the `make` targets below are being introduced as part of
> the foundations milestone (see the open issues). Until they land, run the
> underlying `go test` / `npm` commands directly.

```bash
make check         # lint + typecheck + test for backend and frontend (pre-PR gate)
make test          # go test ./... (backend) and frontend unit tests
make lint          # golangci-lint (backend) + eslint (frontend)
make format        # gofmt + goimports (backend) + prettier (frontend)
```

Docker/etcd should be exercised through mocks where possible — the etcd client is
already abstracted behind an `etcdClient` interface in
`backend/internal/registry/etcd_registry.go`, which makes the registry testable
without a live etcd. Manual integration cases live in `TESTS.md`.

## Development environment

A devcontainer is provided in `.devcontainer/` with an etcd instance wired up via
Docker Compose. `post-create.sh` installs frontend deps and seeds etcd with test
records (`scripts/seed-etcd.sh`). Inspect etcd directly with:

```bash
etcdctl --endpoints http://etcd:2379 get --prefix /skydns
```

## Architecture

### Data flow

1. **`backend/cmd/auto-dns-webui/root.go`** — Cobra CLI entrypoint. Loads config
   via Viper, sets up signal handling, and runs the app.
2. **`backend/internal/config/config.go`** — Viper config: `app`, `etcd`, `log`,
   `server` (incl. dev `proxy`), and `mcp`. `Load()` unmarshals and `validate()`
   enforces required values.
3. **`backend/internal/app/app.go`** — Wires dependencies: creates the etcd
   client + `EtcdRegistry`, the API handler, the HTTP `Server`, and (if
   `mcp.enabled`) a second `http.Server` for the MCP handler. `Run` starts the
   HTTP server and, optionally, the MCP server, with graceful shutdown on context
   cancel.
4. **`backend/internal/registry/etcd_registry.go` (`EtcdRegistry`)** — Reads etcd
   under the configured `path_prefix` (default `/skydns`). `parseEtcdValue`
   reconstructs the FQDN by stripping the prefix and the trailing `xN` index
   segment and **reversing** the remaining domain labels, then unmarshals the
   JSON value (`host`, `record_type`, `owner_hostname`, `owner_container_id`,
   `owner_container_name`, `created`, `force`) into a `dns.Record`. `List` is the
   only method the app actually calls. (`Remove`/`LockTransaction` exist but are
   currently unused — see the open tech-debt issue.)
5. **`backend/internal/api/handlers.go`** — `Records` calls `Registry.List` and
   writes the records as JSON to `GET /api/records`.
6. **`backend/internal/server/server.go`** — Registers `/api/records` and mounts
   the frontend: a reverse proxy to Vite in dev (`proxy.enable`) or the embedded
   static files in prod.
7. **`backend/internal/mcp/`** — `handler.go` builds a streamable HTTP MCP server;
   `tools.go` registers three **read-only** tools: `list_dns_records` (filter by
   name substring / type / hostname), `get_dns_record` (exact FQDN), and
   `get_records_by_host` (by producing hostname). All filtering is in-memory after
   `Registry.List`.
8. **`frontend/src/pages/RecordList/RecordList.tsx`** — Fetches `/api/records`
   once on mount; all search, filtering, faceting, and multi-field sorting happen
   client-side in `frontend/src/utils/`. Filter/sort state is persisted in the URL
   query string (`utils/url.ts`).

### Key types

- **`dns.Record`** (`backend/internal/dns/record.go`) — `Dns` (name/type/value)
  plus `Meta` (container id/name, created, owner hostname, force). The TypeScript
  mirror is `RecordEntry` in `frontend/src/types/index.ts`.
- **etcd key format** — `{path_prefix}/{reversed-domain}/x{index}`, e.g.
  `/skydns/com/example/app/x1`. The producer of these keys is
  `docker-coredns-sync`; this app only reads them.

## Versioning, branches & releases

This app is a **downstream consumer** of the etcd record schema produced by
`docker-coredns-sync`, so versioning is dependency-aware. See `CONTRIBUTING.md`
for the full guide. Key conventions:

- **Versioning:** [SemVer](https://semver.org/). MAJOR = a breaking change to our
  public contract (HTTP API `/api/*`, config `AUTO_DNS_WEBUI_*`, MCP tool
  schemas) **or** dropping compatibility with an etcd schema older
  `docker-coredns-sync` versions still write; MINOR = backward-compatible
  features; PATCH = backward-compatible fixes and tooling/docs. Record changes in
  `CHANGELOG.md` (Keep a Changelog) under `## [Unreleased]` in the same PR, and
  note the minimum compatible `docker-coredns-sync` version when the consumed
  schema is involved.
- **Milestones are versions:** each milestone is a SemVer version (e.g. `v0.5.0`)
  that groups the issues shipping in it.
- **Branches:** `main` is stable. A milestone is integrated on a branch named for
  its version, `vMAJOR.MINOR.PATCH` (branched off `main`). **Feature/fix branches
  branch off the milestone branch** (`feat/...`, `fix/...`, `chore/...`,
  `docs/...`) and **merge back into the milestone branch.** When the milestone
  branch is green it merges into `main` and is tagged.
- **Tags & releases:** pushing a tag `vMAJOR.MINOR.PATCH` (pre-release:
  `-SUFFIX`) triggers `.github/workflows/docker.yaml`, which builds/pushes the
  GHCR image and cuts a GitHub Release from the matching `## [MAJOR.MINOR.PATCH]`
  CHANGELOG section. Rename `## [Unreleased]` to the versioned heading before
  tagging.

## Pull request conventions

- **Branch off, and target, the milestone branch** (`vMAJOR.MINOR.PATCH`), not
  `main` — unless merging a completed milestone branch into `main`.
- Link issues with closing keywords in the PR body — `Closes #N` / `Fixes #N` /
  `Resolves #N`. Merging into a milestone branch labels the issue
  `awaiting-release`; the keyword auto-closes it when the milestone branch merges
  to `main`.
- **Issue state** encodes pipeline position: open without `awaiting-release` =
  open for development; open + `awaiting-release` = merged to a milestone branch,
  not yet released; closed = released.
- Run `make check` and update `CHANGELOG.md` before opening the PR.
