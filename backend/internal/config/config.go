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
	Server ServerConfig  `mapstructure:"server"`
}

type AppConfig struct {
	Hostname string `mapstructure:"hostname"`
}

type EtcdConfig struct {
	Host              string  `mapstructure:"host"`
	Port              int     `mapstructure:"port"`
	PathPrefix        string  `mapstructure:"path_prefix"`
	LockTTL           float64 `mapstructure:"lock_ttl"`
	LockTimeout       float64 `mapstructure:"lock_timeout"`
	LockRetryInterval float64 `mapstructure:"lock_retry_interval"`
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
	viper.SetDefault("etcd.lock_ttl", 5.0)
	viper.SetDefault("etcd.lock_timeout", 2.0)
	viper.SetDefault("etcd.lock_retry_interval", 0.1)
	viper.SetDefault("log.level", "INFO")
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
	if c.Etcd.LockTTL <= 0 {
		return fmt.Errorf("etcd.lock_ttl must be > 0")
	}
	if c.Etcd.LockTimeout <= 0 {
		return fmt.Errorf("etcd.lock_timeout must be > 0")
	}
	if c.Etcd.LockRetryInterval <= 0 {
		return fmt.Errorf("etcd.lock_retry_interval must be > 0")
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
	return nil
}
