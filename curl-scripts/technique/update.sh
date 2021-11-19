#!/bin/bash

API="http://localhost:4741"
URL_PATH="/techniques"

curl "${API}${URL_PATH}/${ID}" \
  --include \
  --request PATCH \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "technique": {
      "name": "'"${NAME}"'",
      "timing": "'"${TIMING}"'",
      "direction": "'"${DIRECTION}"'"
    }
  }'

echo
