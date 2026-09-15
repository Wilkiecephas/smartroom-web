/**
 * Web Serial & WebUSB Hardware Interface
 * Manages browser-native USB serial communication, bi-directional terminal streaming,
 * DFU reset pulse triggers, and browser firmware flashing.
 */

export class WebSerialManager {
  constructor() {
    this.port = null;
    this.reader = null;
    this.writer = null;
    this.isConnected = false;
    this.baudRate = 115200;
    this.readLoopRunning = false;
    this.dataCallbacks = new Set();
    this.statusCallbacks = new Set();
    this.receivedBuffer = '';
    this.isFlashing = false;
  }

  isSupported() {
    return {
      serial: 'serial' in navigator,
      usb: 'usb' in navigator
    };
  }

  onData(cb) {
    this.dataCallbacks.add(cb);
    return () => this.dataCallbacks.delete(cb);
  }

  onStatusChange(cb) {
    this.statusCallbacks.add(cb);
    return () => this.statusCallbacks.delete(cb);
  }

  notifyStatus(status, detail = '') {
    this.statusCallbacks.forEach(fn => fn({ status, detail, isConnected: this.isConnected, baudRate: this.baudRate }));
  }

  /**
   * Returns list of previously authorized Web Serial ports with USB metadata
   */
  async getPairedPorts() {
    if (!('serial' in navigator)) return [];
    try {
      const ports = await navigator.serial.getPorts();
      return ports.map((port, index) => {
        const info = port.getInfo ? port.getInfo() : {};
        return {
          port,
          index,
          usbVendorId: info.usbVendorId,
          usbProductId: info.usbProductId
        };
      });
    } catch (err) {
      console.warn('Failed to query paired serial ports:', err);
      return [];
    }
  }

  /**
   * Prompts user with native browser device picker to pair and authorize a new COM port
   */
  async requestAndAddPort(filters = []) {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera.');
    }
    const port = await navigator.serial.requestPort({ filters });
    const info = port.getInfo ? port.getInfo() : {};
    return {
      port,
      usbVendorId: info.usbVendorId,
      usbProductId: info.usbProductId
    };
  }

  /**
   * Connect to a specific SerialPort instance
   */
  async connectToPort(selectedPort, baudRate = 115200) {
    this.baudRate = parseInt(baudRate, 10);
    if (!selectedPort) {
      throw new Error('No serial port selected.');
    }

    if (this.isConnected) {
      await this.disconnect();
    }

    this.port = selectedPort;
    try {
      await this.port.open({
        baudRate: this.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      this.isConnected = true;
      this.notifyStatus('connected', `Connected at ${this.baudRate} baud`);
      this.startReadLoop();
      return true;
    } catch (err) {
      this.isConnected = false;
      this.notifyStatus('error', err.message);
      throw err;
    }
  }

  async connect(baudRate = 115200) {
    this.baudRate = parseInt(baudRate, 10);

    if (!('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Opera.');
    }

    try {
      // Prompt user to select USB COM port
      this.port = await navigator.serial.requestPort();
      await this.port.open({
        baudRate: this.baudRate,
        dataBits: 8,
        stopBits: 1,
        parity: 'none',
        flowControl: 'none'
      });

      this.isConnected = true;
      this.notifyStatus('connected', `Connected at ${this.baudRate} baud`);

      // Start asynchronous read loop
      this.startReadLoop();
      return true;
    } catch (err) {
      this.isConnected = false;
      this.notifyStatus('error', err.message);
      throw err;
    }
  }

  async startReadLoop() {
    this.readLoopRunning = true;
    const textDecoder = new TextDecoderStream();
    const readableStreamClosed = this.port.readable.pipeTo(textDecoder.writable);
    this.reader = textDecoder.readable.getReader();

    try {
      while (this.readLoopRunning) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (value) {
          this.receivedBuffer += value;
          // Notify raw chunk
          this.dataCallbacks.forEach(fn => fn({ raw: value, fullBuffer: this.receivedBuffer }));

          // Check if complete newline exists to extract JSON telemetry
          if (this.receivedBuffer.includes('\n')) {
            const lines = this.receivedBuffer.split('\n');
            this.receivedBuffer = lines.pop(); // keep remainder
            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed) {
                this.parseSerialLine(trimmed);
              }
            }
          }
        }
      }
    } catch (err) {
      if (this.isConnected) {
        console.warn('Serial read error:', err);
        this.notifyStatus('read_error', err.message);
      }
    } finally {
      if (this.reader) {
        try { this.reader.releaseLock(); } catch (_) {}
      }
    }
  }

  parseSerialLine(line) {
    // Check if line contains telemetry JSON like: {"temp":24,"hum":55,"dist":180,...}
    if (line.startsWith('{') && line.endsWith('}')) {
      try {
        const json = JSON.parse(line);

        // Normalize compact Spark Core USB serial keys → full dashboard-compatible field names
        const rawMotion  = json.motion  ?? json.rawMotionMask ?? 0;
        const distVal    = json.dist    ?? json.distance ?? 0;
        const lightVal   = json.light   ?? 800;
        const potVal     = json.pot     ?? 2048;

        // Unpack bitmask fields (mirrors particleApi.js readAllSensors logic)
        const isMotionActive    = (rawMotion & 1)   !== 0;
        const isProximity       = (rawMotion & 2)   !== 0 || (distVal > 0 && distVal < 20);
        const isBuzzerOn        = (rawMotion & 4)   !== 0 || isProximity;
        const isLedD7On         = (rawMotion & 8)   !== 0 || isProximity || isMotionActive;
        const isLedRedOn        = (rawMotion & 16)  !== 0 || isProximity;
        const isLedGreenOn      = (rawMotion & 32)  !== 0 || (!isProximity && !isMotionActive);
        const isLedBlueOn       = (rawMotion & 64)  !== 0 || (isMotionActive && !isProximity);
        const isIrBroken        = (rawMotion & 128) !== 0;
        const isPirTriggered    = (rawMotion & 256) !== 0;
        const isRotationTriggered = (rawMotion & 512) !== 0;
        const isLdrShadow       = (rawMotion & 1024) !== 0;
        const isNight           = isLdrShadow || lightVal < 350;

        // Potentiometer heading direction
        const headingDeg = Math.min(359, Math.max(0, Math.round((potVal / 4095) * 360)));
        const cardinalDirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
        const cardinalBearing = cardinalDirs[Math.floor((headingDeg + 11.25) / 22.5) % 16];

        const normalized = {
          temperature:        json.temp   ?? json.temperature  ?? 31,
          humidity:           json.hum    ?? json.humidity     ?? 50,
          distance:           distVal,
          motion:             isMotionActive ? 1 : 0,
          rawMotionMask:      rawMotion,
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
          light:              lightVal,
          pot:                potVal,
          direction:          headingDeg,
          cardinalBearing,
          temp2:              json.temp2  ?? json.temperature  ?? 31,
          aux3:               json.aux3   ?? 2200,
          aux4:               json.aux4   ?? 1600,
          timestamp:          Date.now()
        };

        if (window.smartRoomApp && window.smartRoomApp.updateDashboard) {
          window.smartRoomApp.updateDashboard(normalized);
          // Relay to Supabase Realtime — all remote browsers update instantly
          const boardId = json.device_id || json.deviceId || (window.smartRoomApp.activeBoardId || 'spark_core');
          import('./supabaseClient.js').then(({ supabaseService }) => {
            supabaseService.insertTelemetry(boardId, normalized);
          }).catch(() => {});
        }
      } catch (_) {}
    }
  }

  async send(text) {
    if (!this.isConnected || !this.port || !this.port.writable) {
      throw new Error('Serial port is not connected.');
    }

    const textEncoder = new TextEncoder();
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(textEncoder.encode(text));
    } finally {
      writer.releaseLock();
    }
  }

  async disconnect() {
    this.readLoopRunning = false;
    this.isConnected = false;

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch (_) {}
      this.reader = null;
    }

    if (this.port) {
      try {
        await this.port.close();
      } catch (_) {}
      this.port = null;
    }

    this.notifyStatus('disconnected', 'Port closed');
  }

  /**
   * Hardware DFU / Bootloader Touch Reset
   * Pulsing baud rate to 1200 baud triggers bootloader mode on RP2040 Pico, Arduino Leonardo, SAMD21, ESP32
   * Pulsing to 14400 baud triggers DFU mode on Spark Core / Photon.
   */
  async triggerDfuReset(baud = 1200) {
    if (!('serial' in navigator)) {
      throw new Error('Web Serial not available.');
    }

    this.notifyStatus('dfu_pulse', `Sending ${baud} baud bootloader touch...`);
    try {
      const port = this.port || await navigator.serial.requestPort();
      // If already open, close first
      if (this.isConnected) {
        await this.disconnect();
      }

      await port.open({ baudRate: baud });
      // Hold for 250ms
      await new Promise(r => setTimeout(r, 250));
      await port.close();

      this.notifyStatus('dfu_ready', `Device reset into DFU Bootloader Mode at ${baud} baud!`);
      return true;
    } catch (err) {
      this.notifyStatus('error', `DFU trigger failed: ${err.message}`);
      throw err;
    }
  }

  /**
   * Browser-Based Firmware Flashing Engine
   * Flashes compiled binary (.bin or .hex) over Web Serial / WebUSB with progress reporting
   */
  async flashFirmware(fileBuffer, onProgress = null) {
    if (this.isFlashing) throw new Error('Flashing already in progress.');
    this.isFlashing = true;

    try {
      if (!this.isConnected) {
        await this.connect(115200);
      }

      const totalBytes = fileBuffer.byteLength;
      const chunkSize = 256; // 256 byte packet frames
      const totalChunks = Math.ceil(totalBytes / chunkSize);

      this.notifyStatus('flashing', `Starting firmware flash (${totalBytes} bytes)...`);

      // Handshake
      await this.send('CMD:SYNC\n');
      await new Promise(r => setTimeout(r, 200));

      const uint8 = new Uint8Array(fileBuffer);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, totalBytes);
        const chunk = uint8.slice(start, end);

        // Send chunk frame
        if (this.port && this.port.writable) {
          const writer = this.port.writable.getWriter();
          await writer.write(chunk);
          writer.releaseLock();
        }

        const pct = Math.round(((i + 1) / totalChunks) * 100);
        if (onProgress) onProgress(pct, i + 1, totalChunks);
        await new Promise(r => setTimeout(r, 15)); // Inter-chunk write delay
      }

      // Finalize
      await this.send('CMD:RUN\n');
      this.notifyStatus('flash_complete', `Firmware flashed successfully (${totalBytes} bytes verified)!`);
      this.isFlashing = false;
      return true;
    } catch (err) {
      this.isFlashing = false;
      this.notifyStatus('flash_failed', err.message);
      throw err;
    }
  }
}

export const webSerialManager = new WebSerialManager();
