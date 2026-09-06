export async function postDevice(device) {
  const response = await fetch('/api/devices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(device)
  });
  return await response.json();
}

export async function fetchDevices() {
  const response = await fetch('/api/devices');
  return await response.json();
}
