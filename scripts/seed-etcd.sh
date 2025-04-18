#!/bin/sh
etcdctl --endpoints=http://etcd:2379 put /skydns/com/domain/foo '{"host":"192.168.1.2"}'
etcdctl --endpoints=http://etcd:2379 put /skydns/dom/carroll/bar '{"host":"192.168.1.3"}'
