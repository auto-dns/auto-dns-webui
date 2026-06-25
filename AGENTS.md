# AGENTS.md

Guidance for coding agents (Codex, etc.) working in this repository. The
authoritative, detailed guide is **[`CLAUDE.md`](./CLAUDE.md)** — read it for the
full architecture and data flow. This file mirrors the essentials so agents have
a single, consistent contract. Keep the two in sync when either changes.

## What this is

A **read-only** web UI + optional MCP server for browsing the DNS records that
[`docker-coredns-sync`](https://github.com/auto-dns/docker-coredns-sync) writes
into etcd (SkyDNS/CoreDNS format). Go backend in `backend/`, React + Vite
frontend in `frontend/` (embedded into the binary for production).

## Build, run & quality

```bash
make dev       # Vite (:5173) + Go backend (:8080), backend proxies to Vite
make prod      # build frontend and embed it into the Go binary
make check     # lint + typecheck + test for backend and frontend (run before every PR)
```

(The `make check`/`test`/`lint` targets and the test suites are being introduced
in the foundations milestone; until then run `go test ./...` and the `npm`
scripts directly.) The etcd client is abstracted behind an `etcdClient` interface
in `backend/internal/registry/`, so the registry is testable with mocks — no live
etcd required. See `CLAUDE.md` for the full architecture and `TESTS.md` for manual
cases.

## SDLC — versioning, milestones & branches

This app is a **downstream consumer** of the etcd record schema produced by
`docker-coredns-sync`; version bumps are dependency-aware. Full rules in
[`CONTRIBUTING.md`](./CONTRIBUTING.md).

- **SemVer, dependency-aware.** MAJOR = breaking change to our public contract
  (HTTP API `/api/*`, config `AUTO_DNS_WEBUI_*`, MCP tool schemas) **or** dropping
  compatibility with an etcd schema older `docker-coredns-sync` versions still
  write; MINOR = backward-compatible features; PATCH = backward-compatible fixes /
  tooling / docs. Update `CHANGELOG.md` under `## [Unreleased]` in the same change,
  and note the minimum compatible `docker-coredns-sync` version when the consumed
  schema is involved.
- **Milestones are versions.** Each milestone is a SemVer version (e.g. `v0.5.0`)
  grouping the issues that ship in it.
- **Branching model.** `main` is stable. A milestone is integrated on a branch
  named for its version, `vMAJOR.MINOR.PATCH`, branched off `main`. **Feature/fix
  branches branch off the milestone branch** and **merge back into it**; the
  milestone branch later merges into `main` and is tagged. Never commit features
  straight to `main` or to a milestone branch — use a feature branch.
- **Releases.** Pushing a `vMAJOR.MINOR.PATCH` tag triggers
  `.github/workflows/docker.yaml` (GHCR image + GitHub Release from the matching
  CHANGELOG section). Rename `## [Unreleased]` to the versioned heading before
  tagging.

## Pull requests

- Branch off, and target, the relevant **milestone branch** (`vMAJOR.MINOR.PATCH`),
  not `main` — unless merging a finished milestone branch into `main`.
- Link issues with `Closes #N` / `Fixes #N` / `Resolves #N`.
- Run `make check` and update `CHANGELOG.md` before opening the PR.
