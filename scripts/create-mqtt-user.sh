#!/usr/bin/env bash
# Kullanım: ./scripts/create-mqtt-user.sh <kullanici> <sifre>
# Mosquitto şifre dosyasını oluşturur / kullanıcı ekler (varsa şifresini günceller).
set -euo pipefail

USER_NAME="${1:?Kullanım: $0 <kullanici> <sifre>}"
PASS="${2:?Kullanım: $0 <kullanici> <sifre>}"
DIR="$(cd "$(dirname "$0")/.." && pwd)/mosquitto/config"

docker run --rm --user root \
  -v "$DIR:/mosquitto/config" \
  -e MQ_USER="$USER_NAME" -e MQ_PASS="$PASS" \
  --entrypoint sh eclipse-mosquitto:2 -c '
    touch /mosquitto/config/passwd
    mosquitto_passwd -b /mosquitto/config/passwd "$MQ_USER" "$MQ_PASS"
    chown 1883:1883 /mosquitto/config/passwd
    chmod 0640 /mosquitto/config/passwd
  '

echo "Kullanıcı '$USER_NAME' eklendi/güncellendi."
