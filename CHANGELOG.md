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
- Live record refresh. The record list now stays current without a manual page
  reload: the backend exposes a Server-Sent Events endpoint
  (`GET /api/records/stream`) backed by a single etcd `Watch` on the configured
  `path_prefix`, fanning record snapshots out to all connected clients, with a
  periodic `ping` heartbeat event. The web UI consumes the stream and falls back
  to polling `/api/records` when SSE is unavailable, errors, or opens but goes
  silent (e.g. behind a buffering proxy — detected via a heartbeat watchdog),
  pausing updates while the tab is hidden. A connection-status indicator, a
  "last updated" time, and a manual **Refresh** control were added to the UI.
  New Prometheus gauge
  `auto_dns_webui_stream_clients` reports the number of connected stream clients
  (#23).

### Notes
- Purely additive: no change to the existing public contract (`/api/records`,
  `AUTO_DNS_WEBUI_*` config, MCP tool schemas) or to the consumed
  `docker-coredns-sync` etcd record schema — the new stream endpoint reads the
  same records, so the minimum compatible producer version is unchanged.

## [0.7.0] - 2026-06-26

### Added
- Health and readiness endpoints. `GET /healthz` reports process liveness
  (always `200` while serving, never touches etcd) and `GET /readyz` reports
  readiness — `200` when etcd is reachable, `503` otherwise (bounded by a short
  ping timeout) — so the service can be probed by Docker/Kubernetes/uptime
  checks. Both endpoints are also served on the MCP server's port when the MCP
  server is enabled, making that second `http.Server` independently probeable
  (#21).
- Prometheus `GET /metrics` endpoint exposing the standard Go runtime/process
  collectors plus application metrics: HTTP request count and latency by
  route/method/status (`auto_dns_webui_http_requests_total`,
  `auto_dns_webui_http_request_duration_seconds`), current record count
  (`auto_dns_webui_dns_records`), etcd list errors
  (`auto_dns_webui_etcd_list_errors_total`), and MCP tool-call counts by tool
  (`auto_dns_webui_mcp_tool_calls_total`). README documents a scrape config and
  the metric reference (#22).

### Notes
- Purely additive: no change to the existing public contract (`/api/records`,
  `AUTO_DNS_WEBUI_*` config, MCP tool schemas) or to the consumed
  `docker-coredns-sync` etcd record schema — the minimum compatible producer
  version is unchanged.

## [0.6.0] - 2026-06-26

### Added
- Frontend: loading and error states for the record list. A failed `/api/records`
  fetch now shows an error message with a **Retry** button instead of leaving a
  permanently blank page, and a loading indicator is shown while fetching (#20).

### Changed
- MCP server now reports the application version instead of a hardcoded `1.0.0`.
  The version is stamped into the binary at build time via
  `-ldflags "-X .../internal/version.Version=<v>"` (defaulting to `dev` for
  unstamped/local builds); release images are stamped from the git tag through
  the Dockerfile `VERSION` build arg (#20).

### Removed
- Dead write-path scaffolding carried over from `docker-coredns-sync`: the unused
  `Registry.Remove` and `Registry.LockTransaction` methods and the previously
  **required** etcd lock configuration (`etcd.lock_ttl`, `etcd.lock_timeout`,
  `etcd.lock_retry_interval`, with their CLI flags). They were only exercised by
  the locking path, which this read-only app never invokes; operators no longer
  need to set these meaningless values to start. Reintroduce locking alongside a
  write/delete feature if one is ever added (#19).

### Fixed
- Dev-mode Vite reverse proxy now honors the configured `server.proxy.hostname`
  and `server.proxy.port` instead of a hardcoded `http://localhost:5173`, and
  `ProxyToVite` returns an error rather than calling `log.Fatalf` (#18).
- Corrected the `dns.DnsRecord.Type` doc comment to note `AAAA` is supported, not
  just `A`/`CNAME` (#20).

## [0.5.1] - 2026-06-26

Maintenance release: dependency and CI updates plus Dependabot automation
tuning. No change to the public contract (HTTP `/api/*`, `AUTO_DNS_WEBUI_*`
config, MCP tool schemas) or to the consumed `docker-coredns-sync` etcd record
schema — the minimum compatible producer version is unchanged from 0.5.0.

### Changed
- Backend (Go) dependencies: `github.com/spf13/cobra` 1.9.1 → 1.10.2, `github.com/spf13/viper` 1.20.1 → 1.21.0, `github.com/rs/zerolog` 1.34.0 → 1.35.1, `github.com/mark3labs/mcp-go` 0.54.0 → 0.55.1, and `go.etcd.io/etcd/client/v3` 3.6.1 → 3.6.12.
- Frontend (npm) dependencies: `vite` 6.3.5 → 8.1.0, `vitest` 2.1.9 → 4.1.9, `typescript` 5.8.3 → 6.0.3, `lucide-react` 0.515.0 → 1.21.0, `react`/`react-dom` 19.1.0 → 19.2.7 (with `@types/react` 19.1.7 → 19.2.17, `@types/react-dom` 19.1.6 → 19.2.3), `@types/node` 22.14.1 → 26.0.1, `globals` 16.5.0 → 17.7.0, `prettier` 3.5.3 → 3.8.5, `sass-embedded` 1.89.2 → 1.100.0, and `eslint-config-prettier` 10.1.5 → 10.1.8.
- CI GitHub Actions: `actions/checkout` 4 → 7, `actions/setup-go` 5 → 6, `actions/setup-node` 4 → 6, `golangci/golangci-lint-action` 8 → 9, `docker/setup-buildx-action` 3 → 4, `docker/login-action` 3 → 4, `docker/build-push-action` 5 → 7, and `actions/attest-build-provenance` 2 → 4.
- Dependabot (`.github/dependabot.yml`): group minor/patch version updates into a single PR per ecosystem (majors stay separate for review), group security updates per ecosystem, pin the weekly schedule to Mondays, and lower `open-pull-requests-limit` to 3.

### Fixed
- Frontend typecheck under TypeScript 6: declare side-effect stylesheet imports (`declare module '*.scss'`) so `import './styles/globals.scss'` no longer trips `TS2882`.

### Notes
- `eslint`/`@eslint/js` major bumps (eslint 10) are held back via a Dependabot `ignore`: `eslint-plugin-react` (latest 7.37.5) only declares peer support up to eslint `^9.7`. The ignore should be removed once the plugin ships eslint-10 support.

## [0.5.0] - 2026-06-25

### Added
- `CONTRIBUTING.md` documenting the SDLC: dependency-aware SemVer, milestones-as-versions, the milestone/feature branching model, the issue/label lifecycle, and PR conventions.
- `CLAUDE.md` and `AGENTS.md`: architecture/data-flow overview and the same SDLC for coding agents and contributors.
- Pull request template and issue templates (bug report, feature request) under `.github/`.
- Makefile quality gates: `check`, `lint`, `vet`, `typecheck`, `format`, `test`, `test-race`, `test-coverage`, `test-coverage-html` (backend uses `go`/`golangci-lint`; frontend delegates to npm scripts).
- Frontend npm scripts (`lint`, `lint:fix`, `typecheck`, `format`, `format:check`), an ESLint flat config (`eslint.config.js`) using `typescript-eslint` + react-hooks, and Prettier config (`.prettierrc.json` / `.prettierignore`).
- CI workflow (`.github/workflows/ci.yaml`) running backend (build, vet, golangci-lint, race tests) and frontend (lint, typecheck, build) jobs on pull requests and pushes to `main`/`v*` branches.
- Dependency and vulnerability automation: `.github/dependabot.yml` (gomod, npm, github-actions) and `.github/workflows/security.yaml` running `govulncheck` (backend) and `npm audit` (frontend) on a schedule and on dependency changes.
- Backend unit tests for config validation, the etcd registry (`parseEtcdValue`, `List`, `Remove`) via a mocked etcd client, the `/api/records` handler, and the MCP tools (`list_dns_records`, `get_dns_record`, `get_records_by_host`).
- Frontend unit tests (Vitest) for the `utils/` logic (`object`, `record`, `sort`, `filters`, `url`), wired into `make test-frontend`, plus a `TESTS.md` documenting automated and manual test cases.

### Changed
- `frontend/tsconfig.json`: `moduleResolution` set to `bundler` and `skipLibCheck` enabled so `tsc --noEmit` type-checks cleanly against Vite and third-party types.
- `frontend/package.json` version bumped from the stale `0.1.0` to `0.5.0` to track the active development line.
- CI: upgraded `golangci/golangci-lint-action` v6 → v8 (pinned golangci-lint `v2.12.2`) so the linter binary is built with a Go toolchain compatible with the module's Go version (v6 shipped a go1.24-built binary that refused to run against the go1.26 module).

### Fixed
- Handle the JSON encode error in the `/api/records` handler (log on failure) instead of ignoring it, and explicitly ignore the (non-failing) `viper.BindPFlag` return values in CLI flag binding — resolving the `errcheck` findings that `golangci-lint` now reports.

### Security
- Bumped the Go toolchain `1.26.3` → `1.26.4`, remediating two *called* standard-library vulnerabilities flagged by `govulncheck`: `GO-2026-5039` (net/textproto) and `GO-2026-5037` (crypto/x509), both fixed in go1.26.4.

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
