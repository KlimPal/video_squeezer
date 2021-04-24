
### Install certificates
```sh
AWS_ACCESS_KEY_ID= \
AWS_SECRET_ACCESS_KEY= \
NGINX_HTTP_PORT=80 NGINX_HTTPS_PORT=443 \
domains="1.minio.video-squeezer.klimpal.com" \
email=mail@mail.com \
./init_letsencrypt.sh
```
### Start nginx
```sh
sudo \
NGINX_HTTP_PORT=80 \
NGINX_HTTPS_PORT=443 \
myIp=`sh ./local_ip.sh` \
docker-compose -p minio_nginx -f docker-compose.yaml up --build -d
```