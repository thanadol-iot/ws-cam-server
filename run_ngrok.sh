#!/bin/bash
if curl -s http://localhost:4040/api/tunnels > /dev/null
then
	#echo "ngrok is running"
	exit 0
fi
# ฟังก์ชันสำหรับดึงลิงก์ ngrok
get_ngrok_link() {
  curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
}

# ฟังก์ชันสำหรับยิง API เพื่อเก็บลิงก์ในฐานข้อมูล
send_link_to_db() {
  local link=$1
  
  curl --location 'https://ebike-dev.giantiot.com/api/v1/ngstorage/create' \
  --header 'Content-Type: application/json' \
  --data "{\"link\": \"$link\"}"
}

send_link_to_camera_server() {
  local link=$1
  
  curl --location 'http://140.99.254.57:8093/stream/seturl' \
  --header 'Content-Type: application/json' \
  --data "{\"url\": \"$link\"}"
}

echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Starting ngrok"
/usr/local/bin/ngrok tcp 192.168.1.100:554 >> ngrok.log 2>&1 &
sleep 10

link=$(get_ngrok_link)
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Ngrok link: $link"
echo "---------------------------------------------------------"

#ส่งลิงก์ไปยัง API เพื่อเก็บในฐานข้อมูล
send_link_to_api "$link"
# ส่งลิงก์ไปยัง API camera server
send_link_to_camera_server "$link"

# #!/bin/bash
# if curl -s http://localhost:4040/api/tunnels > /dev/null
# then
#         exit 0
# fi
# get_ngrok_link() {
#   curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url'
# }

# echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Starting ngrok"

# /usr/local/bin/ngrok tcp 192.168.1.100:554 >> ngrok.log 2>&1 &
# sleep 10

# link=$(get_ngrok_link)
# echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ") - Ngrok link: $link"
# echo "-----------------------------------------------------------------------"
 

