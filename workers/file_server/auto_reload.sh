#!/bin/bash

let interval=60*60*6

while true; do
    echo 'Reload nginx config...'
    nginx -s reload

sleep $interval; done &


