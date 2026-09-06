/**
 * Vercel Serverless Function — Device Self-Registration
 * POST /api/register — IoT devices call this to auto-register
 * GET  /api/register?since=<ts> — dashboard polls to discover new devices
 *
 * Storage: Vercel KV (when configured) or in-memory (resets on cold start).
 * Part of SMART IOT HUB • Built by TekStep Apps Uganda (tekstepapps.org)
 */

// In-memory store (use Vercel KV in production: npm install @vercel/kv)
const deviceStore = {};

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // POST /api/register — device self-registration
  if (req.method === 'POST') {
    const payload = req.body;

    if (!payload || !payload.id) {
      return res.status(400).json({ error: 'Missing required field: id' });
    }

    deviceStore[payload.id] = {
      ...payload,
      registeredAt: Date.now(),
      lastSeen: Date.now()
    };

    console.log(`[SmartRoom API] Registered device: ${payload.id} (${payload.name})`);
    return res.status(200).json({ success: true, id: payload.id, message: 'Device registered successfully.' });
  }

  // GET /api/register?since=<timestamp> — poll for new registrations
  if (req.method === 'GET') {
    const since = parseInt(req.query?.since || '0', 10);
    const devices = Object.values(deviceStore).filter(d => d.registeredAt >= since);
    return res.status(200).json({ devices, ts: Date.now() });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
