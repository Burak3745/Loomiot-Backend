import crypto from 'node:crypto';
import { config } from '../config.js';

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();

// İstemci her istekte "x-api-key" header'ı göndermeli.
// API_KEY tanımlı değilse (sadece geliştirmede) kontrol atlanır.
export function requireApiKey(req, res, next) {
  if (!config.apiKey) return next();

  const provided = req.get('x-api-key') ?? '';
  // Sabit sürede karşılaştırma (timing saldırılarına karşı)
  if (!crypto.timingSafeEqual(sha256(provided), sha256(config.apiKey))) {
    return res.status(401).json({ error: 'Yetkisiz' });
  }
  next();
}
