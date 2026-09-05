/**
 * Bidirectional ThingSpeak API Client
 * Retrieves live sensor feeds, posts telemetry updates, and enforces
 * the strict 15-second free-tier write rate limit with countdown tracking.
 */

import { homeConfig } from './homeConfig.js';

export class ThingSpeakApi {
  constructor() {
    this.baseUrl = 'https://api.thingspeak.com';
    this.lastWriteTimestamp = 0;
    this.minIntervalMs = 15000; // 15 seconds required by ThingSpeak
    this.statusListeners = new Set();
  }

  get channelId() {
    return homeConfig.config.thingspeakChannelId || '3475948';
  }

  get writeKey() {
    return homeConfig.config.thingspeakWriteKey || '2W20O13FTT3CIUD3';
  }

  get readKey() {
    return homeConfig.config.thingspeakReadKey || '';
  }

  onStatusChange(cb) {
    this.statusListeners.add(cb);
    return () => this.statusListeners.delete(cb);
  }

  notifyStatus(status) {
    this.statusListeners.forEach(fn => fn(status));
  }

  getSecondsUntilNextPublish() {
    const elapsed = Date.now() - this.lastWriteTimestamp;
    const remaining = Math.max(0, Math.ceil((this.minIntervalMs - elapsed) / 1000));
    return remaining;
  }

  isRateLimited() {
    return this.getSecondsUntilNextPublish() > 0;
  }

  /**
   * Fetch the most recent sensor entry from ThingSpeak
   */
  async getLatestFeed() {
    try {
      const keyParam = this.readKey ? `?api_key=${this.readKey}` : '';
      const url = `${this.baseUrl}/channels/${this.channelId}/feeds/last.json${keyParam}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(4500) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      return {
        temperature: data.field1 ? parseFloat(data.field1) : null,
        humidity: data.field2 ? parseFloat(data.field2) : null,
        distance: data.field3 ? parseFloat(data.field3) : null,
        motion: data.field4 ? parseInt(data.field4, 10) : null,
        light: data.field5 ? parseInt(data.field5, 10) : null,
        createdAt: data.created_at
      };
    } catch (err) {
      return null;
    }
  }

  /**
   * Fetch historical entries for sparkline graphs
   */
  async getRecentFeeds(count = 20) {
    try {
      const keyParam = this.readKey ? `&api_key=${this.readKey}` : '';
      const url = `${this.baseUrl}/channels/${this.channelId}/feeds.json?results=${count}${keyParam}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.feeds || [];
    } catch (err) {
      return [];
    }
  }

  /**
   * Publish live sensor telemetry to ThingSpeak
   * @param {object} telemetry { temp, hum, dist, motion, light }
   */
  async publishTelemetry(telemetry) {
    if (!this.writeKey) {
      return { success: false, error: 'ThingSpeak Write API Key is missing.' };
    }

    const waitSec = this.getSecondsUntilNextPublish();
    if (waitSec > 0) {
      return {
        success: false,
        rateLimited: true,
        waitSec,
        error: `ThingSpeak rate limit: please wait ${waitSec}s before next update.`
      };
    }

    try {
      const params = new URLSearchParams({
        api_key: this.writeKey
      });

      if (telemetry.temp !== undefined && telemetry.temp !== null) params.append('field1', telemetry.temp.toFixed(1));
      if (telemetry.hum !== undefined && telemetry.hum !== null) params.append('field2', telemetry.hum.toFixed(1));
      if (telemetry.dist !== undefined && telemetry.dist !== null) params.append('field3', telemetry.dist.toFixed(1));
      if (telemetry.motion !== undefined && telemetry.motion !== null) params.append('field4', telemetry.motion);
      if (telemetry.light !== undefined && telemetry.light !== null) params.append('field5', telemetry.light);

      const url = `${this.baseUrl}/update.json`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
        signal: AbortSignal.timeout(5000)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const result = await res.json();

      if (result === 0) {
        throw new Error('ThingSpeak rejected write (interval too short or invalid key).');
      }

      this.lastWriteTimestamp = Date.now();
      const status = {
        success: true,
        entryId: result,
        timestamp: new Date().toLocaleTimeString()
      };
      this.notifyStatus(status);
      return status;
    } catch (err) {
      const status = {
        success: false,
        error: err.message
      };
      this.notifyStatus(status);
      return status;
    }
  }
}

export const thingspeakApi = new ThingSpeakApi();
