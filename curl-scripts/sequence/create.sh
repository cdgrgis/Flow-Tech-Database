#!/bin/bash

API="http://localhost:4741"
URL_PATH="/sequences"

curl "${API}${URL_PATH}" \
  --include \
  --request POST \
  --header "Content-Type: application/json" \
  --header "Authorization: Bearer ${TOKEN}" \
  --data '{
    "sequence": {
      "name": "'"${NAME}"'",
      "techniques": [
        "'"${TECH1}"'",
        "'"${TECH2}"'"
      ]
    }
  }'

echo
