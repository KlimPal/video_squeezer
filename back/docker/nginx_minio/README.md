
### Install certificates
```sh
sudo myIp=`sh ./local_ip.sh` NGINX_HTTP_PORT=80 NGINX_HTTPS_PORT=443 domains="minio.video-squeezer.klimpal.com video-squeezer.klimpal.com" email=mail@mail.com ./init_letsencrypt.sh
```
### Start nginx
```sh
sudo \
NGINX_HTTP_PORT=80 \
NGINX_HTTPS_PORT=443 \
myIp=`sh ./local_ip.sh` \
docker-compose -p itc_nginx -f docker-compose.yaml up --build -d
```