
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


