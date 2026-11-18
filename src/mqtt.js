import mqtt from 'mqtt';
import { config } from './config.js';
import Device from './models/Device.js';
import Log from './models/Log.js';

let client;

export function connectMqtt() {
  client = mqtt.connect(config.mqttUrl, {
    clientId: 'loomiot-backend',
    username: config.mqttUsername,
    password: config.mqttPassword,
    reconnectPeriod: 2000,
  });

  client.on('connect', () => {
    console.log('[mqtt] bağlandı');
    // Tüm cihazların durum topic'lerini dinle: home/<oda>/<tip>/state
    client.subscribe('home/+/+/state', { qos: 1 }, (err) => {
      if (err) console.error('[mqtt] subscribe hatası:', err.message);
    });
  });

  client.on('reconnect', () => console.log('[mqtt] yeniden bağlanıyor...'));
  client.on('error', (err) => console.error('[mqtt] hata:', err.message));

  client.on('message', async (topic, payload) => {
    try {
      const value = payload.toString().trim();
      const device = await Device.findOneAndUpdate(
        { stateTopic: topic },
        { state: value, lastSeen: new Date() },
        { new: true }
      );
      if (!device) {
        console.warn(`[mqtt] bilinmeyen topic: ${topic}`);
        return;
      }
      await Log.create({ deviceId: device._id, kind: 'state', value, source: 'esp32' });
      console.log(`[mqtt] ${device.name} -> ${value}`);
    } catch (err) {
      console.error('[mqtt] mesaj işlenemedi:', err.message);
    }
  });

  return client;
}

export async function publishCommand(device, action) {
  if (!client || !client.connected) {
    throw new Error('MQTT broker bağlantısı yok');
  }
  await client.publishAsync(device.commandTopic, action, { qos: 1 });
}

export async function disconnectMqtt() {
  if (client) await client.endAsync();
}
