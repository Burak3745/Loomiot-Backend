import mongoose from 'mongoose';

const logSchema = new mongoose.Schema(
  {
    deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true, index: true },
    kind: { type: String, enum: ['command', 'state'], required: true },
    value: { type: String, required: true },
    source: { type: String, default: 'api' }, // api | esp32
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export default mongoose.model('Log', logSchema);
