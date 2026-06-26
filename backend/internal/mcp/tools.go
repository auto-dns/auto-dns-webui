package mcphandler

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/auto-dns/auto-dns-webui/internal/dns"
	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"
)

// --- Output types ---

type dnsRecordOut struct {
	Name          string `json:"name"`
	Type          string `json:"type"`
	Value         string `json:"value"`
	Hostname      string `json:"hostname"`
	ContainerName string `json:"containerName"`
	ContainerID   string `json:"containerId"`
	Created       string `json:"created"`
	Force         bool   `json:"force"`
}

type listRecordsOut struct {
	Total   int            `json:"total"`
	Records []dnsRecordOut `json:"records"`
}

// --- Helpers ---

func jsonText(v any) *mcp.CallToolResult {
	data, err := json.Marshal(v)
	if err != nil {
		return mcp.NewToolResultError(fmt.Sprintf("failed to marshal result: %v", err))
	}
	return mcp.NewToolResultText(string(data))
}

func toRecordOut(r *dns.Record) dnsRecordOut {
	return dnsRecordOut{
		Name:          r.Dns.Name,
		Type:          r.Dns.Type,
		Value:         r.Dns.Value,
		Hostname:      r.Meta.Hostname,
		ContainerName: r.Meta.ContainerName,
		ContainerID:   r.Meta.ContainerID,
		Created:       r.Meta.Created.UTC().Format(time.RFC3339),
		Force:         r.Meta.Force,
	}
}

// --- Tool registration ---

func registerTools(s *server.MCPServer, d Deps) {
	s.AddTool(mcp.NewTool("list_dns_records",
		mcp.WithDescription("List all DNS records registered in etcd. Optionally filter by name substring, record type (A/AAAA/CNAME), or the hostname of the docker-coredns-sync node that registered them."),
		mcp.WithString("name", mcp.Description("Substring to match against the DNS name (case-insensitive).")),
		mcp.WithString("type", mcp.Description(`Record type filter: "A", "AAAA", or "CNAME".`)),
		mcp.WithString("hostname", mcp.Description("Exact hostname of the docker-coredns-sync node that registered the record.")),
	), instrument(d, "list_dns_records", makeListDNSRecords(d)))

	s.AddTool(mcp.NewTool("get_dns_record",
		mcp.WithDescription("Look up all DNS records for an exact fully-qualified domain name (FQDN). Returns a list — the same FQDN may have multiple records (e.g. two A records from different containers)."),
		mcp.WithString("name", mcp.Required(), mcp.Description("Exact FQDN to look up (e.g. myservice.home.example.com).")),
	), instrument(d, "get_dns_record", makeGetDNSRecord(d)))

	s.AddTool(mcp.NewTool("get_records_by_host",
		mcp.WithDescription("Get all DNS records registered by a specific docker-coredns-sync node, identified by hostname."),
		mcp.WithString("hostname", mcp.Required(), mcp.Description("Exact hostname of the docker-coredns-sync node (e.g. homeserver).")),
	), instrument(d, "get_records_by_host", makeGetRecordsByHost(d)))
}

// instrument wraps a tool handler to count invocations under its tool name.
func instrument(d Deps, name string, next server.ToolHandlerFunc) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		if d.Metrics != nil {
			d.Metrics.RecordMCPToolCall(name)
		}
		return next(ctx, req)
	}
}

// --- Tool handlers ---

func makeListDNSRecords(d Deps) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		records, err := d.Registry.List(ctx)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("error listing DNS records: %v", err)), nil
		}

		nameFilter := strings.ToLower(req.GetString("name", ""))
		typeFilter := strings.ToUpper(req.GetString("type", ""))
		hostFilter := req.GetString("hostname", "")

		out := listRecordsOut{Records: []dnsRecordOut{}}
		for _, r := range records {
			if nameFilter != "" && !strings.Contains(strings.ToLower(r.Dns.Name), nameFilter) {
				continue
			}
			if typeFilter != "" && r.Dns.Type != typeFilter {
				continue
			}
			if hostFilter != "" && r.Meta.Hostname != hostFilter {
				continue
			}
			out.Records = append(out.Records, toRecordOut(r))
		}
		out.Total = len(out.Records)
		return jsonText(out), nil
	}
}

func makeGetDNSRecord(d Deps) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		name := req.GetString("name", "")

		records, err := d.Registry.List(ctx)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("error fetching DNS records: %v", err)), nil
		}

		target := strings.TrimSuffix(strings.ToLower(name), ".")
		out := listRecordsOut{Records: []dnsRecordOut{}}
		for _, r := range records {
			if strings.TrimSuffix(strings.ToLower(r.Dns.Name), ".") == target {
				out.Records = append(out.Records, toRecordOut(r))
			}
		}
		out.Total = len(out.Records)
		return jsonText(out), nil
	}
}

func makeGetRecordsByHost(d Deps) server.ToolHandlerFunc {
	return func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		hostname := req.GetString("hostname", "")
		if hostname == "" {
			return mcp.NewToolResultError("hostname is required"), nil
		}

		records, err := d.Registry.List(ctx)
		if err != nil {
			return mcp.NewToolResultError(fmt.Sprintf("error fetching DNS records: %v", err)), nil
		}

		out := listRecordsOut{Records: []dnsRecordOut{}}
		for _, r := range records {
			if r.Meta.Hostname == hostname {
				out.Records = append(out.Records, toRecordOut(r))
			}
		}
		out.Total = len(out.Records)
		return jsonText(out), nil
	}
}
