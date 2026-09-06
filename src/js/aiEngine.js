/**
 * AI Engine — Anomaly Detection, Predictive Analytics & AI Chat
 * Provides client-side intelligence for sensor stream analysis.
 * No backend required for anomaly detection and trend analysis.
 * AI Chat uses a user-configurable API key (Gemini / OpenAI compatible).
 *
 * Part of SMART IOT HUB • Built by TekStep Apps Uganda (tekstepapps.org)
 */

// ---------------------------------------------------------------------------
// Z-Score Anomaly Detector
// ---------------------------------------------------------------------------
export class AnomalyDetector {
  /**
   * @param {number} windowSize - rolling window size for mean/stdev calculation
   * @param {number} threshold  - Z-score above which a reading is anomalous
   */
  constructor(windowSize = 20, threshold = 3.0) {
    this.windowSize = windowSize;
    this.threshold = threshold;
    /** @type {Map<string, number[]>} */
    this.windows = new Map();
    this.listeners = new Set();
  }

  onAnomaly(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  /**
   * Feed a new reading. Returns { isAnomaly, zScore, channel } for this reading.
   * @param {string} channel - sensor key, e.g. 'temp', 'humidity'
   * @param {number} value
   */
  feed(channel, value) {
    if (value === null || value === undefined || isNaN(value)) return { isAnomaly: false, zScore: 0 };

    if (!this.windows.has(channel)) {
      this.windows.set(channel, []);
    }
    const win = this.windows.get(channel);
    win.push(value);
    if (win.length > this.windowSize) win.shift();

    if (win.length < 5) return { isAnomaly: false, zScore: 0, channel }; // not enough data yet

    const mean = win.reduce((a, b) => a + b, 0) / win.length;
    const variance = win.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / win.length;
    const stdev = Math.sqrt(variance);

    if (stdev === 0) return { isAnomaly: false, zScore: 0, channel };

    const zScore = Math.abs((value - mean) / stdev);
    const isAnomaly = zScore > this.threshold;

    if (isAnomaly) {
      const result = { channel, value, mean: mean.toFixed(2), stdev: stdev.toFixed(2), zScore: zScore.toFixed(2), isAnomaly };
      this.listeners.forEach(fn => fn(result));
      return result;
    }

    return { isAnomaly: false, zScore, channel };
  }

  /**
   * Feed an entire telemetry snapshot object.
   * Returns array of anomalies found.
   */
  feedSnapshot(snapshot) {
    const anomalies = [];
    Object.entries(snapshot).forEach(([key, val]) => {
      if (typeof val === 'number') {
        const result = this.feed(key, val);
        if (result.isAnomaly) anomalies.push(result);
      }
    });
    return anomalies;
  }

  reset(channel = null) {
    if (channel) {
      this.windows.delete(channel);
    } else {
      this.windows.clear();
    }
  }

  getWindowStats(channel) {
    const win = this.windows.get(channel) || [];
    if (win.length === 0) return null;
    const mean = win.reduce((a, b) => a + b, 0) / win.length;
    const variance = win.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / win.length;
    return {
      channel,
      count: win.length,
      mean: parseFloat(mean.toFixed(3)),
      stdev: parseFloat(Math.sqrt(variance).toFixed(3)),
      min: Math.min(...win),
      max: Math.max(...win)
    };
  }
}

// ---------------------------------------------------------------------------
// Predictive Trend Analyzer (Simple Linear Regression)
// ---------------------------------------------------------------------------
export class PredictiveTrend {
  constructor(windowSize = 30) {
    this.windowSize = windowSize;
    /** @type {Map<string, Array<{ts: number, value: number}>>} */
    this.series = new Map();
  }

  feed(channel, value, timestamp = Date.now()) {
    if (!this.series.has(channel)) this.series.set(channel, []);
    const s = this.series.get(channel);
    s.push({ ts: timestamp, value });
    if (s.length > this.windowSize) s.shift();
  }

  feedSnapshot(snapshot, timestamp = Date.now()) {
    Object.entries(snapshot).forEach(([key, val]) => {
      if (typeof val === 'number') this.feed(key, val, timestamp);
    });
  }

  /**
   * Returns a linear regression forecast for `channel` at `futureMs` ms from now.
   */
  predict(channel, futureMs = 60000) {
    const s = this.series.get(channel) || [];
    if (s.length < 3) return null;

    const n = s.length;
    const t0 = s[0].ts;
    const xs = s.map(p => (p.ts - t0) / 1000); // seconds
    const ys = s.map(p => p.value);

    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = ys.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((a, x, i) => a + x * ys[i], 0);
    const sumX2 = xs.reduce((a, x) => a + x * x, 0);
    const denom = n * sumX2 - sumX * sumX;

    if (denom === 0) return { value: ys[ys.length - 1], slope: 0, trend: 'stable' };

    const slope = (n * sumXY - sumX * sumY) / denom;
    const intercept = (sumY - slope * sumX) / n;

    const futureX = xs[xs.length - 1] + futureMs / 1000;
    const predictedValue = slope * futureX + intercept;

    const trend = Math.abs(slope) < 0.01 ? 'stable' : slope > 0 ? 'rising' : 'falling';

    return {
      value: parseFloat(predictedValue.toFixed(2)),
      current: ys[ys.length - 1],
      slope: parseFloat(slope.toFixed(4)),
      intercept: parseFloat(intercept.toFixed(4)),
      trend,
      inMs: futureMs
    };
  }

  getSeries(channel) {
    return [...(this.series.get(channel) || [])];
  }
}

// ---------------------------------------------------------------------------
// AI Chat Engine
// ---------------------------------------------------------------------------
export class AiChat {
  constructor() {
    this.apiKey = localStorage.getItem('sr_ai_api_key') || '';
    this.provider = localStorage.getItem('sr_ai_provider') || 'gemini'; // 'gemini' | 'openai'
    this.history = [];
    this.listeners = new Set();
    this.isThinking = false;
  }

  setApiKey(key) {
    this.apiKey = key;
    try { localStorage.setItem('sr_ai_api_key', key); } catch (_) {}
  }

  setProvider(provider) {
    this.provider = provider;
    try { localStorage.setItem('sr_ai_provider', provider); } catch (_) {}
  }

  onMessage(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  _notify(role, content) {
    this.listeners.forEach(fn => fn({ role, content, ts: new Date().toLocaleTimeString() }));
  }

  /**
   * Build a context string from current sensor readings for injection into the prompt.
   */
  buildSensorContext(telemetry) {
    if (!telemetry) return 'No sensor data available.';
    const lines = Object.entries(telemetry)
      .filter(([k]) => k !== 'timestamp')
      .map(([k, v]) => `  - ${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`);
    return `Current sensor readings:\n${lines.join('\n')}`;
  }

  /**
   * Send a user message. Responds using configured AI provider or local fallback.
   * @param {string} userMessage
   * @param {object|null} telemetry - current sensor snapshot for context
   */
  async send(userMessage, telemetry = null) {
    const userEntry = { role: 'user', content: userMessage, ts: new Date().toLocaleTimeString() };
    this.history.push(userEntry);
    this._notify('user', userMessage);

    this.isThinking = true;
    this._notify('thinking', '...');

    try {
      let replyText = '';

      if (!this.apiKey) {
        // Local heuristic fallback (no API key needed)
        replyText = this._localFallback(userMessage, telemetry);
      } else if (this.provider === 'gemini') {
        replyText = await this._callGemini(userMessage, telemetry);
      } else if (this.provider === 'openai') {
        replyText = await this._callOpenAI(userMessage, telemetry);
      } else {
        replyText = this._localFallback(userMessage, telemetry);
      }

      const assistantEntry = { role: 'assistant', content: replyText, ts: new Date().toLocaleTimeString() };
      this.history.push(assistantEntry);
      this._notify('assistant', replyText);
      return replyText;
    } catch (err) {
      const errMsg = `❌ AI Error: ${err.message}`;
      this._notify('error', errMsg);
      return errMsg;
    } finally {
      this.isThinking = false;
    }
  }

  async _callGemini(userMessage, telemetry) {
    const sensorCtx = this.buildSensorContext(telemetry);
    const systemPrompt = `You are an IoT assistant for the SmartRoom IoT Hub dashboard. You help users understand their sensor data, diagnose hardware issues, and optimize their setup.\n\n${sensorCtx}`;

    const contents = [
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }
    ];

    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
        signal: AbortSignal.timeout(15000)
      }
    );

    if (!resp.ok) throw new Error(`Gemini API: HTTP ${resp.status}`);
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from Gemini.';
  }

  async _callOpenAI(userMessage, telemetry) {
    const sensorCtx = this.buildSensorContext(telemetry);
    const messages = [
      { role: 'system', content: `You are an IoT assistant for the SmartRoom IoT Hub. ${sensorCtx}` },
      ...this.history.slice(-6).map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
      { role: 'user', content: userMessage }
    ];

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages, max_tokens: 500 }),
      signal: AbortSignal.timeout(15000)
    });

    if (!resp.ok) throw new Error(`OpenAI API: HTTP ${resp.status}`);
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || 'No response from OpenAI.';
  }

  _localFallback(message, telemetry) {
    const msg = message.toLowerCase();
    const t = telemetry || {};

    if (msg.includes('temperature') || msg.includes('temp') || msg.includes('hot') || msg.includes('cold')) {
      const temp = t.temperature;
      if (temp !== undefined) {
        if (temp > 32) return `🌡️ Temperature is HIGH at ${temp.toFixed(1)}°C. Consider improving ventilation or checking for heat sources.`;
        if (temp < 18) return `🌡️ Temperature is COOL at ${temp.toFixed(1)}°C. Room may benefit from heating.`;
        return `🌡️ Temperature is comfortable at ${temp.toFixed(1)}°C — well within the 18–32°C safe range.`;
      }
      return '🌡️ No temperature data currently available.';
    }

    if (msg.includes('humidity') || msg.includes('humid') || msg.includes('damp')) {
      const hum = t.humidity;
      if (hum !== undefined) {
        if (hum > 70) return `💧 Humidity is HIGH at ${hum.toFixed(1)}%. Risk of mold or condensation — increase ventilation.`;
        if (hum < 30) return `💧 Humidity is LOW at ${hum.toFixed(1)}%. Air is dry — consider a humidifier.`;
        return `💧 Humidity is optimal at ${hum.toFixed(1)}% (target: 30–70%).`;
      }
      return '💧 No humidity data currently available.';
    }

    if (msg.includes('motion') || msg.includes('movement') || msg.includes('pir')) {
      const m = t.motion;
      return m === 1 ? '🏃 Motion is currently DETECTED. PIR sensor is active.' : '✅ No motion detected. Room appears clear.';
    }

    if (msg.includes('distance') || msg.includes('sonar') || msg.includes('proximity') || msg.includes('ultrasonic')) {
      const d = t.distance;
      if (d !== undefined) {
        if (d < 20) return `⚠️ PROXIMITY BREACH! Object detected at ${d.toFixed(0)}cm — below 20cm security threshold.`;
        return `📡 Sonar clear. Nearest object at ${d.toFixed(0)}cm.`;
      }
      return '📡 No sonar data available.';
    }

    if (msg.includes('alarm') || msg.includes('alert')) {
      return '🔔 Alarms trigger when: Temperature > 32°C, Proximity < 20cm, or PIR motion detected. You can silence alarms via the Silence button in the top toolbar.';
    }

    if (msg.includes('status') || msg.includes('normal') || msg.includes('ok') || msg.includes('summary')) {
      const lines = ['📊 Current sensor summary:'];
      if (t.temperature !== undefined) lines.push(`  🌡️ Temperature: ${t.temperature.toFixed(1)}°C`);
      if (t.humidity !== undefined) lines.push(`  💧 Humidity: ${t.humidity.toFixed(1)}%`);
      if (t.distance !== undefined) lines.push(`  📡 Distance: ${t.distance.toFixed(0)}cm`);
      if (t.motion !== undefined) lines.push(`  🏃 Motion: ${t.motion === 1 ? 'DETECTED' : 'CLEAR'}`);
      if (lines.length === 1) lines.push('  No data currently available.');
      lines.push('\nTo get AI-powered insights, add your Gemini or OpenAI API key in the AI Settings panel.');
      return lines.join('\n');
    }

    return `🤖 I can help you analyze your sensor data, diagnose hardware issues, and understand your readings. Try asking about temperature, humidity, motion, distance, or device status.\n\n💡 For advanced AI responses, add your Gemini or OpenAI API key in the AI & Intelligence panel.`;
  }

  clearHistory() {
    this.history = [];
  }
}

// ---------------------------------------------------------------------------
// Edge AI Stub (TensorFlow.js integration placeholder)
// ---------------------------------------------------------------------------
export class EdgeAI {
  constructor() {
    this.isLoaded = false;
    this.modelName = null;
    this.listeners = new Set();
  }

  onPrediction(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  async loadModel(modelUrl) {
    // TensorFlow.js model loading stub
    // Full implementation would use: import * as tf from '@tensorflow/tfjs';
    console.log(`[EdgeAI] Model loading from ${modelUrl} — TensorFlow.js required`);
    this.modelName = modelUrl;
    this.isLoaded = false;
    return { success: false, message: 'TensorFlow.js not loaded. Install @tensorflow/tfjs to enable.' };
  }

  async predict(inputData) {
    if (!this.isLoaded) {
      return { success: false, message: 'No model loaded.' };
    }
    // Placeholder
    return { success: false, message: 'Edge AI model inference not yet initialized.' };
  }
}

// ---------------------------------------------------------------------------
// Digital Twin Sync Stub
// ---------------------------------------------------------------------------
export class DigitalTwinSync {
  constructor() {
    this.provider = null; // 'aws_iot' | 'azure_iot' | 'google_cloud_iot' | 'custom'
    this.endpoint = null;
    this.apiKey = null;
    this.lastSyncTs = null;
  }

  configure(provider, endpoint, apiKey) {
    this.provider = provider;
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    try {
      localStorage.setItem('sr_digital_twin_config', JSON.stringify({ provider, endpoint }));
    } catch (_) {}
  }

  async sync(telemetrySnapshot) {
    if (!this.endpoint || !this.apiKey) {
      return { success: false, message: 'Digital Twin not configured.' };
    }
    // Stub — full implementation would call provider-specific APIs
    this.lastSyncTs = Date.now();
    console.log(`[DigitalTwin] Syncing to ${this.provider} at ${this.endpoint}`);
    return { success: false, message: `${this.provider} sync stub — configure provider SDK.` };
  }
}

// ---------------------------------------------------------------------------
// Main AI Engine Singleton
// ---------------------------------------------------------------------------
class AIEngine {
  constructor() {
    this.anomalyDetector = new AnomalyDetector(20, 3.0);
    this.predictiveTrend = new PredictiveTrend(30);
    this.chat = new AiChat();
    this.edgeAI = new EdgeAI();
    this.digitalTwin = new DigitalTwinSync();

    this.isAnomalyDetectionEnabled = localStorage.getItem('sr_ai_anomaly_enabled') === 'true';
    this.isTrendEnabled = localStorage.getItem('sr_ai_trend_enabled') === 'true';
    this.isTwinSyncEnabled = false;

    this.anomalyListeners = new Set();
  }

  onAnomaly(cb) {
    this.anomalyListeners.add(cb);
    this.anomalyDetector.onAnomaly(cb);
    return () => {
      this.anomalyListeners.delete(cb);
    };
  }

  /**
   * Feed a telemetry snapshot through all active AI subsystems.
   * Call this every time updateDashboard() fires.
   */
  processTelemetry(snapshot) {
    const ts = Date.now();

    if (this.isAnomalyDetectionEnabled) {
      const anomalies = this.anomalyDetector.feedSnapshot(snapshot);
      if (anomalies.length > 0) {
        this.anomalyListeners.forEach(fn => fn(anomalies[0]));
      }
    }

    if (this.isTrendEnabled) {
      this.predictiveTrend.feedSnapshot(snapshot, ts);
    }

    if (this.isTwinSyncEnabled) {
      this.digitalTwin.sync(snapshot);
    }
  }

  enableAnomalyDetection(enabled) {
    this.isAnomalyDetectionEnabled = enabled;
    try { localStorage.setItem('sr_ai_anomaly_enabled', enabled ? 'true' : 'false'); } catch (_) {}
  }

  enableTrend(enabled) {
    this.isTrendEnabled = enabled;
    try { localStorage.setItem('sr_ai_trend_enabled', enabled ? 'true' : 'false'); } catch (_) {}
  }

  getTrend(channel, futureMs = 60000) {
    return this.predictiveTrend.predict(channel, futureMs);
  }

  getWindowStats(channel) {
    return this.anomalyDetector.getWindowStats(channel);
  }

  resetAnomalyWindow(channel = null) {
    this.anomalyDetector.reset(channel);
  }
}

export const aiEngine = new AIEngine();
