import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import { connectDb } from './db.js';
import { connectMqtt, disconnectMqtt } from './mqtt.js';
import { requireApiKey } from './middleware/apiKey.js';
import roomsRouter from './routes/rooms.js';
import devicesRouter from './routes/devices.js';

const app = express();
app.set('trust proxy', 1); // Caddy gibi bir reverse proxy arkasında çalışıyoruz
app.use(express.json({ limit: '10kb' }));

// Sağlık kontrolü (API anahtarı gerektirmez)
app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/api', requireApiKey);
app.use('/api/rooms', roomsRouter);
app.use('/api/devices', devicesRouter);

// Hata yakalayıcı
app.use((err, req, res, next) => {
  console.error('[api] hata:', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

await connectDb();
connectMqtt();

const server = app.listen(config.port, () => {
  console.log(`[api] port ${config.port} (${config.nodeEnv})`);
});

// Docker durdururken düzgün kapan
async function shutdown(signal) {
  console.log(`[app] ${signal} alındı, kapanıyor...`);
  server.close();
  try {
    await disconnectMqtt();
    await mongoose.disconnect();
  } finally {
    process.exit(0);
  }
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
