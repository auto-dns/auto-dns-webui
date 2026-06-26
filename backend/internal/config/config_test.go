package config

import "testing"

// validConfig returns a Config that passes validate(); tests mutate one field
// at a time to exercise each validation branch.
func validConfig() Config {
	return Config{
		App:  AppConfig{Hostname: "dns1"},
		Etcd: EtcdConfig{Host: "localhost", Port: 2379, PathPrefix: "/skydns"},
		Log:  LoggingConfig{Level: "INFO"},
		MCP:  MCPConfig{Enabled: false, Port: 0},
		Server: ServerConfig{
			Port:  8080,
			Proxy: ProxyConfig{Enable: false, Hostname: "localhost", Port: 5173},
		},
	}
}

func TestValidate_Valid(t *testing.T) {
	c := validConfig()
	if err := c.validate(); err != nil {
		t.Fatalf("expected valid config, got error: %v", err)
	}
}

func TestValidate_LogLevelCaseInsensitive(t *testing.T) {
	c := validConfig()
	c.Log.Level = "debug"
	if err := c.validate(); err != nil {
		t.Fatalf("lowercase log level should be accepted, got: %v", err)
	}
}

func TestValidate_MCPPortRequiredWhenEnabled(t *testing.T) {
	c := validConfig()
	c.MCP.Enabled = true
	c.MCP.Port = 0
	if err := c.validate(); err == nil {
		t.Fatal("expected error when mcp.enabled but mcp.port is invalid")
	}

	c.MCP.Port = 8092
	if err := c.validate(); err != nil {
		t.Fatalf("expected valid config with mcp enabled + port set, got: %v", err)
	}
}

func TestValidate_Errors(t *testing.T) {
	tests := []struct {
		name   string
		mutate func(*Config)
	}{
		{"empty app hostname", func(c *Config) { c.App.Hostname = "" }},
		{"empty etcd host", func(c *Config) { c.Etcd.Host = "" }},
		{"etcd port zero", func(c *Config) { c.Etcd.Port = 0 }},
		{"etcd port too high", func(c *Config) { c.Etcd.Port = 70000 }},
		{"empty path prefix", func(c *Config) { c.Etcd.PathPrefix = "" }},
		{"invalid log level", func(c *Config) { c.Log.Level = "VERBOSE" }},
		{"empty proxy hostname", func(c *Config) { c.Server.Proxy.Hostname = "" }},
		{"proxy port zero", func(c *Config) { c.Server.Proxy.Port = 0 }},
		{"server port too high", func(c *Config) { c.Server.Port = 99999 }},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := validConfig()
			tt.mutate(&c)
			if err := c.validate(); err == nil {
				t.Fatalf("%s: expected validation error, got nil", tt.name)
			}
		})
	}
}
