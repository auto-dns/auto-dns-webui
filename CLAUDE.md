# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
make dev         # Vite dev server (port 5173) + Go backend concurrently
```

### Backend only
```bash
go run -tags=dev ./backend         # Run Go backend in dev mode
go build -tags=dev ./backend       # Build dev binary
```

### Frontend only
```bash
cd frontend && npm run dev         # Vite dev server
cd frontend && npm run lint        # ESLint with auto-fix
cd frontend && npm run build       # Production build
```

### Production build
```bash
make prod        # Build frontend, embed into backend, compile Go binary
make run-prod    # prod + run resulting binary
```

### Dev environment
```bash
make init               # Generate .devcontainer/.env from example
scripts/seed-etcd.sh    # Seed etcd with example DNS records
etcdctl --endpoints http://etcd:2379 get --prefix /skydns   # Inspect records
```

## Architecture

Minimal: Go backend reads etcd using the SkyDNS path format, exposes `GET /api/records`, and serves the React SPA.

```
backend/internal/registry/   — etcd read logic
backend/internal/api/        — single Records handler
backend/internal/server/     — HTTP server wiring
frontend/src/                — React + TypeScript, single page, no routing
```

### Build tags

`-tags=dev` enables the Vite proxy in `internal/frontend/embed.go`. Without the tag, the binary serves the embedded `dist/` directly.

### Config

All config keys map to env vars with prefix `AUTO_DNS_WEBUI_`. Config file (`config.yaml`) is also supported.

---

## Development Workflow

**Never commit directly to `main`.** All changes go through a branch and PR.

### Branch naming

- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `chore/<short-description>` — maintenance, tooling, docs, dependency updates
- `version/<X.Y.Z>` — version bump + CHANGELOG update PRs

### Step-by-step process

```bash
# 1. Branch from main
git checkout main && git pull
git checkout -b feat/my-feature

# 2. Implement changes

# 3. Run local checks — ALL must pass before opening a PR
#    Backend (in backend/):
go build ./...          # compile check — catches type errors, duplicate declarations, etc.
go vet ./...            # static analysis
#    Frontend (in frontend/):
npm run build           # tsc compile + Vite bundle — catches type errors
npm run lint            # ESLint

# 4. Push and open a PR
git push -u origin feat/my-feature
gh pr create --title "..." --body "..."

# 5. Antagonistic code review
#    Run /ultrareview in Claude Code to get an independent, critical review of the PR.
#    Address ALL feedback before merging. This is mandatory, not optional.

# 6. Merge the PR (squash merge preferred)
```

### Why local checks are mandatory

CI only runs on tag pushes, not branch pushes. A compile error will not surface until the Docker build on a tag — by which point the broken tag is already public. Always run `go build ./...` and `npm run build` before creating a PR.

### Antagonistic code review

Before merging any PR, run `/ultrareview` (or `/ultrareview <PR#>`) in Claude Code. This spawns an independent review agent that critiques the PR adversarially — looking for bugs, race conditions, security issues, and API contract violations. Treat findings as blocking: address every concern or justify why it doesn't apply.

---

## Releasing

Releases are tag-driven. Pushing a `v*.*.*` tag triggers CI (`.github/workflows/docker.yaml`) to:
1. Build and push the Docker image to `ghcr.io/auto-dns/auto-dns-webui`
2. Create a GitHub release automatically from the matching `CHANGELOG.md` section

Tags on `main` only. Stable releases use `vMAJOR.MINOR.PATCH`; pre-releases use `vMAJOR.MINOR.PATCH-suffix`.

### Release checklist

```bash
# 1. Update CHANGELOG.md on main (via PR):
#    - Change "## [Unreleased]" → "## [X.Y.Z] - YYYY-MM-DD"
#    - Add a new empty "## [Unreleased]" section at the top

# 2. After the CHANGELOG PR merges, tag main:
git checkout main && git pull
git tag -a vX.Y.Z -m "vX.Y.Z"
git push origin vX.Y.Z
```

CI then:
- Builds multi-platform image (amd64, arm64, arm/v7)
- Pushes `ghcr.io/auto-dns/auto-dns-webui:X.Y.Z`
- For stable releases: also updates `:X.Y`, `:X`, and `:latest`
- Creates a GitHub release with the CHANGELOG section + Docker pull command

### CHANGELOG format

`CHANGELOG.md` follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) with sub-sections `Added`, `Changed`, `Fixed`, `Removed`, `Security`. The CI release step extracts the `## [X.Y.Z]` section by version number — the section heading must match `## [X.Y.Z]` exactly (no `v` prefix).
