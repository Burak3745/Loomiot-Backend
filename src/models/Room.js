import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // MQTT topic'lerinde kullanılır: home/<slug>/<key>/set
    // Oluşturulduktan sonra DEĞİŞMEZ (ESP32'deki topic'ler bozulmasın diye).
    slug: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model('Room', roomSchema);
