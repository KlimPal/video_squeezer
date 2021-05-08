Build image:
```
docker build -t klimpal/video_squeezer_converter:latest -f dockerfile ../
```

Run image:
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