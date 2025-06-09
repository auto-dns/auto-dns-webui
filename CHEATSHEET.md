## Curling etcd

### Endpoint status

```bash
etcdctl --endpoints http://etcd:2379 endpoint status
```

### Version

```bash
etcdctl --endpoints http://etcd:2379 version
```

### Get key-value pair

```bash
etcdctl --endpoints http://etcd:2379 get --prefix /skydns/com/domain/foo
```

### List all key-value pairs

```bash
etcdctl --endpoints http://etcd:2379 get --prefix /
```
