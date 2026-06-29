# Roadmap

This is a living roadmap. **GitHub [Issues] and [Milestones] are the source of
truth** for what's planned and in flight — this file is a human-readable index
that points at them and captures longer-term ideas that aren't tracked as issues
yet. When you pick something up here, work it through its issue (or file one
first); see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the versioning, branch, and
PR conventions.

[Issues]: https://github.com/auto-dns/auto-dns-webui/issues
[Milestones]: https://github.com/auto-dns/auto-dns-webui/milestones

## Shipped

The foundational app is in place: etcd-backed record listing, the searchable /
filterable / sortable React UI, live refresh over SSE with polling fallback
(#23), health & readiness probes (#21), Prometheus metrics (#22), the read-only
MCP server, and the Hosts view (#9). See [`CHANGELOG.md`](./CHANGELOG.md) for the
per-release detail.

## In progress / open

Tracked as GitHub issues — check the [issue list][Issues] for current state
(open = open for development; `awaiting-release` = merged to a milestone branch,
not yet released):

- **Hosts view (#9)** — a Hosts tab summarizing each `docker-coredns-sync` node:
  online/offline from its etcd heartbeat plus per-host record stats.
- **Replace this stale planning doc with a maintained roadmap (#25)** — what
  you're reading.

## Later / not yet scheduled

Ideas worth doing but not yet committed to a milestone. File an issue when one is
picked up.

- **Authentication / access control (#24)** — protect the UI, `/api/*`, and the
  MCP server (reverse-proxy/forward-auth trust vs. built-in token). Currently
  **deferred** (labeled `deferred`): many deployments already sit behind an
  authenticating proxy. RBAC with viewer/editor roles would build on this.
- **Smart record validation** — surface malformed values (e.g. IP/hostname
  sanity checks) in the UI. Read-only, so this is advisory display only.
- **Audit log / change history** — show how the record set has changed over time.
  Depends on a source of historical data (the producer or an external store);
  this app only sees etcd's current state.

## Explicitly out of scope

- **Mutating records (create / edit / delete)** — `auto-dns-webui` is a
  **read-only** consumer of the records `docker-coredns-sync` writes. Record
  lifecycle belongs to the producer, not this UI.
