import mongoose from 'mongoose';
import { connectDb } from './db.js';
import Room from './models/Room.js';
import Device from './models/Device.js';
import Log from './models/Log.js';

await connectDb();

// Eski şemadan kalma cihazlar (room alanı düz metin) varsa temizle.
const legacy = await Device.collection.find({ room: { $type: 'string' } }).project({ _id: 1 }).toArray();
if (legacy.length > 0) {
  const ids = legacy.map((d) => d._id);
  await Log.deleteMany({ deviceId: { $in: ids } });
  await Device.collection.deleteMany({ _id: { $in: ids } });
  console.log(`[seed] eski şemadan ${legacy.length} cihaz temizlendi`);
}

const room = await Room.findOneAndUpdate(
  { slug: 'burak-oda' },
  { $setOnInsert: { name: 'Burak-Oda', slug: 'burak-oda' } },
  { upsert: true, new: true }
);

const defaults = [
  { name: 'Burak-Oda-Tavan-Işık', type: 'light' },
  { name: 'Burak-Oda-Stor-Perde', type: 'curtain' },
  { name: 'Projeksiyon', type: 'projector' },
];

for (const d of defaults) {
  const key = d.type;
  await Device.updateOne(
    { commandTopic: `home/${room.slug}/${key}/set` },
    {
      $setOnInsert: {
        name: d.name,
        type: d.type,
        room: room._id,
        key,
        commandTopic: `home/${room.slug}/${key}/set`,
        stateTopic: `home/${room.slug}/${key}/state`,
      },
    },
    { upsert: true }
  );
}

console.log('[seed] tamam');
await mongoose.disconnect();
