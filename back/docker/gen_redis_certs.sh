#!/bin/bash
mkdir -p redis_certs

openssl genrsa -out ./redis_certs/ca.key 4096
openssl req -x509 -new -sha512 -key ./redis_certs/ca.key -days 3650 -subj '/O=Redis CN=Certificate Authority' -out ./redis_certs/ca.crt
openssl genrsa -out ./redis_certs/redis.key 4096
openssl req -new -sha256 -key ./redis_certs/redis.key -subj '/O=Redis CN=Server' | openssl x509 -req -sha256 -CA ./redis_certs/ca.crt -CAkey ./redis_certs/ca.key -CAserial ./redis_certs/ca.txt -CAcreateserial -days 3650 -out ./redis_certs/redis.crt
chmod 644 ./redis_certs/redis.key
