**Demo**: https://video-squeezer.klimpal.com

## Installation for development
Required: docker, node v14, npm, npx

**Frontend**:
```
npm install -g @angular/cli
cd front
npm i
npm start
```
**Backend**:
```
cd back/docker
sh gen_redis_certs.sh
docker-compose -p video_squeezer_dev -f compose-dev.yaml up --build
cd ../
npm i
npm start
```


Install docker: 
```
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo usermod -aG docker $(whoami)
sudo curl -L "https://github.com/docker/compose/releases/download/1.26.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

Add converter worker: 
```
docker run \
--env REDIS_PORT=6379
--env REDIS_HOST=... \
--env REDIS_PASSWORD=... \
--env JOBS_CONCURRENCY=2 \
--env INPUT_QUEUE_NAME=video_converting_input \
--env OUTPUT_QUEUE_NAME=video_converting_output \
--env keyForEncryptingMinioServerKey=... \
klimpal/video_squeezer_converter:latest
```

