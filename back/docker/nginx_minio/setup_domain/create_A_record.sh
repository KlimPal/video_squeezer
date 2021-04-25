set -e

AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
domain=$domain
route53_zone_id=$route53_zone_id


output_path="./A_record.json"
ip=`curl -s ifconfig.me`
action_text=`sed  "s/{{FULL_DOMAIN_NAME}}/${domain}/g" A_record.sample.json | sed "s/{{IP}}/${ip}/g"`
echo  "$action_text"
echo  "$action_text" > $output_path


AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
aws route53 change-resource-record-sets --hosted-zone-id $route53_zone_id --change-batch file://$output_path

