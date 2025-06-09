package dns

import "time"

type Record struct {
	Dns  DnsRecord      `json:"dnsRecord"`
	Meta RecordMetadata `json:"metadata"`
}

type DnsRecord struct {
	Name  string `json:"name"`
	Type  string `json:"type"`  // A or CNAME
	Value string `json:"value"` // IP or hostname
}

type RecordMetadata struct {
	ContainerID   string    `json:"containerId"`
	ContainerName string    `json:"containerName"`
	Created       time.Time `json:"created"`
	Hostname      string    `json:"hostname"`
	Force         bool      `json:"force"`
}
