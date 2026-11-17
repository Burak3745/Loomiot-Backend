import 'dotenv/config';

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/ev-otomasyonu',
  mqttUrl: process.env.MQTT_URL || 'mqtt://localhost:1883',
  mqttUsername: process.env.MQTT_USERNAME || undefined,
  mqttPassword: process.env.MQTT_PASSWORD || undefined,
  apiKey: process.env.API_KEY || '',
};

// Production'da API anahtarı olmadan açılmasına izin verme.
if (config.nodeEnv === 'production' && !config.apiKey) {
  console.error('[config] HATA: production modunda API_KEY tanımlı olmalı');
  process.exit(1);
}
