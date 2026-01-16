#!/bin/bash
set -euo pipefail
echo "=== chittycore Onboarding ==="
curl -s -X POST "${GETCHITTY_ENDPOINT:-https://get.chitty.cc/api/onboard}" \
  -H "Content-Type: application/json" \
  -d '{"service_name":"chittycore","organization":"CHITTYOS","type":"library","tier":2,"domains":["core.chitty.cc"]}' | jq .
