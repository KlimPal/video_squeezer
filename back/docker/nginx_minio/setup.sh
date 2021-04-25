set -e

default_minio_server_id=`curl -s ifconfig.me | sed 's/\./-/g'`


minio_server_id=${minio_server_id:-$default_minio_server_id}
route53_zone_id=${route53_zone_id:-"Z06617492P5QTX4ASA7L6"}
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID:-"AKIAZMIUIX4XORZBWU55"}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY:-"..."}
HTTPS_PORT=${HTTPS_PORT:-8443}
docker_compose_flags=${docker_compose_flags:-""}
base_domain=${base_domain:-"minio.video-squeezer.klimpal.com"}

MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY:-"default"}

default_MINIO_SECRET_KEY=`openssl rand -base64 18 | tr '+/' '00'`
MINIO_SECRET_KEY=${MINIO_SECRET_KEY:-$default_MINIO_SECRET_KEY}

domain="${minio_server_id}.${base_domain}"

AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
NGINX_HTTPS_PORT=$HTTPS_PORT \
domains=$domain \
email=mail@mail.com \
./init_letsencrypt.sh

cd setup_domain

domain=$domain \
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
route53_zone_id=$route53_zone_id \
sh create_A_record.sh 
cd ../


NGINX_HTTPS_PORT=$HTTPS_PORT \
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
MINIO_ACCESS_KEY=$MINIO_ACCESS_KEY \
MINIO_SECRET_KEY=$MINIO_SECRET_KEY \
docker-compose -p minio_nginx -f docker-compose.yaml up --build $docker_compose_flags

echo "HOST: ${domain}"
echo "PORT: ${HTTPS_PORT}"
echo "URL: https://${domain}:${HTTPS_PORT}"
echo "ACCESS_KEY: ${MINIO_ACCESS_KEY}"
echo "SECRET_KEY: ${MINIO_SECRET_KEY}"

