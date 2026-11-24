#!/bin/bash
# Kontrolle der Querschnittswerte: unabhängige Python-Rechnung gegen die gebaute App (dist/).
#
# Voraussetzungen: npm run build, python3 mit numpy, node, google-chrome.
# Aufruf aus dem Projektordner:  bash tools/kontrolle/kontrolle.sh
# (In Claude Code außerhalb der Sandbox starten: headless Chrome stürzt in der Sandbox ab.)
set -u
HIER="$(cd "$(dirname "$0")" && pwd)"
PROJEKT="$(cd "$HIER/../.." && pwd)"
AUS="$(mktemp -d "${TMPDIR:-/tmp}/duennqs-kontrolle.XXXXXX")"

python3 "$HIER/faelle.py" "$AUS/faelle.json" || exit 1

cd "$PROJEKT"
npx vite preview --port 4173 --strictPort --host 127.0.0.1 >"$AUS/vite.log" 2>&1 & VP=$!
sleep 3
# frisches Profil: sonst liefert der Service Worker evtl. eine ältere Version aus dem Cache
google-chrome --headless=new --remote-debugging-port=9333 --user-data-dir="$AUS/profil" --no-first-run \
    --disable-gpu about:blank >"$AUS/chrome.log" 2>&1 & CP=$!
timeout 300 node "$HIER/browser.mjs" "$AUS/faelle.json" "$AUS/duennqs.json"
kill $CP 2>/dev/null; pkill -P $VP 2>/dev/null; kill $VP 2>/dev/null

python3 "$HIER/vergleich.py" "$AUS/faelle.json" "$AUS/duennqs.json" | tee "$AUS/vergleich.txt"
ERG=${PIPESTATUS[0]}
echo "Ergebnisse in $AUS"
exit $ERG
