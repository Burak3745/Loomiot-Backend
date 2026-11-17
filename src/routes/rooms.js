import { Router } from 'express';
import Room from '../models/Room.js';
import Device from '../models/Device.js';
import Log from '../models/Log.js';
import { validId } from '../middleware/validId.js';
import { slugify, SLUG_RE } from '../utils/slug.js';

const router = Router();

// Tüm odalar
router.get('/', async (req, res) => {
  const rooms = await Room.find().sort({ name: 1 });
  res.json(rooms);
});

// Tek oda + içindeki cihazlar
router.get('/:id', validId, async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Oda bulunamadı' });
  const devices = await Device.find({ room: room._id }).sort({ name: 1 });
  res.json({ ...room.toObject(), devices });
});

// Oda ekle: { "name": "Yatak Odası" }  (opsiyonel: "slug")
router.post('/', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'name zorunlu' });

  const slug = slugify(name);
  if (!SLUG_RE.test(slug)) {
    return res.status(400).json({ error: 'Geçersiz slug. Sadece küçük harf, rakam ve tire kullanılabilir' });
  }

  try {
    const room = await Room.create({ name, slug });
    res.status(201).json(room);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Oda adı zaten kullanılıyor` });
    }
    throw err;
  }
});

// Oda güncelle: { "name": "Yeni İsim" }
// Not: slug değişmez, böylece ESP32'deki topic'ler bozulmaz.
router.patch('/:id', validId, async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'name zorunlu' });

  const room = await Room.findByIdAndUpdate(req.params.id, { name }, { new: true });
  if (!room) return res.status(404).json({ error: 'Oda bulunamadı' });
  res.json(room);
});

// Oda sil. İçinde cihaz varsa ?force=true gerekir (cihazlar ve logları da silinir).
router.delete('/:id', validId, async (req, res) => {
  const room = await Room.findById(req.params.id);
  if (!room) return res.status(404).json({ error: 'Oda bulunamadı' });

  const devices = await Device.find({ room: room._id }).select('_id');
  if (devices.length > 0) {
    if (req.query.force !== 'true') {
      return res.status(409).json({
        error: `Odada ${devices.length} cihaz var. Cihazlarla birlikte silmek için ?force=true kullan`,
        deviceCount: devices.length,
      });
    }
    await Log.deleteMany({ deviceId: { $in: devices.map((d) => d._id) } });
    await Device.deleteMany({ room: room._id });
  }

  await room.deleteOne();
  res.status(204).end();
});

export default router;
