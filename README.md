# Ev Otomasyonu

Node.js + MongoDB + MQTT (Mosquitto) ile ESP32 kontrolü: ışık, perde, projeksiyon.

## Local geliştirme

```bash
docker compose up -d        # Mongo + Mosquitto (anonim, sadece local)
cp .env.example .env
npm install
npm run seed
npm run dev
```

## Sunucuya kurulum

1. Sunucuda Docker ve Docker Compose kurulu olmalı. Domain'in A kaydı sunucunun IP'sine bakmalı.
2. Repoyu çek: `git clone <repo-url> && cd loomiot-backend`
3. `.env` oluştur: `cp .env.example .env` ve sunucu bölümündeki değerleri doldur.
4. MQTT kullanıcılarını oluştur (backend ve ESP32 için ayrı):
   ```bash
   ./scripts/create-mqtt-user.sh backend <BACKEND_SIFRESI>   # .env'deki MQTT_BACKEND_PASSWORD ile aynı
   ./scripts/create-mqtt-user.sh esp32 <ESP32_SIFRESI>
   ```
5. Başlat: `docker compose -f docker-compose.prod.yml up -d --build`
6. İlk kurulumda varsayılan oda ve cihazları ekle: `docker compose -f docker-compose.prod.yml exec app node src/seed.js`
7. Güvenlik duvarında 80, 443 ve 1883 portlarını aç (27017 ve 3000 KAPALI kalmalı).

Güncelleme: `git pull && docker compose -f docker-compose.prod.yml up -d --build`

## API

Tüm `/api` istekleri `x-api-key` header'ı ister (`/health` hariç).

```bash
curl https://DOMAIN/api/devices -H "x-api-key: ANAHTAR"
```
