import mongoose from 'mongoose';
import { DEVICE_TYPES } from '../deviceTypes.js';

const deviceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.keys(DEVICE_TYPES), required: true },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
    // Topic'in son kısmını belirler. Varsayılan: cihaz tipi (light, curtain, projector).
    // Aynı odada aynı tipten ikinci cihaz için farklı key gerekir (örn. light2).
    key: { type: String, required: true },
    // Backend -> ESP32 (komut)
    commandTopic: { type: String, required: true, unique: true },
    // ESP32 -> Backend (gerçek durum)
    stateTopic: { type: String, required: true, unique: true },
    state: { type: String, default: 'UNKNOWN' },
    lastSeen: { type: Date },
  },
  { timestamps: true }
);

deviceSchema.index({ room: 1, key: 1 }, { unique: true });

export default mongoose.model('Device', deviceSchema);
