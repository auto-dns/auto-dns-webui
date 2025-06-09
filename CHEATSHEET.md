## Curling etcd

### Health

```bash
curl -L etcd:2379/health
```

### Version

```bash
curl -L etcd:2379/version
```

### Put key-value pair

```bash
curl -L etcd:2379/v3/kv/put -X POST -d '{"key":"dGVzdA==","value":"aGVsbG8gd29ybGQ="}'
```

### Get key-value pair

```bash
curl -L etcd:2379/v3/kv/range -X POST -d '{"key":"L3NreWRucy9jb20vZG9tYWluL2Zvbwo="}'
```

### List all keys

```bash
curl -L http://etcd:2379/v3/kv/range -X POST -d '{"key":"","range_end":"\\0"}'
```
