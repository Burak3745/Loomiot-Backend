import { Router } from 'express';
import Device from '../models/Device.js';
import Room from '../models/Room.js';
import Log from '../models/Log.js';
import { DEVICE_TYPES } from '../deviceTypes.js';
import { publishCommand } from '../mqtt.js';
import { validId } from '../middleware/validId.js';
import { SLUG_RE } from '../utils/slug.js';
import mongoose from 'mongoose';

const router = Router();

// Tüm cihazlar + son durumları (opsiyonel: ?roomId=...)
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.roomId) {
    if (!mongoose.isValidObjectId(req.query.roomId)) {
      return res.status(400).json({ error: 'Geçersiz roomId' });
    }
    filter.room = req.query.roomId;
  }
  const devices = await Device.find(filter).populate('room', 'name slug').sort({ name: 1 });
  res.json(devices);
});

// Tek cihaz
router.get('/:id', validId, async (req, res) => {
  const device = await Device.findById(req.params.id).populate('room', 'name slug');
  if (!device) return res.status(404).json({ error: 'Cihaz bulunamadı' });
  res.json(device);
});

// Cihaz ekle: { "name": "Salon Işık", "type": "light", "roomId": "...", "key": "light2" (opsiyonel) }
router.post('/', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const type = String(req.body?.type ?? '');
  const roomId = req.body?.roomId;

  if (!name) return res.status(400).json({ error: 'name zorunlu' });
  if (!DEVICE_TYPES[type]) {
    return res.status(400).json({ error: `Geçersiz type. İzin verilenler: ${Object.keys(DEVICE_TYPES).join(', ')}` });
  }
  if (!mongoose.isValidObjectId(roomId)) {
    return res.status(400).json({ error: 'Geçerli bir roomId zorunlu' });
  }

  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ error: 'Oda bulunamadı' });

  const key = req.body?.key ? String(req.body.key).trim().toLowerCase() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (!SLUG_RE.test(key)) {
    return res.status(400).json({ error: 'Geçersiz key. Sadece küçük harf, rakam ve tire kullanılabilir' });
  }

  try {
    const device = await Device.create({
      name,
      type,
      room: room._id,
      key,
      commandTopic: `home/${room.slug}/${key}/set`,
      stateTopic: `home/${room.slug}/${key}/state`,
    });
    res.status(201).json(device);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        error: `Bu odada "${key}" key'i ile zaten bir cihaz var. Farklı bir "key" ver (örn. ${type}2)`,
      });
    }
    throw err;
  }
});

// Cihaz sil (logları da silinir)
router.delete('/:id', validId, async (req, res) => {
  const device = await Device.findById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Cihaz bulunamadı' });

  await Log.deleteMany({ deviceId: device._id });
  await device.deleteOne();
  res.status(204).json({ message: 'Cihaz başarıyla silindi' }).end();
});

// Cihaza komut gönder: { "action": "ON" }
router.post('/:id/command', validId, async (req, res) => {
  const device = await Device.findById(req.params.id);
  if (!device) return res.status(404).json({ error: 'Cihaz bulunamadı' });

  const action = String(req.body?.action ?? '').toUpperCase();
  const allowed = DEVICE_TYPES[device.type];
  if (!allowed.includes(action)) {
    return res.status(400).json({ error: `Geçersiz komut. İzin verilenler: ${allowed.join(', ')}` });
  }

  try {
    await publishCommand(device, action);
  } catch (err) {
    return res.status(503).json({ error: err.message });
  }

  await Log.create({ deviceId: device._id, kind: 'command', value: action, source: 'api' });

  // Durum, ESP32 state topic'ine cevap verince güncellenir.
  res.status(202).json({ status: 'sent', device: device.name, action });
});

// Cihaz geçmişi
router.get('/:id/logs', validId, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  const logs = await Log.find({ deviceId: req.params.id }).sort({ createdAt: -1 }).limit(limit);
  res.json(logs);
});

export default router;
