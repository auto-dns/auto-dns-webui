# Changelog

All notable changes to this project are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
