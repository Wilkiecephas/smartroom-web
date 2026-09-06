const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/devices.json');

function loadDevices() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (e) {
    // If file doesn't exist or is malformed, start with empty array
    return [];
  }
}

function saveDevices(devices) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(devices, null, 2), 'utf-8');
}

function addDevice(device) {
  const devices = loadDevices();
  devices.push({ ...device, registeredAt: Date.now() });
  saveDevices(devices);
  return device;
}

function getAllDevices() {
  return loadDevices();
}

module.exports = {
  addDevice,
  getAllDevices,
};
