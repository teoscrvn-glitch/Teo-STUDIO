#!/usr/bin/env sh
set -eu
URL=${1:-https://teostudio.top/api/health}
if ! command -v curl >/dev/null 2>&1 || ! command -v node >/dev/null 2>&1; then
  echo 'Need curl and Node.js. Termux: pkg install curl nodejs' >&2; exit 2
fi
printf 'Checking %s\n' "$URL"
JSON=$(curl --fail --silent --show-error --max-time 15 "$URL") || { echo 'FAIL: endpoint did not return HTTP success.' >&2; exit 1; }
printf '%s' "$JSON" | node -e '
let s="";process.stdin.setEncoding("utf8");process.stdin.on("data",x=>s+=x);process.stdin.on("end",()=>{try{const x=JSON.parse(s);console.log("Version:",x.version||"unknown");console.log("D1 reachable:",!!x.config?.d1);console.log("Turnstile:",x.config?.turnstileConfigured?"configured":"MISSING");console.log("SePay:",x.config?.sepayConfigured?"configured":"MISSING");console.log("AI:",x.config?.aiConfigured?"configured":"not configured");console.log("Email:",x.config?.emailConfigured?"configured":"not configured");console.log("Telegram:",x.config?.telegramConfigured?"configured":"not configured");if(x.payment?.missing?.length)console.log("Missing SePay vars:",x.payment.missing.join(", "));for(const k of ["turnstile","sepay","ai","email","telegram"])if(x.config?.[k+"Missing"]?.length)console.log("Missing "+k+" vars:",x.config[k+"Missing"].join(", "));}catch{console.error("FAIL: response was not valid JSON");process.exitCode=1}})'
