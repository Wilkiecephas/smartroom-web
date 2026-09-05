/**
 * Particle Cloud REST API Integration
 * Manages communication with Spark Core device over Particle Cloud.
 */

export class ParticleApi {
  constructor() {
    this.defaultDeviceId = '54ff74066678574924331067';
    this.defaultToken = 'a0797b36a33322a66526d0580e6fe270a5ade86f';

    this.deviceId = localStorage.getItem('sr_device_id') || this.defaultDeviceId;
    this.token = localStorage.getItem('sr_token') || this.defaultToken;
    this.baseUrl = 'https://api.particle.io/v1/devices';
  }

  setCredentials(deviceId, token) {
    this.deviceId = deviceId || this.defaultDeviceId;
    this.token = token || this.defaultToken;
    localStorage.setItem('sr_device_id', this.deviceId);
    localStorage.setItem('sr_token', this.token);
  }

  getCredentials() {
    return {
      deviceId: this.deviceId,
      token: this.token
    };
  }

  async getDeviceStatus() {
    try {
      const url = `${this.baseUrl}/${this.deviceId}?access_token=${this.token}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        online: data.connected,
        name: data.name,
        lastHeard: data.last_heard,
        platform: data.platform_id === 0 ? 'Spark Core' : 'Particle'
      };
    } catch (err) {
      return { online: false, error: err.message };
    }
  }

  async readVariable(varName) {
    try {
      const url = `${this.baseUrl}/${this.deviceId}/${varName}?access_token=${this.token}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`Failed to read ${varName}: ${res.status}`);
      const data = await res.json();
      return data.result;
    } catch (err) {
      console.warn(`[ParticleApi] ${varName} read error:`, err.message);
      return null;
    }
  }

  async readAllSensors() {
    try {
      // Parallel fetch for speed
      const [temp, hum, dist, motion] = await Promise.all([
        this.readVariable('temp'),
        this.readVariable('hum'),
        this.readVariable('dist'),
        this.readVariable('motion')
      ]);

      return {
        temperature: temp !== null ? Number(temp) : null,
        humidity: hum !== null ? Number(hum) : null,
        distance: dist !== null ? Number(dist) : null,
        motion: motion !== null ? Number(motion) : null,
        timestamp: Date.now()
      };
    } catch (err) {
      console.error('[ParticleApi] Error reading all sensors:', err);
      return null;
    }
  }

  async callFunction(functionName, argument, retryCount = 1) {
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const url = `${this.baseUrl}/${this.deviceId}/${functionName}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            access_token: this.token,
            args: argument
          }),
          signal: AbortSignal.timeout(7000)
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();
        return { success: true, return_value: data.return_value };
      } catch (err) {
        if (attempt === retryCount) {
          console.warn(`[ParticleApi] Function ${functionName} failed after retries:`, err.message);
          return { success: false, error: err.message };
        }
        await new Promise(r => setTimeout(r, 600)); // wait briefly before retry
      }
    }
  }
}

export const particleApi = new ParticleApi();
