# curl -X GET \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huZG9lQGV4YW1wbGUuY29tIn0.PXfHR8q91MlP9ZQ3ID5qa8dRQE6lEcNwf0aJKTUNHxw" \
#   -H "Host: api.192.168.49.2.nip.io" \
#   -d '{
#         "email": "johndoe@example.com",
#         "password": "securepassword123"
#       }' \
#   http://192.168.49.2/user/me
while true; do
  curl -X GET \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJqb2huZG9lQGV4YW1wbGUuY29tIn0.PXfHR8q91MlP9ZQ3ID5qa8dRQE6lEcNwf0aJKTUNHxw" \
    -H "Host: api.192.168.49.2.nip.io" \
    -d '{
          "email": "johndoe@example.com",
          "password": "securepassword123"
        }' \
    http://192.168.49.2/user/recommendations
  sleep 0.05
done