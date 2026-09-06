/**
 * Hardware Connection & Code Generator Subsystem
 * Generates copy-pasteable and downloadable firmware for:
 * - Arduino Uno / Nano / Mega (USB WebSerial UART)
 * - ESP32 (Wi-Fi REST Client)
 * - ESP32 (Embedded Local Web Server)
 * - Spark Core & Particle Photon (Particle Cloud API)
 * - Raspberry Pi Pico W (MicroPython)
 *
 * Part of SMART IOT HUB • Built by TekStep Apps Uganda (tekstepapps.org)
 */

export class HardwareConnectGuide {
  constructor() {
    this.modal = null;
    this.txtArduino = null;
    this.txtEsp32 = null;
    this.txtEsp32Server = null;
    this.txtSpark = null;
    this.txtPico = null;

    this.cfgEspSsid = null;
    this.cfgEspPass = null;
    this.cfgEspUrl = null;
    this.cfgEspDevId = null;
  }

  init() {
    this.modal = document.getElementById('modalFlasher');
    if (!this.modal) return;

    this.txtArduino = document.getElementById('txtArduinoCode');
    this.txtEsp32 = document.getElementById('txtEsp32Code');
    this.txtEsp32Server = document.getElementById('txtEsp32ServerCode');
    this.txtSpark = document.getElementById('txtSparkCode');
    this.txtPico = document.getElementById('txtPicoCode');

    this.cfgEspSsid = document.getElementById('cfgEspSsid');
    this.cfgEspPass = document.getElementById('cfgEspPass');
    this.cfgEspUrl = document.getElementById('cfgEspUrl');
    this.cfgEspDevId = document.getElementById('cfgEspDevId');

    // Auto-detect hub origin for default URL
    if (this.cfgEspUrl && typeof window !== 'undefined') {
      const host = window.location.hostname || '192.168.1.100';
      const port = window.location.port ? `:${window.location.port}` : '';
      const proto = window.location.protocol || 'http:';
      this.cfgEspUrl.value = `${proto}//${host}${port}/api/telemetry?device=dev_esp32_01`;
    }

    this.bindEvents();
    this.refreshAllCodes();
  }

  bindEvents() {
    // Tab switching inside modal
    if (this.modal) {
      this.modal.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const tabId = btn.getAttribute('data-tab');
          this.switchTab(tabId);
        });
      });
    }

    // Live customizer input listeners
    [this.cfgEspSsid, this.cfgEspPass, this.cfgEspUrl, this.cfgEspDevId].forEach(input => {
      if (input) {
        input.addEventListener('input', () => {
          this.renderEsp32Code();
        });
      }
    });

    // Copy buttons
    this.wireCopyBtn('btnCopyArduinoCode', () => this.txtArduino?.value, 'Arduino WebSerial sketch copied!');
    this.wireCopyBtn('btnCopyEsp32Code', () => this.txtEsp32?.value, 'ESP32 Wi-Fi REST sketch copied!');
    this.wireCopyBtn('btnCopyEsp32ServerCode', () => this.txtEsp32Server?.value, 'ESP32 Server sketch copied!');
    this.wireCopyBtn('btnCopySparkCode', () => this.txtSpark?.value, 'Spark Core Particle firmware copied!');
    this.wireCopyBtn('btnCopyPicoCode', () => this.txtPico?.value, 'Pico W MicroPython code copied!');

    // Download buttons
    this.wireDownloadBtn('btnDownloadArduinoCode', () => this.txtArduino?.value, 'arduino_uno_hub_webserial.ino');
    this.wireDownloadBtn('btnDownloadEsp32Code', () => this.txtEsp32?.value, 'esp32_wifi_rest_telemetry.ino');
    this.wireDownloadBtn('btnDownloadEsp32ServerCode', () => this.txtEsp32Server?.value, 'esp32_standalone_server.ino');
    this.wireDownloadBtn('btnDownloadSparkCode', () => this.txtSpark?.value, 'spark_core_photon_cloud.ino');
    this.wireDownloadBtn('btnDownloadPicoCode', () => this.txtPico?.value, 'main_picow.py');
  }

  wireCopyBtn(btnId, getCodeFn, successMsg) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', () => {
      const code = getCodeFn();
      if (!code) return;

      navigator.clipboard.writeText(code).then(() => {
        const origText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.style.borderColor = 'var(--accent-emerald)';
        btn.style.color = 'var(--accent-emerald)';
        setTimeout(() => {
          btn.innerHTML = origText;
          btn.style.borderColor = '';
          btn.style.color = '';
        }, 1800);
      }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = code;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      });
    });
  }

  wireDownloadBtn(btnId, getCodeFn, filename) {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    btn.addEventListener('click', () => {
      const code = getCodeFn();
      if (!code) return;

      const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  switchTab(tabId) {
    if (!this.modal) return;
    this.modal.querySelectorAll('.modal-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    this.modal.querySelectorAll('.tab-content-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });
  }

  open(initialTab = 'tabConnectArduino') {
    if (!this.modal) return;
    this.refreshAllCodes();
    this.switchTab(initialTab);
    this.modal.classList.add('active');
  }

  close() {
    if (this.modal) this.modal.classList.remove('active');
  }

  refreshAllCodes() {
    this.renderArduinoCode();
    this.renderEsp32Code();
    this.renderEsp32ServerCode();
    this.renderSparkCode();
    this.renderPicoCode();
  }

  renderArduinoCode() {
    if (!this.txtArduino) return;
    this.txtArduino.value = `/*
 * SMART IOT HUB — ARDUINO UNO / NANO / MEGA TELEMETRY
 * Protocol: High-Speed WebSerial UART (115200 Baud)
 * Built by TekStep Apps Uganda (tekstepapps.org)
 */

const int PIN_PIR       = 3;   // PIR motion digital input
const int PIN_BUZZER    = 5;   // Piezo alarm buzzer
const int PIN_US_TRIG   = 7;   // HC-SR04 trigger
const int PIN_US_ECHO   = 8;   // HC-SR04 echo
const int PIN_RGB_RED   = 9;   // RGB LED Red
const int PIN_RGB_GREEN = 10;  // RGB LED Green
const int PIN_RGB_BLUE  = 11;  // RGB LED Blue
const int PIN_LDR       = A1;  // LDR photoresistor ADC
const int PIN_LM35      = A2;  // LM35 Temp ADC

float currentTemp = 24.5;
float currentHum  = 55.0;
float currentDist = 150.0;
int   currentMotion = 0;
int   currentLight  = 650;
int   pirFilterCounter = 0;

void setRgbColor(bool r, bool g, bool b) {
  digitalWrite(PIN_RGB_RED,   r ? HIGH : LOW);
  digitalWrite(PIN_RGB_GREEN, g ? HIGH : LOW);
  digitalWrite(PIN_RGB_BLUE,  b ? HIGH : LOW);
}

void triggerBeep(int freqHz, int durationMs) {
  int halfPeriodUs = 1000000 / (freqHz * 2);
  unsigned long cycles = ((unsigned long)durationMs * 1000UL) / (unsigned long)(halfPeriodUs * 2);
  for (unsigned long i = 0; i < cycles; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delayMicroseconds(halfPeriodUs);
    digitalWrite(PIN_BUZZER, LOW);
    delayMicroseconds(halfPeriodUs);
  }
}

float readUltrasonicCm() {
  digitalWrite(PIN_US_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_US_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_US_TRIG, LOW);
  unsigned long duration = pulseIn(PIN_US_ECHO, HIGH, 28000);
  if (duration == 0) return 999.0;
  return (float)(duration / 58.0);
}

void setup() {
  Serial.begin(115200);
  while (!Serial && millis() < 3000);

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  pinMode(PIN_RGB_RED, OUTPUT);
  pinMode(PIN_RGB_GREEN, OUTPUT);
  pinMode(PIN_RGB_BLUE, OUTPUT);
  setRgbColor(false, true, false); // Green nominal

  pinMode(PIN_US_TRIG, OUTPUT);
  digitalWrite(PIN_US_TRIG, LOW);
  pinMode(PIN_US_ECHO, INPUT);
  pinMode(PIN_PIR, INPUT);

  triggerBeep(2400, 60);
  Serial.println(F("{\\"status\\":\\"ready\\",\\"board\\":\\"arduino_uno\\",\\"baud\\":115200}"));
}

void loop() {
  currentDist = readUltrasonicCm();

  // Debounce PIR Motion
  int rawPir = digitalRead(PIN_PIR);
  if (rawPir == HIGH) {
    if (pirFilterCounter < 4) pirFilterCounter++;
  } else {
    if (pirFilterCounter > 0) pirFilterCounter--;
  }
  currentMotion = (pirFilterCounter >= 3) ? 1 : 0;

  currentLight = analogRead(PIN_LDR);
  int rawLm35 = analogRead(PIN_LM35);
  currentTemp = (rawLm35 * 5.0 / 1024.0) * 100.0;
  if (currentTemp < 0.0 || currentTemp > 85.0) currentTemp = 24.5;

  // Local Security Threshold
  if (currentDist > 0 && currentDist < 20.0) {
    setRgbColor(true, false, false);
    triggerBeep(2200, 40);
  } else if (currentMotion == 1) {
    setRgbColor(false, false, true);
  } else {
    setRgbColor(false, true, false);
  }

  // Stream JSON Telemetry to Smart IoT Hub
  Serial.print(F("{\\"temp\\":"));
  Serial.print(currentTemp, 1);
  Serial.print(F(",\\"hum\\":"));
  Serial.print(currentHum, 1);
  Serial.print(F(",\\"dist\\":"));
  Serial.print(currentDist, 1);
  Serial.print(F(",\\"motion\\":"));
  Serial.print(currentMotion);
  Serial.print(F(",\\"light\\":"));
  Serial.print(currentLight);
  Serial.println(F("}"));

  // Handle Actuator Commands from Dashboard
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    if (cmd == '1' || cmd == 't') triggerBeep(2400, 150);
    else if (cmd == '0') { digitalWrite(PIN_BUZZER, LOW); setRgbColor(false, true, false); }
    else if (cmd == 'r') setRgbColor(true, false, false);
    else if (cmd == 'g') setRgbColor(false, true, false);
    else if (cmd == 'b') setRgbColor(false, false, true);
  }

  delay(300);
}`;
  }

  renderEsp32Code() {
    if (!this.txtEsp32) return;
    const ssid = this.cfgEspSsid?.value.trim() || 'YOUR_WIFI_SSID';
    const pass = this.cfgEspPass?.value.trim() || 'YOUR_WIFI_PASSWORD';
    const url = this.cfgEspUrl?.value.trim() || 'http://192.168.1.100:5173/api/telemetry?device=dev_esp32_01';
    const devId = this.cfgEspDevId?.value.trim() || 'dev_esp32_01';

    this.txtEsp32.value = `/*
 * SMART IOT HUB — ESP32 WI-FI REST TELEMETRY CLIENT
 * Target: ESP32 NodeMCU, WROOM-32, ESP32-S3, ESP32-C3
 * Built by TekStep Apps Uganda (tekstepapps.org)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "${ssid}";
const char* WIFI_PASS     = "${pass}";
const char* TELEMETRY_URL = "${url}";
const char* DEVICE_ID     = "${devId}";
const unsigned long SEND_INTERVAL_MS = 2000;

#define PIN_US_TRIG   18
#define PIN_US_ECHO   19
#define PIN_PIR       13
#define PIN_BUZZER    5
#define PIN_RGB_R     25
#define PIN_RGB_G     26
#define PIN_RGB_B     27
#define PIN_LDR       34
#define PIN_LM35      35

float currentTemp = 24.5;
float currentHum  = 55.0;
float currentDist = 150.0;
int   currentMotion = 0;
int   currentLight  = 650;
int   pirFilterCounter = 0;
unsigned long lastSendTime = 0;

void setRgbColor(bool r, bool g, bool b) {
  digitalWrite(PIN_RGB_R, r ? HIGH : LOW);
  digitalWrite(PIN_RGB_G, g ? HIGH : LOW);
  digitalWrite(PIN_RGB_B, b ? HIGH : LOW);
}

void triggerChirp(int ms) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(ms);
  digitalWrite(PIN_BUZZER, LOW);
}

float measureUltrasonic() {
  digitalWrite(PIN_US_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_US_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_US_TRIG, LOW);
  long dur = pulseIn(PIN_US_ECHO, HIGH, 26000);
  if (dur <= 0) return 999.0;
  return (float)(dur * 0.0343 / 2.0);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_US_TRIG, OUTPUT);
  pinMode(PIN_US_ECHO, INPUT);
  pinMode(PIN_PIR, INPUT_PULLDOWN); // Anti-floating pull-down
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_RGB_R, OUTPUT);
  pinMode(PIN_RGB_G, OUTPUT);
  pinMode(PIN_RGB_B, OUTPUT);

  setRgbColor(false, false, true); // Blue while connecting
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED && millis() < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\\n[ESP32] Wi-Fi Connected! IP: " + WiFi.localIP().toString());
    setRgbColor(false, true, false); // Green connected
    triggerChirp(25);
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(1000);
    return;
  }

  currentDist = measureUltrasonic();

  int rawPir = digitalRead(PIN_PIR);
  if (rawPir == HIGH) {
    if (pirFilterCounter < 4) pirFilterCounter++;
  } else {
    if (pirFilterCounter > 0) pirFilterCounter--;
  }
  currentMotion = (pirFilterCounter >= 3) ? 1 : 0;

  currentLight = analogRead(PIN_LDR);
  int rawTemp = analogRead(PIN_LM35);
  currentTemp = (rawTemp * (3.3 / 4095.0)) * 100.0;
  if (currentTemp < 0.0 || currentTemp > 85.0) currentTemp = 24.5;

  unsigned long now = millis();
  if (now - lastSendTime >= SEND_INTERVAL_MS) {
    lastSendTime = now;

    HTTPClient http;
    http.begin(TELEMETRY_URL);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["deviceId"]    = DEVICE_ID;
    doc["temperature"] = round(currentTemp * 10.0) / 10.0;
    doc["humidity"]    = round(currentHum * 10.0) / 10.0;
    doc["distance"]    = round(currentDist * 10.0) / 10.0;
    doc["motion"]      = currentMotion;
    doc["light"]       = currentLight;

    String jsonPayload;
    serializeJson(doc, jsonPayload);

    int httpCode = http.POST(jsonPayload);
    if (httpCode > 0) {
      Serial.printf("[REST] Telemetry Sent -> HTTP %d\\n", httpCode);
      triggerChirp(12); // Subtle chirp on success
    }
    http.end();
  }

  delay(200);
}`;
  }

  renderEsp32ServerCode() {
    if (!this.txtEsp32Server) return;
    this.txtEsp32Server.value = `/*
 * SMART IOT HUB — ESP32 EMBEDDED JSON WEB SERVER
 * Smart IoT Hub polls "http://<esp32-ip>/telemetry" directly over Wi-Fi
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

WebServer server(80);

#define PIN_US_TRIG   18
#define PIN_US_ECHO   19
#define PIN_PIR       13
#define PIN_BUZZER    5
#define PIN_RGB_R     25
#define PIN_RGB_G     26
#define PIN_RGB_B     27
#define PIN_LDR       34
#define PIN_LM35      35

float currentTemp = 24.5;
float currentHum  = 55.0;
float currentDist = 150.0;
int   currentMotion = 0;
int   currentLight  = 650;
int   pirFilterCounter = 0;

void triggerBeep(int ms) {
  digitalWrite(PIN_BUZZER, HIGH);
  delay(ms);
  digitalWrite(PIN_BUZZER, LOW);
}

float measureUltrasonic() {
  digitalWrite(PIN_US_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_US_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_US_TRIG, LOW);
  long dur = pulseIn(PIN_US_ECHO, HIGH, 26000);
  if (dur <= 0) return 999.0;
  return (float)(dur * 0.0343 / 2.0);
}

void handleTelemetry() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");

  StaticJsonDocument<256> doc;
  doc["deviceId"]    = "dev_esp32_server";
  doc["temperature"] = round(currentTemp * 10.0) / 10.0;
  doc["humidity"]    = round(currentHum * 10.0) / 10.0;
  doc["distance"]    = round(currentDist * 10.0) / 10.0;
  doc["motion"]      = currentMotion;
  doc["light"]       = currentLight;
  doc["uptime"]      = millis() / 1000;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
  triggerBeep(8); // Soft chirp
}

void handleOptions() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
  server.send(204);
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_US_TRIG, OUTPUT);
  pinMode(PIN_US_ECHO, INPUT);
  pinMode(PIN_PIR, INPUT_PULLDOWN);
  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_RGB_R, OUTPUT);
  pinMode(PIN_RGB_G, OUTPUT);
  pinMode(PIN_RGB_B, OUTPUT);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\\n[ESP32] Connected! IP: " + WiFi.localIP().toString());
  Serial.println("[ESP32] Telemetry URL: http://" + WiFi.localIP().toString() + "/telemetry");

  server.on("/telemetry", HTTP_GET, handleTelemetry);
  server.on("/telemetry", HTTP_OPTIONS, handleOptions);
  server.begin();
  triggerBeep(30);
}

void loop() {
  server.handleClient();

  static unsigned long lastSample = 0;
  if (millis() - lastSample >= 250) {
    lastSample = millis();
    currentDist = measureUltrasonic();

    int rawPir = digitalRead(PIN_PIR);
    if (rawPir == HIGH) {
      if (pirFilterCounter < 4) pirFilterCounter++;
    } else {
      if (pirFilterCounter > 0) pirFilterCounter--;
    }
    currentMotion = (pirFilterCounter >= 3) ? 1 : 0;
    currentLight = analogRead(PIN_LDR);
    int rawTemp = analogRead(PIN_LM35);
    currentTemp = (rawTemp * (3.3 / 4095.0)) * 100.0;
  }
}`;
  }

  renderSparkCode() {
    if (!this.txtSpark) return;
    this.txtSpark.value = `/*
 * SMART IOT HUB — SPARK CORE & PARTICLE PHOTON / ARGON
 * Protocol: Particle Cloud Native REST API (Variables & Functions)
 * Built by TekStep Apps Uganda (tekstepapps.org)
 */

#include "application.h"

const int PIN_DHT11       = D4;
const int PIN_SZ_HS100    = A0;
const int PIN_BUZZER      = D5;
const int PIN_RGB_RED     = A5;
const int PIN_RGB_GREEN   = A6;
const int PIN_RGB_BLUE    = A7;
const int PIN_LDR         = A1;
const int PIN_TRIG        = D0;
const int PIN_ECHO        = D1;
const int PIN_PIR         = D3; // Uses INPUT_PULLDOWN to prevent floating false alarms!

int currentTemp   = 24;
int currentHum    = 55;
int currentDist   = 150;
int currentMotion = 0;
int currentLight  = 650;
int szHum         = 55;
int pirFilterCounter = 0;
bool pirMonitoringEnabled = false; // Default to false so unplugged PIR does not false-alarm

void setRgb(bool r, bool g, bool b) {
  digitalWrite(PIN_RGB_RED,   r ? HIGH : LOW);
  digitalWrite(PIN_RGB_GREEN, g ? HIGH : LOW);
  digitalWrite(PIN_RGB_BLUE,  b ? HIGH : LOW);
}

void playBuzzerTone(int durationMs, int freqHz) {
  if (freqHz <= 0 || durationMs <= 0) {
    delay(durationMs);
    return;
  }
  int halfPeriodUs = 1000000 / (freqHz * 2);
  unsigned long cycles = ((unsigned long)durationMs * 1000UL) / (unsigned long)(halfPeriodUs * 2);
  for (unsigned long i = 0; i < cycles; i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delayMicroseconds(halfPeriodUs);
    digitalWrite(PIN_BUZZER, LOW);
    delayMicroseconds(halfPeriodUs);
  }
}

// Melodic motifs instead of harsh buzzes
void playMelodyAlert() {
  playBuzzerTone(60, 440);
  delay(15);
  playBuzzerTone(60, 523);
  delay(15);
  playBuzzerTone(60, 659);
  delay(15);
  playBuzzerTone(120, 880);
}

void playMelodyMotion() {
  playBuzzerTone(50, 659);
  delay(15);
  playBuzzerTone(90, 988);
}

int readUltrasonicCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);
  unsigned long duration = pulseIn(PIN_ECHO, HIGH, 28000);
  if (duration == 0) return 999;
  return (int)(duration / 58UL);
}

int handleCloudCommand(String args) {
  if (args.length() == 0) return -1;
  char c = args.charAt(0);
  if (c == 't' || c == '1') { playMelodyAlert(); return 1; }
  if (c == '0' || c == 'o') { digitalWrite(PIN_BUZZER, LOW); setRgb(false, true, false); return 0; }
  if (c == 'k')             { playMelodyMotion(); return 5; } // Gentle musical status motif
  if (c == 'r')             { setRgb(true, false, false); return 2; }
  if (c == 'g')             { setRgb(false, true, false); return 3; }
  if (c == 'b')             { setRgb(false, false, true); return 4; }
  if (c == 'p')             { pirMonitoringEnabled = !pirMonitoringEnabled; return pirMonitoringEnabled ? 20 : 21; }
  return -1;
}

void setup() {
  Serial.begin(115200);

  pinMode(PIN_BUZZER, OUTPUT);
  digitalWrite(PIN_BUZZER, LOW);

  pinMode(PIN_RGB_RED, OUTPUT);
  pinMode(PIN_RGB_GREEN, OUTPUT);
  pinMode(PIN_RGB_BLUE, OUTPUT);
  setRgb(false, true, false);

  pinMode(PIN_TRIG, OUTPUT);
  digitalWrite(PIN_TRIG, LOW);
  pinMode(PIN_ECHO, INPUT);

  // Critical: INPUT_PULLDOWN stops false alarms when PIR is unplugged
  pinMode(PIN_PIR, INPUT_PULLDOWN);
  pinMode(PIN_LDR, INPUT);
  pinMode(PIN_SZ_HS100, INPUT);

  // Cloud Variables
  Particle.variable("temp",   currentTemp);
  Particle.variable("hum",    currentHum);
  Particle.variable("dist",   currentDist);
  Particle.variable("motion", currentMotion);
  Particle.variable("light",  currentLight);
  Particle.variable("szHum",  szHum);

  // Cloud Functions
  Particle.function("alarm", handleCloudCommand);
  Particle.function("cmd",   handleCloudCommand);

  // Sending and startup are completely silent
}

void loop() {
  Particle.process();

  static unsigned long lastSample = 0;
  unsigned long now = millis();

  if (now - lastSample >= 250) {
    lastSample = now;

    int rawPir = digitalRead(PIN_PIR);
    if (rawPir == 1 && pirMonitoringEnabled) {
      if (pirFilterCounter < 4) pirFilterCounter++;
    } else {
      if (pirFilterCounter > 0) pirFilterCounter--;
    }
    currentMotion = (pirMonitoringEnabled && pirFilterCounter >= 3) ? 1 : 0;

    currentDist  = readUltrasonicCm();
    currentLight = analogRead(PIN_LDR);

    if (currentDist > 0 && currentDist < 20) {
      setRgb(true, false, false);
      playMelodyAlert(); // Musical minor arpeggio melody strictly for proximity breach (<20cm)
    } else if (currentMotion == 1 && pirMonitoringEnabled) {
      setRgb(false, false, true); // Blue visual alert
      playMelodyMotion();
    } else {
      setRgb(false, true, false); // Green nominal
      digitalWrite(PIN_BUZZER, LOW);
    }
  }
}`;
  }

  renderPicoCode() {
    if (!this.txtPico) return;
    this.txtPico.value = `# SMART IOT HUB — RASPBERRY PI PICO W (MicroPython)
# Built by TekStep Apps Uganda (tekstepapps.org)

import network, urequests, ujson, time
from machine import Pin, ADC

WIFI_SSID = "YOUR_WIFI_SSID"
WIFI_PASS = "YOUR_WIFI_PASSWORD"
TELEMETRY_URL = "http://192.168.1.100:5173/api/telemetry?device=dev_picow"

trig = Pin(4, Pin.OUT)
echo = Pin(5, Pin.IN)
pir  = Pin(6, Pin.IN, Pin.PULL_DOWN)
adc_ldr = ADC(Pin(26))
adc_temp = ADC(Pin(27))

wlan = network.WLAN(network.STA_IF)
wlan.active(True)
wlan.connect(WIFI_SSID, WIFI_PASS)

while not wlan.isconnected():
    time.sleep(0.5)

print("[Pico W] Connected! IP:", wlan.ifconfig()[0])

def measure_distance():
    trig.low()
    time.sleep_us(2)
    trig.high()
    time.sleep_us(10)
    trig.low()
    timeout = 28000
    start = time.ticks_us()
    while echo.value() == 0:
        if time.ticks_diff(time.ticks_us(), start) > timeout: return 999.0
    echo_start = time.ticks_us()
    while echo.value() == 1:
        if time.ticks_diff(time.ticks_us(), echo_start) > timeout: return 999.0
    dur = time.ticks_diff(time.ticks_us(), echo_start)
    return (dur * 0.0343) / 2.0

while True:
    dist = measure_distance()
    motion = pir.value()
    light = adc_ldr.read_u16() >> 6
    temp_c = (adc_temp.read_u16() * 3.3 / 65535.0) * 100.0

    payload = {
        "deviceId": "dev_picow",
        "temperature": round(temp_c, 1),
        "humidity": 55.0,
        "distance": round(dist, 1),
        "motion": motion,
        "light": light
    }

    try:
        res = urequests.post(TELEMETRY_URL, json=payload, headers={"Content-Type": "application/json"})
        print("[Pico W] POST status:", res.status_code)
        res.close()
    except Exception as e:
        print("[Pico W] Error:", e)

    time.sleep(2.0)`;
  }
}

export const hardwareConnectGuide = new HardwareConnectGuide();
