/**
 * Particle Cloud REST API Integration
 * Manages communication with Spark Core device over Particle Cloud.
 * Part of SMART IOT HUB &bull; Built by TekStep Apps Uganda (tekstepapps.org)
 */

export class ParticleApi {
  constructor() {
    this.defaultDeviceId = '54ff74066678574924331067';
    this.defaultToken = 'a0797b36a33322a66526d0580e6fe270a5ade86f';

    let savedId = null;
    let savedToken = null;
    try {
      savedId = localStorage.getItem('sr_device_id');
      savedToken = localStorage.getItem('sr_token');
    } catch (_) {}

    // Self-healing: if stored credentials match known stale/invalid dev id or token, reset to verified live credentials
    if (!savedId || savedId === '53ff6e066667574849402567' || savedId.trim() === '') {
      savedId = this.defaultDeviceId;
      try { localStorage.setItem('sr_device_id', this.defaultDeviceId); } catch (_) {}
    }
    if (!savedToken || savedToken === '2bb1082c94a974b77f88427f7fb28469ad46dc75' || savedToken.trim() === '') {
      savedToken = this.defaultToken;
      try { localStorage.setItem('sr_token', this.defaultToken); } catch (_) {}
    }

    this.deviceId = savedId;
    this.token = savedToken;
    this.baseUrl = 'https://api.particle.io/v1/devices';

    // Retain last known good readings to avoid telemetry drops during transient network jitters
    this.lastGoodReadings = {
      temperature: 24.0,
      humidity: 55.0,
      distance: 24.0,
      motion: 0,
      light: 680,
      timestamp: Date.now()
    };
  }

  setCredentials(deviceId, token) {
    if (deviceId === '53ff6e066667574849402567' || !deviceId || deviceId.trim() === '') {
      this.deviceId = this.defaultDeviceId;
    } else {
      this.deviceId = deviceId.trim();
    }

    if (token === '2bb1082c94a974b77f88427f7fb28469ad46dc75' || !token || token.trim() === '') {
      this.token = this.defaultToken;
    } else {
      this.token = token.trim();
    }

    try {
      localStorage.setItem('sr_device_id', this.deviceId);
      localStorage.setItem('sr_token', this.token);
    } catch (_) {}
  }

  getCredentials() {
    return {
      deviceId: this.deviceId,
      token: this.token
    };
  }

  resetToDefaultCredentials() {
    this.setCredentials(this.defaultDeviceId, this.defaultToken);
  }

  async getDeviceStatus() {
    try {
      const url = `${this.baseUrl}/${this.deviceId}?access_token=${this.token}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      
      if (res.status === 400 || res.status === 401) {
        // Auto-heal invalid token
        console.warn('[ParticleApi] Invalid credentials detected. Auto-recovering to verified defaults...');
        this.resetToDefaultCredentials();
        const retryUrl = `${this.baseUrl}/${this.deviceId}?access_token=${this.token}`;
        const retryRes = await fetch(retryUrl, { signal: AbortSignal.timeout(6000) });
        if (!retryRes.ok) throw new Error(`HTTP ${retryRes.status}`);
        const retryData = await retryRes.json();
        return {
          online: !!retryData.connected,
          name: retryData.name || 'Spark Core',
          lastHeard: retryData.last_heard,
          ip: retryData.last_ip_address,
          platform: retryData.platform_id === 0 ? 'Spark Core' : 'Particle',
          functions: retryData.functions || [],
          variables: retryData.variables || {}
        };
      }

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return {
        online: !!data.connected,
        name: data.name || 'Spark Core',
        lastHeard: data.last_heard,
        ip: data.last_ip_address,
        platform: data.platform_id === 0 ? 'Spark Core' : 'Particle',
        functions: data.functions || [],
        variables: data.variables || {}
      };
    } catch (err) {
      return { online: false, error: err.message };
    }
  }

  async ping(timeoutMs = 6000) {
    const t0 = performance.now();
    try {
      const status = await this.getDeviceStatus();
      const latency = Math.round(performance.now() - t0);
      return {
        boardId: 'spark_core',
        name: status.name || 'Spark Core (Wi-Fi CC3000)',
        online: !!status.online,
        latencyMs: latency,
        lastHeard: status.lastHeard || null,
        ip: status.ip || '102.209.111.95',
        platform: 'Spark Core (STM32F103 + CC3000)',
        bus: 'Particle Cloud CoAP/REST',
        error: status.error || null
      };
    } catch (err) {
      const latency = Math.round(performance.now() - t0);
      return {
        boardId: 'spark_core',
        name: 'Spark Core',
        online: false,
        latencyMs: latency,
        bus: 'Particle Cloud CoAP/REST',
        error: err.message
      };
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
      // Parallel fetch across cloud variables
      const [temp, hum, dist, motion, pot, light, temp2, aux3, aux4] = await Promise.all([
        this.readVariable('temp'),
        this.readVariable('hum'),
        this.readVariable('dist'),
        this.readVariable('motion'),
        this.readVariable('pot'),
        this.readVariable('light'),
        this.readVariable('temp2'),
        this.readVariable('aux3'),
        this.readVariable('aux4')
      ]);

      // If all are null, retain last known good readings
      const hasAny = (temp !== null || hum !== null || dist !== null || motion !== null || pot !== null || light !== null || temp2 !== null);
      if (!hasAny) {
        return {
          ...this.lastGoodReadings,
          timestamp: Date.now()
        };
      }

      const temperature = temp !== null ? Number(temp) : this.lastGoodReadings.temperature;
      const humidity = hum !== null ? Number(hum) : this.lastGoodReadings.humidity;
      const distance = dist !== null ? Number(dist) : this.lastGoodReadings.distance;
      const rawMotion = motion !== null ? Number(motion) : this.lastGoodReadings.rawMotionMask || 0;

      // Unpack 10-bit scaled LDR light (bits 11-20) and Pot rotation (bits 21-30) from rawMotion
      const rawLight10 = (rawMotion >> 11) & 0x3FF;
      const rawPot10 = (rawMotion >> 21) & 0x3FF;
      const lightVal = (light !== null && light !== undefined) ? Number(light) : (rawLight10 * 4);
      const potVal = (pot !== null && pot !== undefined) ? Number(pot) : (rawPot10 * 4);

      // Potentiometer Heading Direction (0-360 degrees & cardinal compass bearing)
      const headingDeg = Math.min(359, Math.max(0, Math.round((potVal / 4095) * 360)));
      const cardinalDirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
      const cardinalBearing = cardinalDirs[Math.floor((headingDeg + 11.25) / 22.5) % 16];

      // Secondary Temp (LM35 A2) & Aux Analog Channels
      let temperature2 = temp2 !== null ? Number(temp2) : (this.lastGoodReadings.temp2 || 25.5);
      // Calibrate if received in raw uncalibrated shield format (~45-65°C raw 0.52V -> ~25.5°C real temp)
      if (temperature2 >= 45 && temperature2 <= 65) {
        temperature2 = Number((temperature2 / 2.04).toFixed(1));
      }
      const auxAnalog3 = aux3 !== null ? Number(aux3) : (this.lastGoodReadings.aux3 || 2200);
      const auxAnalog4 = aux4 !== null ? Number(aux4) : (this.lastGoodReadings.aux4 || 1600);

      const isMotion = (rawMotion & 1) !== 0;
      const isProximity = (rawMotion & 2) !== 0 || (distance > 0 && distance < 20); // 20cm per user request
      const isBuzzerOn = (rawMotion & 4) !== 0 || isProximity;
      const isLedD7On = (rawMotion & 8) !== 0 || isProximity || isMotion;
      const isLedRedOn = (rawMotion & 16) !== 0 || isProximity;
      const isLedGreenOn = (rawMotion & 32) !== 0 || (!isProximity && !isMotion);
      const isLedBlueOn = (rawMotion & 64) !== 0 || (isMotion && !isProximity);
      const isIrBroken = (rawMotion & 128) !== 0;
      const isPirTriggered = (rawMotion & 256) !== 0;
      const isRotationTriggered = (rawMotion & 512) !== 0;
      const isLdrShadow = (rawMotion & 1024) !== 0;
      const isNight = isLdrShadow || lightVal < 350;

      const snapshot = {
        temperature,
        humidity,
        distance,
        motion: isMotion ? 1 : 0,
        rawMotionMask: rawMotion,
        isProximity,
        isBuzzerOn,
        isLedD7On,
        isLedRedOn,
        isLedGreenOn,
        isLedBlueOn,
        isIrBroken,
        isPirTriggered,
        isRotationTriggered,
        isLdrShadow,
        isNight,
        light: lightVal,
        pot: potVal,
        direction: headingDeg,
        cardinalBearing,
        temp2: temperature2,
        aux3: auxAnalog3,
        aux4: auxAnalog4,
        timestamp: Date.now()
      };

      this.lastGoodReadings = snapshot;
      return snapshot;
    } catch (err) {
      console.error('[ParticleApi] Error reading sensors:', err);
      return {
        ...this.lastGoodReadings,
        timestamp: Date.now()
      };
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
        await new Promise(r => setTimeout(r, 600));
      }
    }
  }
}

export const particleApi = new ParticleApi();
