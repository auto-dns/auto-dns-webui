# Tests

Automated tests run without any external services (etcd and the browser are not
required). Manual integration cases — which need a live etcd seeded by
`docker-coredns-sync`-style records — are listed at the bottom.

## Automated

```bash
make check          # everything: backend vet/lint/test + frontend lint/typecheck/test
make test           # backend (go test) + frontend (vitest)
```

### Backend (Go)

```bash
make test-backend       # cd backend && go test ./...
make test-race          # go test -race ./...
make test-coverage      # coverage function summary
```

The etcd client is abstracted behind the `etcdClient` interface
(`backend/internal/registry/etcd_registry.go`), so the registry is tested with a
mock — no live etcd. Current unit coverage: config validation, the registry
(`parseEtcdValue`, `List`, `Remove`), the `/api/records` handler, and the MCP
tools.

### Frontend (Vitest)

```bash
make test-frontend          # cd frontend && npm test  (vitest run)
npm run test:watch --prefix frontend
```

Unit tests cover the pure logic in `frontend/src/utils/` — `object`, `record`,
`sort`, `filters`, and `url` (URL serialize/parse round-trip).

## Manual integration cases

These require the devcontainer (or a local etcd) seeded via
`scripts/seed-etcd.sh`. Start the app with `make dev` and verify:

1. **Record list loads.** `GET /api/records` returns the seeded records and the
   UI renders them grouped/sorted by name.
2. **Filtering & search.** Type/hostname/force facets and the free-text search
   narrow the list; facet counts update.
3. **Sorting.** Single- and multi-field sorts reorder the list; the default
   (name asc) is omitted from the URL.
4. **URL persistence.** Applying filters/sorts updates the query string; copying
   the URL into a new tab restores the same view; browser back/forward works.
5. **MCP tools** (when `AUTO_DNS_WEBUI_MCP_ENABLED=true`): `list_dns_records`
   (with/without filters), `get_dns_record` (exact FQDN, incl. trailing dot),
   and `get_records_by_host` return the expected subsets.
6. **etcd unavailable.** Stop etcd and confirm `/api/records` returns 500 and the
   UI surfaces the error (see issue #20 for the error-state work).
