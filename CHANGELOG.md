# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Versioning note.** The published tags jump from `0.1.8` to `0.4.1`; versions
> `0.2.0`–`0.4.0` were never tagged or released. `0.4.1` was the first release cut
> after `0.1.8` and shipped CI/release tooling only (see its entry below). The
> **git tag is the authoritative version** for a release — the GHCR image and
> GitHub Release are built from it. `frontend/package.json`'s `version` tracks the
> in-development line and is not the release source of truth. The active
> development line is `0.5.x`. As a **downstream consumer** of the
> [`docker-coredns-sync`](https://github.com/auto-dns/docker-coredns-sync) etcd
> record schema, releases note the minimum compatible producer version when the
> consumed schema is involved (see `CONTRIBUTING.md`).

## [Unreleased]

### Added
- `CONTRIBUTING.md` documenting the SDLC: dependency-aware SemVer, milestones-as-versions, the milestone/feature branching model, the issue/label lifecycle, and PR conventions.
- `CLAUDE.md` and `AGENTS.md`: architecture/data-flow overview and the same SDLC for coding agents and contributors.
- Pull request template and issue templates (bug report, feature request) under `.github/`.
- Makefile quality gates: `check`, `lint`, `vet`, `typecheck`, `format`, `test`, `test-race`, `test-coverage`, `test-coverage-html` (backend uses `go`/`golangci-lint`; frontend delegates to npm scripts).
- Frontend npm scripts (`lint`, `lint:fix`, `typecheck`, `format`, `format:check`), an ESLint flat config (`eslint.config.js`) using `typescript-eslint` + react-hooks, and Prettier config (`.prettierrc.json` / `.prettierignore`).
- CI workflow (`.github/workflows/ci.yaml`) running backend (build, vet, golangci-lint, race tests) and frontend (lint, typecheck, build) jobs on pull requests and pushes to `main`/`v*` branches.

### Changed
- `frontend/tsconfig.json`: `moduleResolution` set to `bundler` and `skipLibCheck` enabled so `tsc --noEmit` type-checks cleanly against Vite and third-party types.
- `frontend/package.json` version bumped from the stale `0.1.0` to `0.5.0` to track the active development line.

## [0.4.1] - 2026-05-17

First release cut after `0.1.8` (see the versioning note above). Shipped
CI/release tooling only — no application behavior changes.

### Added
- Automated GitHub Releases from CI: on tag push, release notes are extracted from the matching `## [VERSION]` CHANGELOG section and the Docker pull command is appended.

### Fixed
- Corrected YAML literal-block indentation in the release workflow's "Create GitHub release" step.
- Used the full image reference (instead of a bare digest) as the `docker buildx imagetools create` source so the major/minor/latest tag push for stable releases succeeds.

## [0.1.8] - 2026-05-15

### Changed
- README completely rewritten: full configuration reference, MCP tool descriptions, Docker Compose example, etcd seeding, and dev environment setup.

## [0.1.7] - 2026-05-15

### Fixed
- Remediated npm and Go dependency vulnerabilities flagged by security audit.

## [0.1.6] - 2026-05-15

### Changed
- Go upgraded from 1.24 to 1.26.3.

## [0.1.5] - 2026-05-15

### Added
- **MCP server** — exposes read-only DNS record access via the Model Context Protocol. Allows Claude and other MCP clients to query all etcd-backed DNS records (A, AAAA, CNAME) with filtering by name, type, and value.

## [0.1.4] - 2025-07-21

### Added
- Filter and sort sidebar state now persists across page refreshes via URL query parameters — share a filtered view by copying the URL.

## [0.1.3] - 2025-06-17

### Added
- Sliding sidebar navigation with mobile drawer mode (hamburger toggle).
- Advanced filter and sort panel: multi-field sort, pill-style type facets, sticky header.
- Search bar for filtering by domain name or IP address.
- URL-param-based filter/sort persistence (base implementation).

### Changed
- Refactored to SCSS modules for component-level styles.
- Standardised media queries across all breakpoints.

## [0.1.2] - 2025-06-10

### Added
- Mobile-friendly responsive layout.
- Card-based record list with collapsible detail rows.

### Changed
- Complete UI redesign: sidebar layout, card components, and typography overhaul.

## [0.1.1] - 2025-06-10

### Changed
- Typography and spacing refinements.

## [0.1.0] - 2025-06-09

### Added
- Initial release. Read-only web UI for browsing DNS records stored in etcd (SkyDNS/CoreDNS format).
- Go backend reads etcd using the SkyDNS path prefix (`/skydns`), exposes `GET /api/records`, and serves the React SPA.
- Basic record list with type filtering (A, AAAA, CNAME).
- Docker image published to `ghcr.io/auto-dns/auto-dns-webui`.
- CI workflow builds multi-platform images (amd64, arm64, arm/v7) on tag push.
