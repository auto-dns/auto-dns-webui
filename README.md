# auto-dns-webui

A read-only web UI and optional MCP server for browsing DNS records stored in etcd by [docker-coredns-sync](https://github.com/auto-dns/docker-coredns-sync). It presents all A/CNAME records registered in CoreDNS-compatible SkyDNS format as a searchable table.

It optionally exposes an MCP (Model Context Protocol) server so AI tools like Claude can query the live DNS record set.

---

## Features

- Browse all A/AAAA/CNAME records registered in etcd (SkyDNS format)
- Filter by name, type, or source host
- Live updates: the record list refreshes automatically as etcd changes (server-pushed over SSE, with polling fallback), plus a manual refresh and a "last updated" indicator
- Hosts view: a **Hosts** tab summarizes each `docker-coredns-sync` node publishing records — online/offline (from the producer's etcd heartbeat) plus per-host record count, type breakdown, containers, and last-published time
- Optional MCP server: `list_dns_records`, `get_dns_record`, `get_records_by_host`

---

## Docker

```bash
docker pull ghcr.io/auto-dns/auto-dns-webui:latest
```

### docker-compose snippet

```yaml
auto-dns-webui:
  image: ghcr.io/auto-dns/auto-dns-webui:latest
  restart: unless-stopped
  ports:
    - "8080:8080"
    - "8092:8092"   # MCP server port (only if mcp.enabled=true)
  environment:
    AUTO_DNS_WEBUI_APP_HOSTNAME: <YOUR_HOSTNAME>
    AUTO_DNS_WEBUI_ETCD_HOST: localhost
    AUTO_DNS_WEBUI_ETCD_PORT: 2379
    AUTO_DNS_WEBUI_MCP_ENABLED: "true"
    AUTO_DNS_WEBUI_MCP_PORT: "8092"
  network_mode: host   # required to reach etcd on the same host
```

---

## Configuration Reference

All values can be set via environment variables (`AUTO_DNS_WEBUI_*`), a `config.yaml` file, or CLI flags.

| Config Key | Env Var | Default | Description |
|---|---|---|---|
| `app.hostname` | `AUTO_DNS_WEBUI_APP_HOSTNAME` | *(required)* | Logical hostname for this node (used as a label in the UI) |
| `etcd.host` | `AUTO_DNS_WEBUI_ETCD_HOST` | `localhost` | etcd host |
| `etcd.port` | `AUTO_DNS_WEBUI_ETCD_PORT` | `2379` | etcd port |
| `etcd.path_prefix` | `AUTO_DNS_WEBUI_ETCD_PATH_PREFIX` | `/skydns` | etcd key prefix (SkyDNS format) |
| `etcd.heartbeat_prefix` | `AUTO_DNS_WEBUI_ETCD_HEARTBEAT_PREFIX` | `/docker-coredns-sync/heartbeat` | etcd key prefix where `docker-coredns-sync` publishes per-host liveness heartbeats (read by the Hosts view). Must not overlap `path_prefix`. |
| `log.level` | `AUTO_DNS_WEBUI_LOG_LEVEL` | `INFO` | Log level: `TRACE`, `DEBUG`, `INFO`, `WARN`, `ERROR`, `FATAL` |
| `server.port` | `AUTO_DNS_WEBUI_SERVER_PORT` | `8080` | HTTP server port |
| `mcp.enabled` | `AUTO_DNS_WEBUI_MCP_ENABLED` | `false` | Enable the MCP server |
| `mcp.port` | `AUTO_DNS_WEBUI_MCP_PORT` | *(required if enabled)* | Port for the MCP server |

### Config file locations

- `$HOME/.config/auto-dns-webui/config.yaml`
- `/etc/auto-dns-webui/config.yaml`
- `/config/config.yaml`
- `./config.yaml`

### Example `config.yaml`

```yaml
app:
  hostname: dns1

etcd:
  host: localhost
  port: 2379
  path_prefix: /skydns
  heartbeat_prefix: /docker-coredns-sync/heartbeat

log:
  level: INFO

server:
  port: 8080

mcp:
  enabled: true
  port: 8092
```

---

## MCP Server

When `mcp.enabled=true`, a [streamable HTTP MCP server](https://spec.modelcontextprotocol.io) starts on `mcp.port`. Connect it as a remote MCP server in Claude (or any MCP client):

```
http://<host>:<mcp.port>/mcp
```

### Tools

| Tool | Description |
|---|---|
| `list_dns_records` | List all records; optional filters: `name` (substring), `type` (A/AAAA/CNAME), `hostname` |
| `get_dns_record` | Look up all records for an exact FQDN |
| `get_records_by_host` | All records registered by a specific docker-coredns-sync hostname |

---

## Endpoints

The HTTP server (`server.port`, default `8080`) exposes:

| Path | Description |
|---|---|
| `/` | The web UI (embedded SPA) |
| `/api/records` | JSON list of all DNS records |
| `/api/records/stream` | Server-Sent Events stream of record snapshots (see below) |
| `/api/hosts` | JSON per-host summary: liveness plus derived record stats (see below) |
| `/healthz` | Liveness — always `200 OK` while the process is serving. Does not touch etcd. |
| `/readyz` | Readiness — `200 OK` when etcd is reachable, `503 Service Unavailable` otherwise (bounded by a short timeout). Use this as a container/orchestrator readiness probe. |
| `/metrics` | Prometheus metrics (see below). |

When the MCP server is enabled it also serves `/healthz` and `/readyz` on `mcp.port`, so the second server can be probed independently.

### Live record stream

`GET /api/records/stream` is a [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) endpoint that keeps the UI current without manual reloads. The backend runs a single etcd `Watch` on the configured `path_prefix` and fans changes out to all connected clients, so the cost on etcd is constant regardless of how many browsers are open.

On connect, and again whenever the record set changes, the server emits a `records` event whose `data` is the same JSON array returned by `/api/records`:

```
event: records
data: [{"dnsRecord":{...},"metadata":{...}}, ...]

```

Idle connections receive a `ping` event roughly every 25 seconds to keep proxies from dropping them and to give clients a liveness signal. The web UI consumes this stream automatically and transparently falls back to polling `/api/records` if the stream is unavailable, errors, or opens but goes silent (e.g. behind a proxy that buffers responses) — if no `records` update or `ping` arrives within ~40 seconds the UI switches to polling.

### Hosts view

`GET /api/hosts` powers the **Hosts** tab in the UI. It returns one entry per `docker-coredns-sync` node, combining two sources that this app already reads from etcd:

- **Liveness** — `docker-coredns-sync` publishes a lease-backed heartbeat key per host under `heartbeat_prefix` (`/docker-coredns-sync/heartbeat/<hostname>` by default), kept alive while the node runs and expiring automatically when it stops. A host with a present heartbeat is reported `online`.
- **Stats** — the DNS records themselves, grouped by owning hostname: record count, a per-type breakdown, the contributing containers, and the most recent publish time.

A host appears if it is currently heartbeating **or** still owns records, so an online-but-idle node and a node that has gone offline while its records linger are both visible. The heartbeat read is best-effort: if it fails, hosts are still returned (marked offline) rather than failing the request. The view polls `/api/hosts` periodically (heartbeats aren't part of the record stream).

```json
[
  {
    "hostname": "dns1",
    "online": true,
    "recordCount": 3,
    "typeCounts": { "A": 2, "CNAME": 1 },
    "containers": [{ "containerId": "abc123", "containerName": "web", "recordCount": 3 }],
    "lastPublished": "2026-06-29T12:00:00Z"
  }
]
```

### Health probes

Docker / Kubernetes example using the readiness endpoint:

```yaml
healthcheck:
  test: ["CMD", "wget", "-qO-", "http://localhost:8080/readyz"]
  interval: 30s
  timeout: 5s
  retries: 3
```

### Prometheus metrics

`GET /metrics` exposes the standard Go runtime/process collectors plus:

| Metric | Type | Labels | Description |
|---|---|---|---|
| `auto_dns_webui_http_requests_total` | counter | `route`, `method`, `code` | HTTP requests handled (API and health routes) |
| `auto_dns_webui_http_request_duration_seconds` | histogram | `route`, `method` | HTTP request latency |
| `auto_dns_webui_dns_records` | gauge | — | Records returned by the most recent successful etcd list |
| `auto_dns_webui_stream_clients` | gauge | — | Currently connected record-stream (SSE) clients |
| `auto_dns_webui_etcd_list_errors_total` | counter | — | Errors while listing records from etcd |
| `auto_dns_webui_mcp_tool_calls_total` | counter | `tool` | MCP tool invocations by tool name |

Example scrape config:

```yaml
scrape_configs:
  - job_name: auto-dns-webui
    static_configs:
      - targets: ["auto-dns-webui:8080"]
```

---

## Development

Open the project in VS Code and reopen in the Dev Container — it includes an etcd instance. Seed it with test records:

```bash
scripts/seed-etcd.sh
```

Then start the dev server (Vite + Go backend with hot-reload):

```bash
make dev    # Vite on :5173, Go backend on :8080 (dev mode)
```

Other make targets:

```bash
make prod       # Full production build (embeds frontend into binary)
make build      # Go binary only (dev tags, no frontend)
```

To inspect etcd directly inside the container:

```bash
etcdctl --endpoints http://etcd:2379 get --prefix /skydns
```

---

## Roadmap

See [`TODO.md`](./TODO.md) for the roadmap. It indexes the live
[GitHub issues](https://github.com/auto-dns/auto-dns-webui/issues) and
[milestones](https://github.com/auto-dns/auto-dns-webui/milestones) (the source
of truth) and captures longer-term ideas.

---

## License

Licensed under a custom MIT-NC License — non-commercial use only.
