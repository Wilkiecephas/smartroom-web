/**
 * Vercel Serverless Function — Device Telemetry Relay
 * POST /api/telemetry?device=<id> — device posts sensor data
 * GET  /api/telemetry?device=<id> — dashboard polls latest reading
 *
 * Storage: in-memory per cold-start instance (use Vercel KV for persistence).
 * Part of SMART IOT HUB • Built by TekStep Apps Uganda (tekstepapps.org)
 */

// In-memory telemetry store: { deviceId: { payload, ts } }
const telemetryStore = {};

export default function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const deviceId = req.query?.device;

  // POST /api/telemetry?device=<id> — device sends its sensor JSON
  if (req.method === 'POST') {
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing query param: device' });
    }

    telemetryStore[deviceId] = {
      payload: req.body,
      ts: Date.now()
    };

    return res.status(200).json({ success: true, device: deviceId, ts: Date.now() });
  }

  // GET /api/telemetry?device=<id> — dashboard polls for latest data
  if (req.method === 'GET') {
    if (!deviceId) {
      // Return all devices
      return res.status(200).json({ telemetry: telemetryStore, ts: Date.now() });
    }

    const entry = telemetryStore[deviceId];
    if (!entry) {
      return res.status(404).json({ error: 'No telemetry for device', device: deviceId });
    }

    return res.status(200).json(entry);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
