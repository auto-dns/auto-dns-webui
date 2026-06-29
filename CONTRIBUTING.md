# Contributing

Thanks for contributing to `auto-dns-webui` — a read-only web UI (and optional
MCP server) for browsing the DNS records that
[`docker-coredns-sync`](https://github.com/auto-dns/docker-coredns-sync) writes
into etcd for CoreDNS. This guide documents the project's conventions for
versioning, milestones, branches, tags, issues, and pull requests.

> Licensing note: this project uses a [custom MIT-NC license](./LICENSE)
> (non-commercial). By contributing you agree your contributions are licensed
> under the same terms.

## Development quickstart

The repo is split into a Go backend (`backend/`) and a React + Vite frontend
(`frontend/`). For production the built frontend is embedded into the Go binary.

```bash
make dev      # Vite (:5173) + Go backend (:8080) with reverse proxy, hot reload
make prod     # build frontend and embed it into the Go binary
make check    # lint + typecheck + test for backend and frontend (run before every PR)
```

See `CLAUDE.md` / `AGENTS.md` for an architecture overview and the data flow from
etcd → backend → UI/MCP.

## Versioning (SemVer, dependency-aware)

The project follows [Semantic Versioning](https://semver.org/)
(`MAJOR.MINOR.PATCH`) and records all notable changes in `CHANGELOG.md`
following [Keep a Changelog](https://keepachangelog.com/). **Add your entry under
the `## [Unreleased]` heading in the same PR as your change.**

Because this app sits in a dependency chain, decide the bump by considering both
**its own public contract** and the **upstream/downstream projects** it
integrates with:

- **This app's public contract** is: the HTTP API (`/api/*`), the configuration
  surface (`AUTO_DNS_WEBUI_*` env vars / `config.yaml` keys / CLI flags), the MCP
  tool names and schemas, and the published Docker image behavior.
- **Upstream (what we consume):** `docker-coredns-sync` (the producer of the
  etcd record schema — `host`, `record_type`, `owner_*`, `created`, `force`),
  and below it CoreDNS + etcd / the SkyDNS key format. We are a **downstream
  consumer** of that schema.
- **Sibling/peer services** in the same homelab stack (e.g. `pihole`,
  reverse-proxy/forward-auth) inform compatibility expectations for auth and
  deployment.

Rules of thumb:

| Bump | When |
|------|------|
| **MAJOR** | A breaking change to *our* public contract (renamed/removed config key, changed API/MCP schema), **or** dropping compatibility with an etcd record schema that older `docker-coredns-sync` versions still write. |
| **MINOR** | Backward-compatible features: new endpoints, UI features, MCP tools, new *optional* config, or support for a new upstream schema field while still reading the old shape. |
| **PATCH** | Backward-compatible bug fixes and internal/tooling/doc changes with no contract change. |

Every release's CHANGELOG entry SHOULD note the **minimum compatible
`docker-coredns-sync` version** (and any CoreDNS/etcd expectations) it was tested
against, since our correctness depends on that upstream schema.

The active version line continues from the latest published release (`0.4.x`).

## Milestones are versions

**Each milestone is a SemVer version** (e.g. `v0.5.0`, `v0.6.0`, `v1.0.0`), not a
free-form label. A milestone groups the issues that will ship together in that
version. Choose the milestone's version using the SemVer rules above (the largest
bump among its issues wins — one breaking change in the group makes the whole
milestone a MAJOR).

When you file or triage an issue, assign it to the milestone (version) it targets.

The [`TODO.md`](./TODO.md) roadmap is a human-readable index of what's shipped,
in flight, and on the "later" list — it points at the GitHub issues/milestones,
which remain the source of truth. Update it when the shape of the backlog changes.

## Branches

`main` is the default, stable branch. We use a two-level branching model:

1. **Milestone / integration branch** — named exactly for the version,
   `vMAJOR.MINOR.PATCH` (e.g. `v0.5.0`). It is branched off `main` and is where a
   milestone's work is integrated. **This branch is the milestone.**
2. **Feature / fix branches** — branched off the **milestone branch** (not
   `main`), named `feat/...`, `fix/...`, `chore/...`, or `docs/...`. Each feature
   is developed on its own branch and **merged back into the milestone branch**.

```
main
 └── v0.5.0                 # milestone/integration branch (branched from main)
      ├── docs/contributing-and-sdlc   # feature branch → merged into v0.5.0
      ├── docs/agent-guides            # feature branch → merged into v0.5.0
      └── ci/add-pipeline              # feature branch → merged into v0.5.0
```

When the milestone branch is complete and green, it is merged into `main` and
tagged (see below). A standalone hotfix that isn't part of a planned milestone
still gets its own `vMAJOR.MINOR.PATCH` branch off `main`.

## Tags & releases

Releases are cut by pushing a git tag once the milestone branch has merged to
`main`:

- Stable: `vMAJOR.MINOR.PATCH` (e.g. `v0.5.0`).
- Pre-release: `vMAJOR.MINOR.PATCH-SUFFIX` (e.g. `v0.5.0-rc.1`).

Pushing a matching tag triggers `.github/workflows/docker.yaml`, which:

- builds and pushes the multi-arch image to GHCR, and
- creates a GitHub Release with notes extracted from the matching
  `## [MAJOR.MINOR.PATCH]` section of `CHANGELOG.md`.

Stable (non-pre-release) tags also move the `MAJOR`, `MAJOR.MINOR`, and `latest`
image tags. **Before tagging, rename the `## [Unreleased]` CHANGELOG section to
`## [MAJOR.MINOR.PATCH] - YYYY-MM-DD`** — the release notes are empty if the
section is missing.

**Also bump `frontend/package.json`'s `version`** to the release's
`MAJOR.MINOR.PATCH` in the same change that updates the CHANGELOG, so the source
tree tracks the active line. The **git tag is the authoritative version** for a
release (the GHCR image and GitHub Release are built from it); this field is
informational for anyone reading the checked-out source, so a lag is harmless,
but keep it in sync each release.

## Issues & labels

Issue state encodes where work is in the release pipeline:

| State | Meaning |
|-------|---------|
| Open, no `awaiting-release` label | Open for development |
| Open + `awaiting-release` | Implemented and merged to a milestone branch; not yet released |
| Closed | Released (auto-closes when the milestone branch merges to `main`) |

Labels in use:

| Label | Meaning |
|-------|---------|
| `bug` | A defect in existing behavior |
| `enhancement` | New feature or improvement |
| `documentation` | Docs-only change |
| `ci` | CI/CD, workflows, automation |
| `test` | Test coverage / test infrastructure |
| `security` | Vulnerability remediation or hardening |
| `tech-debt` | Cleanup, dead code, refactors with no behavior change |
| `deferred` | Acknowledged but intentionally not scheduled yet (not declined — see `TODO.md`'s "Later" list) |
| `awaiting-release` | Merged to a milestone branch, not yet released (managed by automation) |

Group issues by their target release using the **milestone (version)** they
belong to.

## Pull requests

- **Target the milestone branch** (`vMAJOR.MINOR.PATCH`) the work belongs to,
  **not `main`** — unless you are merging a completed milestone branch into
  `main`.
- **Branch off the milestone branch**, not `main`.
- **Link issues with closing keywords** in the PR body: `Closes #N`, `Fixes #N`,
  or `Resolves #N`. This drives the automation: merging into a milestone branch
  (`v*`) labels the issue `awaiting-release`; the `Closes #N` keyword fires (and
  auto-closes the issue) when the milestone branch merges into `main`.
- **Run `make check`** (lint + typecheck + test for backend and frontend) before
  opening the PR.
- **Update `CHANGELOG.md`** under `## [Unreleased]` in the same PR, and note any
  change to the minimum compatible `docker-coredns-sync` version.
