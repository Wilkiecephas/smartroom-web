const path = require('path');
const { addDevice, getAllDevices } = require('../utils/deviceStore');

/**
 * API handler for managing sensor devices.
 * POST   /api/devices   – register a new device (JSON body {type, config})
 * GET    /api/devices   – list all registered devices
 */
module.exports = async function handler(req, res) {
  // CORS headers (allow local dev)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const payload = req.body;
    if (!payload || !payload.type) {
      return res.status(400).json({ error: 'Missing required fields (type, config)' });
    }
    // payload expected: { type: 'ble'|'mqtt'|'websocket'|'smartwatch', config: { ... } }
    const device = addDevice({ type: payload.type, config: payload.config || {} });
    return res.status(200).json({ success: true, device });
  }

  if (req.method === 'GET') {
    const devices = getAllDevices();
    return res.status(200).json({ devices });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
