# SmartRoom Cloud IoT Monitoring Dashboard

An ultra-modern, high-fidelity real-time telemetry and hardware monitoring dashboard designed for IoT microcontrollers, built with **Vite**, **Vanilla JavaScript**, and **CSS3**. Optimized for seamless one-click deployment on **Vercel**.

---

## 🌟 Key Features

- **Live Cloud Telemetry**: Real-time streaming from **ThingSpeak** channels and **Particle Cloud** REST APIs.
- **Dual Humidity Sensor Architecture**:
  - **DHT11 Digital Sensor**: Fast digital single-wire temperature & relative humidity.
  - **SZ-HS100 Analog Humidity Sensor**: Industrial-grade capacitive analog relative humidity probe connected to 12-bit ADC (Pin `A0`).
- **Real-Time Sensor Calibration Engine**:
  - Custom linear gain and offset correction.
  - Interactive two-point reference calibration curves for temperature, distance, and humidity.
  - Individual sensor On/Off isolation toggles.
- **Interactive 2D Board & Pinout Schematic**:
  - Visual pin mapping showing active connections, logic levels, and 5V tolerance.
  - Multi-board architecture support (Spark Core STM32F103, Arduino Uno, ESP32, Raspberry Pi Pico, and STM32 Nucleo).
- **Remote Cloud Actuation**:
  - Direct Particle Cloud function triggers (`alarm`, `cmd`) to silence alarms, test buzzers, cycle RGB indicator LEDs, and switch sensor modes.
- **Web Serial Direct USB Diagnostic**:
  - Live 115200 baud USB serial telemetry reader directly inside modern Chromium browsers.
- **Auditory Alerts & Synth Engine**:
  - Web Audio API synthesize real-time chime, beep, and alert tones upon proximity breaches (< 20 cm) or motion events.

---

## 🔌 Hardware Sensor Wiring Reference

| Sensor / Module | Signal Type | Spark Core Pin | Voltage / Notes |
| :--- | :--- | :--- | :--- |
| **SZ-HS100 Humidity** | Analog Out | **`A0`** | 0 - 3.3V DC Linear Analog RH (12-bit ADC) |
| **DHT11 Data** | Digital Bi-dir | **`D4`** | 3.3V / 5V Tolerant (10k Pull-up) |
| **HC-SR04 Trigger** | Digital Out | **`D0`** | 3.3V TTL Output Pulse (10µs) |
| **HC-SR04 Echo** | Digital In | **`D1`** | 5V Tolerant Input (Echo Pulse) |
| **HC-SR501 PIR Motion**| Digital In | **`D3`** | 3.3V Logic Level Output |
| **LDR Light Sensor** | Analog ADC | **`A1`** | Voltage divider 0 - 3.3V ADC |
| **RGB LED (Red)** | Digital Out | **`A5`** | Active HIGH (Proximity breach) |
| **RGB LED (Green)** | Digital Out | **`A6`** | Active HIGH (Safe room status) |
| **RGB LED (Blue)** | Digital Out | **`A7`** | Active HIGH (Motion alert) |
| **Alarm Buzzer** | Digital Out | **`D5`** | NPN Transistor Switch Driven |

### SZ-HS100 Connection Notes:
- **VCC (Red)**: Connect to Spark Core `3V3` pin (or `VIN 5V` with a 2/3 resistive voltage divider on the analog output).
- **GND (Black)**: Connect to Spark Core `GND`.
- **OUT (Green)**: Connect to Spark Core Pin **`A0`**.

---

## 🚀 Deploying to Vercel

This repository is pre-configured with [`vercel.json`](./vercel.json) for instant, zero-config deployment.

### 1-Click Import:
1. Push this repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) and click **Import Project**.
3. Select your repository.
4. Settings are detected automatically:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click **Deploy**. Your dashboard will be live on a global CDN URL in seconds!

---

## 💻 Local Development

### Prerequisites:
- Node.js (v18.0 or newer)
- npm or pnpm

### Setup:
```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build optimized production bundle
npm run build

# 4. Preview production build locally
npm run preview
```

---

## ⚙️ Cloud Configuration

In the dashboard navigation bar, click the **Settings / Cloud** icon to enter your credentials:

- **ThingSpeak Settings**:
  - Channel ID: `3****48` (or your custom channel)
  - Read API Key: Provided by your ThingSpeak channel
  - Write API Key: `2***************3`
- **Particle Cloud Settings**:
  - Device ID: Your Spark Core 24-character hex ID
  - Access Token: Particle Cloud personal access token

All credentials are saved securely in your browser's `localStorage` and never transmitted to third parties.

---

## 📄 License
MIT License. Created for the Smart Room Monitoring System Project.
