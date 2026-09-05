/**
 * Hardware Driver & Connection Assistant
 * Provides driver downloads, installation guides, troubleshooting checklist,
 * and automatic USB VID/PID microcontroller detection.
 */

export const DRIVER_DATABASE = [
  {
    id: 'ch340',
    name: 'WCH CH340 / CH341 USB-to-Serial Driver',
    chip: 'CH340G, CH340C, CH340E, CH341A',
    usedBy: 'Arduino Uno Clones, Arduino Nano Clones, ESP8266 NodeMCU, ESP32 Clones',
    description: 'The most popular USB-to-UART chip used on budget Arduino, ESP8266, and ESP32 boards.',
    downloads: [
      { os: 'Windows (11 / 10 / 8 / 7)', url: 'https://www.wch-ic.com/downloads/CH341SER_EXE.html', label: 'CH341SER.EXE (Auto-Installer)' },
      { os: 'macOS (Ventura / Sonoma / Sequoia)', url: 'https://www.wch-ic.com/downloads/CH341SER_MAC_ZIP.html', label: 'CH341SER_MAC.ZIP' },
      { os: 'Linux (Built-in kernel module)', url: 'https://github.com/juliagoda/CH341SER', label: 'Linux ch34x Kernel Driver' }
    ],
    installSteps: [
      'Download and run CH341SER.EXE as Administrator.',
      'Click the "INSTALL" button in the dialog window.',
      'Wait for the "Driver install success!" popup.',
      'Unplug and replug your board into the USB port.'
    ]
  },
  {
    id: 'cp2102',
    name: 'Silicon Labs CP2102 / CP2104 VCP Driver',
    chip: 'CP2102, CP2104, CP2108, CP2109',
    usedBy: 'NodeMCU v2, ESP32-WROOM Official Kits, STM32 Development Boards',
    description: 'High-speed Virtual COM Port (VCP) driver for high-performance ESP32 and IoT modules.',
    downloads: [
      { os: 'Windows (Universal 10/11)', url: 'https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers', label: 'CP210x Windows VCP Driver' },
      { os: 'macOS', url: 'https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers', label: 'CP210x macOS VCP Driver' }
    ],
    installSteps: [
      'Download the CP210x Universal Windows Driver zip.',
      'Extract the folder, right-click "silabser.inf" and select "Install".',
      'Restart the browser and connect your board.'
    ]
  },
  {
    id: 'ftdi',
    name: 'FTDI FT232R USB UART Driver',
    chip: 'FT232RL, FT232BL, FT2232D',
    usedBy: 'Genuine Arduino Nano, Arduino Mega 2560, Professional Industrial Boards',
    description: 'Standard FTDI Virtual COM Port driver for industrial microcontrollers and classic Arduino boards.',
    downloads: [
      { os: 'Windows Setup Executable', url: 'https://ftdichip.com/drivers/vcp-drivers/', label: 'CDM212364_Setup.exe' },
      { os: 'macOS & Linux', url: 'https://ftdichip.com/drivers/vcp-drivers/', label: 'FTDI VCP Downloads' }
    ],
    installSteps: [
      'Run the FTDI setup executable.',
      'Accept driver installation and plug in the FTDI USB device.'
    ]
  },
  {
    id: 'stm32_vcp',
    name: 'STM32 Virtual COM Port & DFU Driver',
    chip: 'STM32F103 (Blue Pill), STM32F401 (Black Pill), ST-Link v2',
    usedBy: 'STM32 Blue Pill, STM32 Black Pill, STM32 Nucleo Boards',
    description: 'Driver for STM32 USB-CDC communication and Zadig WinUSB driver for WebUSB browser flashing.',
    downloads: [
      { os: 'STM32 VCP Driver (STSW-STM32102)', url: 'https://www.st.com/en/development-tools/stsw-stm32102.html', label: 'STMicroelectronics Official VCP' },
      { os: 'Zadig WinUSB Tool (For WebUSB DFU)', url: 'https://zadig.akeo.ie/', label: 'Zadig 2.9 (WinUSB Flasher Setup)' }
    ],
    installSteps: [
      'For Serial Monitoring: Install STSW-STM32102 VCP driver.',
      'For Browser WebUSB Flashing: Open Zadig, click "Options -> List All Devices", select STM32 BOOTLOADER, select "WinUSB", and click "Replace Driver".'
    ]
  },
  {
    id: 'rp2040_pico',
    name: 'Raspberry Pi Pico (RP2040) USB CDC',
    chip: 'RP2040 Dual-Core ARM Cortex-M0+, RP2350',
    usedBy: 'Raspberry Pi Pico, Pico W, Maker Pi RP2040',
    description: 'Driverless on Windows 10/11, macOS, and Linux! Built-in USB CDC Serial and UF2 Mass Storage.',
    downloads: [
      { os: 'Raspberry Pi Pico UF2 Bootloader', url: 'https://datasheets.raspberrypi.com/pico/getting-started-with-pico.pdf', label: 'Pico Setup Guide (PDF)' }
    ],
    installSteps: [
      'No drivers required on Windows 10/11, macOS, or Linux.',
      'To enter Flashing Mode: Hold the white BOOTSEL button while plugging into USB.',
      'A drive named "RPI-RP2" will appear. Drag and drop any .uf2 binary to flash!'
    ]
  }
];

export const USB_VID_DATABASE = {
  0x1a86: { vendor: 'WCH (QinHeng Electronics)', chip: 'CH340 / CH341', defaultBoard: 'arduino_uno', label: 'Arduino Uno / Nano / ESP Clone' },
  0x10c4: { vendor: 'Silicon Labs', chip: 'CP2102 / CP2104', defaultBoard: 'esp32', label: 'ESP32 / NodeMCU Board' },
  0x2341: { vendor: 'Arduino SA', chip: 'Official ATmega USB', defaultBoard: 'arduino_uno', label: 'Genuine Arduino Board' },
  0x0483: { vendor: 'STMicroelectronics', chip: 'STM32 Virtual COM / DFU', defaultBoard: 'stm32_bluepill', label: 'STM32 Blue Pill / Nucleo' },
  0x2e8a: { vendor: 'Raspberry Pi Ltd', chip: 'RP2040 USB CDC', defaultBoard: 'raspberry_pi_pico', label: 'Raspberry Pi Pico (RP2040)' },
  0x1d50: { vendor: 'OpenMoko / Particle', chip: 'Spark Core / Photon', defaultBoard: 'spark_core', label: 'Spark Core / Particle Photon' },
  0x0403: { vendor: 'FTDI', chip: 'FT232R / FT2232', defaultBoard: 'arduino_nano', label: 'FTDI USB Serial (Arduino / DIY)' }
};

export class HardwareDriverAssistant {
  /**
   * Identifies device from WebSerial port info
   * @param {number} vendorId 
   * @param {number} productId 
   */
  identifyUsbDevice(vendorId, productId) {
    if (!vendorId) {
      return {
        matched: false,
        detail: 'Generic USB Serial device detected.'
      };
    }

    const entry = USB_VID_DATABASE[vendorId];
    if (entry) {
      return {
        matched: true,
        vendorId: '0x' + vendorId.toString(16).toUpperCase(),
        productId: productId ? '0x' + productId.toString(16).toUpperCase() : 'N/A',
        vendor: entry.vendor,
        chip: entry.chip,
        suggestedBoardId: entry.defaultBoard,
        boardLabel: entry.label,
        detail: `Recognized ${entry.vendor} (${entry.chip})`
      };
    }

    return {
      matched: false,
      vendorId: '0x' + vendorId.toString(16).toUpperCase(),
      productId: productId ? '0x' + productId.toString(16).toUpperCase() : 'N/A',
      detail: `Unregistered USB Vendor ID: 0x${vendorId.toString(16).toUpperCase()}`
    };
  }

  getTroubleshootingChecklist() {
    return [
      {
        title: 'Charge-Only USB Cable Warning',
        severity: 'high',
        detail: 'Over 80% of bench connection failures happen because the USB cable only has 2 power wires and lacks the D+ / D- data lines. Test your cable with a phone or mouse to confirm data transfer.'
      },
      {
        title: 'Port Busy / Access Denied Error',
        severity: 'medium',
        detail: 'Only one application can access a COM port at a time. Close the Arduino IDE Serial Monitor, PuTTY, Cura, or other serial monitors before connecting in the browser.'
      },
      {
        title: 'Missing Drivers in Device Manager',
        severity: 'medium',
        detail: 'On Windows, press Win+X -> Device Manager -> "Ports (COM & LPT)". If you see a yellow exclamation mark ⚠️ on "USB2.0-Serial", install the CH340 or CP2102 driver from this assistant.'
      },
      {
        title: 'Web Serial Browser Permissions',
        severity: 'low',
        detail: 'Ensure you are using Google Chrome, Microsoft Edge, or Opera. If prompted, click "Allow" on the USB permission pop-up.'
      },
      {
        title: 'Baud Rate Mismatch',
        severity: 'low',
        detail: 'If you receive garbled characters, match the baud rate selector to your firmware (typically 115200 for ESP32/STM32 or 9600 for classic Arduino).'
      }
    ];
  }
}

export const driverHelper = new HardwareDriverAssistant();
