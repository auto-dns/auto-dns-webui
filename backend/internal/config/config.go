package config

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	App    AppConfig     `mapstructure:"app"`
	Etcd   EtcdConfig    `mapstructure:"etcd"`
	Log    LoggingConfig `mapstructure:"log"`
	MCP    MCPConfig     `mapstructure:"mcp"`
	Server ServerConfig  `mapstructure:"server"`
}

type AppConfig struct {
	Hostname string `mapstructure:"hostname"`
}

type EtcdConfig struct {
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	PathPrefix      string `mapstructure:"path_prefix"`
	HeartbeatPrefix string `mapstructure:"heartbeat_prefix"`
}

type LoggingConfig struct {
	Level string `mapstructure:"level"`
}

type ServerConfig struct {
	Port  int         `mapstructure:"port"`
	Proxy ProxyConfig `mapstructure:"proxy"`
}

type ProxyConfig struct {
	Enable   bool   `mapstructure:"enable"`
	Hostname string `mapstructure:"hostname"`
	Port     int    `mapstructure:"port"`
}

type MCPConfig struct {
	Enabled bool `mapstructure:"enabled"`
	Port    int  `mapstructure:"port"`
}

func Load() (*Config, error) {
	if err := initConfig(); err != nil {
		return nil, err
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unable to decode into struct: %w", err)
	}

	if err := cfg.validate(); err != nil {
		return nil, fmt.Errorf("invalid config: %w", err)
	}

	return &cfg, nil
}

func initConfig() error {
	// Respect the --config CLI flag if set
	if cfgFile := viper.GetString("config"); cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		// Default config file name
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")

		// Add common config paths
		if configDir, err := os.UserConfigDir(); err == nil {
			viper.AddConfigPath(filepath.Join(configDir, "auto-dns-webui"))
		}
		viper.AddConfigPath("/etc/auto-dns-webui")
		viper.AddConfigPath("/config")
		viper.AddConfigPath(".")
	}

	// Environment variable support
	viper.SetEnvPrefix("AUTO_DNS_WEBUI")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Set Viper defaults
	viper.SetDefault("app.hostname", "")
	viper.SetDefault("etcd.host", "localhost")
	viper.SetDefault("etcd.port", 2379)
	viper.SetDefault("etcd.path_prefix", "/skydns")
	viper.SetDefault("etcd.heartbeat_prefix", "/docker-coredns-sync/heartbeat")
	viper.SetDefault("log.level", "INFO")
	viper.SetDefault("mcp.enabled", false)
	viper.SetDefault("mcp.port", 0)
	viper.SetDefault("server.port", 8080)
	viper.SetDefault("server.proxy.enable", false)
	viper.SetDefault("server.proxy.hostname", "localhost")
	viper.SetDefault("server.proxy.port", 5173)

	// Read config file if it exists
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return fmt.Errorf("error reading config file: %w", err)
		}
	}

	return nil
}

// prefixesOverlap reports whether one etcd key prefix is contained within the
// other once normalized with a trailing slash (so "/a" and "/ab" don't count
// as overlapping, but "/a" and "/a/b" do).
func prefixesOverlap(a, b string) bool {
	a = strings.TrimSuffix(a, "/") + "/"
	b = strings.TrimSuffix(b, "/") + "/"
	return strings.HasPrefix(a, b) || strings.HasPrefix(b, a)
}

// validate checks for config consistency.
func (c *Config) validate() error {
	if c.App.Hostname == "" {
		return fmt.Errorf("app.hostname cannot be empty")
	}
	if c.Etcd.Host == "" {
		return fmt.Errorf("etcd.host cannot be empty")
	}
	if c.Etcd.Port <= 0 || c.Etcd.Port > 65535 {
		return fmt.Errorf("etcd.port must be a valid TCP port")
	}
	if c.Etcd.PathPrefix == "" {
		return fmt.Errorf("etcd.path_prefix cannot be empty")
	}
	if c.Etcd.HeartbeatPrefix == "" {
		return fmt.Errorf("etcd.heartbeat_prefix cannot be empty")
	}
	// The DNS-record prefix and the producer's heartbeat prefix must be
	// disjoint: if one contained the other, record reads and heartbeat reads
	// would see each other's keys (mirrors docker-coredns-sync's own guard).
	if prefixesOverlap(c.Etcd.PathPrefix, c.Etcd.HeartbeatPrefix) {
		return fmt.Errorf("etcd.path_prefix (%q) and etcd.heartbeat_prefix (%q) must not overlap", c.Etcd.PathPrefix, c.Etcd.HeartbeatPrefix)
	}
	validLevels := map[string]struct{}{
		"TRACE": {}, "DEBUG": {}, "INFO": {}, "WARN": {}, "ERROR": {}, "FATAL": {},
	}
	if _, ok := validLevels[strings.ToUpper(c.Log.Level)]; !ok {
		return fmt.Errorf("log.level must be a valid log level, got: %s", c.Log.Level)
	}
	if c.Server.Proxy.Hostname == "" {
		return fmt.Errorf("proxy.hostname cannot be empty")
	}
	if c.Server.Proxy.Port <= 0 || c.Server.Proxy.Port > 65535 {
		return fmt.Errorf("proxy.port must be a valid TCP port")
	}
	if c.Server.Port <= 0 || c.Server.Port > 65535 {
		return fmt.Errorf("server.port must be a valid TCP port")
	}
	if c.MCP.Enabled && (c.MCP.Port <= 0 || c.MCP.Port > 65535) {
		return fmt.Errorf("mcp.port must be a valid TCP port when mcp.enabled is true")
	}
	return nil
}
