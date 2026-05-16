# auto-dns-webui

A read-only web UI and optional MCP server for browsing DNS records stored in etcd by [docker-coredns-sync](https://github.com/auto-dns/docker-coredns-sync). It presents all A/CNAME records registered in CoreDNS-compatible SkyDNS format as a searchable table.

It optionally exposes an MCP (Model Context Protocol) server so AI tools like Claude can query the live DNS record set.

---

## Features

- Browse all A/AAAA/CNAME records registered in etcd (SkyDNS format)
- Filter by name, type, or source host
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

## License

Licensed under a custom MIT-NC License — non-commercial use only.
