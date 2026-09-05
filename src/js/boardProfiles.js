/**
 * Multi-Board Architecture Profiles & Universal Firmware Generator
 * Comprehensive definitions for Arduino, ESP32, ESP8266, STM32, Raspberry Pi, Particle, and Standalone DIP ICs.
 */

export const BOARD_PROFILES = {
  'spark_core': {
    id: 'spark_core',
    name: 'Spark Core (Particle)',
    family: 'Particle / Spark',
    arch: 'ARM Cortex-M3 (STM32F103CB)',
    voltage: '3.3V (5V Tolerant I/O)',
    flash: '128 KB',
    clock: '72 MHz',
    formFactor: '24-Pin DIP',
    defaultBaud: 115200,
    firmwareType: 'particle_cpp',
    pins: [
      { name: 'D0', type: 'digital', is5V: true,  desc: 'Digital I/O, PWM, 5V Tolerant' },
      { name: 'D1', type: 'digital', is5V: true,  desc: 'Digital I/O, PWM, 5V Tolerant' },
      { name: 'D2', type: 'digital', is5V: false, desc: 'Digital I/O, 3.3V Only' },
      { name: 'D3', type: 'digital', is5V: true,  desc: 'Digital I/O, 5V Tolerant' },
      { name: 'D4', type: 'digital', is5V: true,  desc: 'Digital I/O, 5V Tolerant' },
      { name: 'D5', type: 'digital', is5V: true,  desc: 'Digital I/O, 5V Tolerant' },
      { name: 'D6', type: 'digital', is5V: true,  desc: 'Digital I/O, 5V Tolerant' },
      { name: 'D7', type: 'digital', is5V: true,  desc: 'Digital I/O, LED, 5V Tolerant' },
      { name: 'A0', type: 'analog',  is5V: false, desc: '12-bit ADC, PWM, 3.3V Max' },
      { name: 'A1', type: 'analog',  is5V: false, desc: '12-bit ADC, PWM, 3.3V Max' },
      { name: 'A2', type: 'analog',  is5V: false, desc: '12-bit ADC, 3.3V Max' },
      { name: 'A3', type: 'analog',  is5V: false, desc: '12-bit ADC, 3.3V Max' },
      { name: 'A4', type: 'analog',  is5V: false, desc: '12-bit ADC, PWM, 3.3V Max' },
      { name: 'A5', type: 'analog',  is5V: false, desc: '12-bit ADC, PWM, 3.3V Max' },
      { name: 'A6', type: 'analog',  is5V: false, desc: '12-bit DAC, ADC, PWM, 3.3V Max' },
      { name: 'A7', type: 'analog',  is5V: false, desc: 'Wakeup, ADC, PWM, 3.3V Max' },
      { name: 'TX', type: 'serial',  is5V: true,  desc: 'USART Serial TX, 5V Tolerant' },
      { name: 'RX', type: 'serial',  is5V: true,  desc: 'USART Serial RX, 5V Tolerant' },
    ],
    defaultMapping: {
      dht11: 'D4',
      buzzer: 'D5',
      ultrasonic_trig: 'D0',
      ultrasonic_echo: 'D1',
      pir_motion: 'D3',
      rgb_red: 'A5',
      rgb_green: 'A6',
      rgb_blue: 'A7',
      ldr_light: 'A1',
      lm35_temp: 'A2',
      potentiometer: 'A0',
      sz_hs100: 'A0',
      btn_key1: 'D2',
      btn_key2: 'D6'
    }
  },

  'arduino_uno': {
    id: 'arduino_uno',
    name: 'Arduino Uno R3',
    family: 'Arduino',
    arch: 'ATmega328P (8-bit AVR)',
    voltage: '5V Native Logic',
    flash: '32 KB',
    clock: '16 MHz',
    formFactor: 'Arduino Standard Shield Header',
    defaultBaud: 115200,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'D0', type: 'serial',  is5V: true, desc: 'RX0 (Serial Receive)' },
      { name: 'D1', type: 'serial',  is5V: true, desc: 'TX0 (Serial Transmit)' },
      { name: 'D2', type: 'digital', is5V: true, desc: 'Digital I/O, Interrupt INT0' },
      { name: 'D3', type: 'digital', is5V: true, desc: 'Digital I/O, PWM, INT1' },
      { name: 'D4', type: 'digital', is5V: true, desc: 'Digital I/O' },
      { name: 'D5', type: 'digital', is5V: true, desc: 'Digital I/O, PWM' },
      { name: 'D6', type: 'digital', is5V: true, desc: 'Digital I/O, PWM' },
      { name: 'D7', type: 'digital', is5V: true, desc: 'Digital I/O' },
      { name: 'D8', type: 'digital', is5V: true, desc: 'Digital I/O' },
      { name: 'D9', type: 'digital', is5V: true, desc: 'Digital I/O, PWM' },
      { name: 'D10', type: 'digital', is5V: true, desc: 'Digital I/O, PWM, SPI SS' },
      { name: 'D11', type: 'digital', is5V: true, desc: 'Digital I/O, PWM, SPI MOSI' },
      { name: 'D12', type: 'digital', is5V: true, desc: 'Digital I/O, SPI MISO' },
      { name: 'D13', type: 'digital', is5V: true, desc: 'Digital I/O, Onboard LED, SPI SCK' },
      { name: 'A0', type: 'analog',  is5V: true, desc: 'Analog In 0 (10-bit ADC)' },
      { name: 'A1', type: 'analog',  is5V: true, desc: 'Analog In 1 (10-bit ADC)' },
      { name: 'A2', type: 'analog',  is5V: true, desc: 'Analog In 2 (10-bit ADC)' },
      { name: 'A3', type: 'analog',  is5V: true, desc: 'Analog In 3 (10-bit ADC)' },
      { name: 'A4', type: 'analog',  is5V: true, desc: 'Analog In 4 / I2C SDA' },
      { name: 'A5', type: 'analog',  is5V: true, desc: 'Analog In 5 / I2C SCL' },
    ],
    defaultMapping: {
      dht11: 'D4',
      buzzer: 'D5',
      ultrasonic_trig: 'D7',
      ultrasonic_echo: 'D8',
      pir_motion: 'D3',
      rgb_red: 'D9',
      rgb_green: 'D10',
      rgb_blue: 'D11',
      ldr_light: 'A1',
      lm35_temp: 'A2',
      potentiometer: 'A0',
      btn_key1: 'D2',
      btn_key2: 'D6'
    }
  },

  'arduino_nano': {
    id: 'arduino_nano',
    name: 'Arduino Nano V3',
    family: 'Arduino',
    arch: 'ATmega328P (8-bit AVR)',
    voltage: '5V Native Logic',
    flash: '32 KB',
    clock: '16 MHz',
    formFactor: '30-Pin DIP Module',
    defaultBaud: 115200,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'TX', type: 'serial',  is5V: true, desc: 'TXD (Pin 1)' },
      { name: 'RX', type: 'serial',  is5V: true, desc: 'RXD (Pin 2)' },
      { name: 'D2', type: 'digital', is5V: true, desc: 'Digital I/O, INT0' },
      { name: 'D3', type: 'digital', is5V: true, desc: 'Digital I/O, PWM, INT1' },
      { name: 'D4', type: 'digital', is5V: true, desc: 'Digital I/O' },
      { name: 'D5', type: 'digital', is5V: true, desc: 'Digital I/O, PWM' },
      { name: 'D6', type: 'digital', is5V: true, desc: 'Digital I/O, PWM' },
      { name: 'D7', type: 'digital', is5V: true, desc: 'Digital I/O' },
      { name: 'D8', type: 'digital', is5V: true, desc: 'Digital I/O' },
      { name: 'D9', type: 'digital', is5V: true, desc: 'Digital I/O, PWM' },
      { name: 'D10', type: 'digital', is5V: true, desc: 'Digital I/O, PWM' },
      { name: 'D11', type: 'digital', is5V: true, desc: 'Digital I/O, PWM' },
      { name: 'D12', type: 'digital', is5V: true, desc: 'Digital I/O' },
      { name: 'D13', type: 'digital', is5V: true, desc: 'Digital I/O, LED' },
      { name: 'A0', type: 'analog',  is5V: true, desc: 'Analog In 0' },
      { name: 'A1', type: 'analog',  is5V: true, desc: 'Analog In 1' },
      { name: 'A2', type: 'analog',  is5V: true, desc: 'Analog In 2' },
      { name: 'A3', type: 'analog',  is5V: true, desc: 'Analog In 3' },
      { name: 'A4', type: 'analog',  is5V: true, desc: 'Analog In 4 / SDA' },
      { name: 'A5', type: 'analog',  is5V: true, desc: 'Analog In 5 / SCL' },
      { name: 'A6', type: 'analog',  is5V: true, desc: 'Analog In 6 (Pure ADC)' },
      { name: 'A7', type: 'analog',  is5V: true, desc: 'Analog In 7 (Pure ADC)' },
    ],
    defaultMapping: {
      dht11: 'D4',
      buzzer: 'D5',
      ultrasonic_trig: 'D7',
      ultrasonic_echo: 'D8',
      pir_motion: 'D3',
      rgb_red: 'D9',
      rgb_green: 'D10',
      rgb_blue: 'D11',
      ldr_light: 'A1',
      lm35_temp: 'A2',
      potentiometer: 'A0',
      btn_key1: 'D2',
      btn_key2: 'D6'
    }
  },

  'arduino_mega': {
    id: 'arduino_mega',
    name: 'Arduino Mega 2560',
    family: 'Arduino',
    arch: 'ATmega2560 (8-bit AVR)',
    voltage: '5V Native Logic',
    flash: '256 KB',
    clock: '16 MHz',
    formFactor: 'Arduino Mega Shield Layout (54 I/O + 16 ADC)',
    defaultBaud: 115200,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'D2', type: 'digital', is5V: true, desc: 'PWM, INT4' },
      { name: 'D3', type: 'digital', is5V: true, desc: 'PWM, INT5' },
      { name: 'D4', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D5', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D6', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D7', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D8', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D9', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D10', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D11', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D12', type: 'digital', is5V: true, desc: 'PWM' },
      { name: 'D13', type: 'digital', is5V: true, desc: 'PWM, Onboard LED' },
      { name: 'D18', type: 'digital', is5V: true, desc: 'TX1 / INT3' },
      { name: 'D19', type: 'digital', is5V: true, desc: 'RX1 / INT2' },
      { name: 'D20', type: 'digital', is5V: true, desc: 'SDA / INT1' },
      { name: 'D21', type: 'digital', is5V: true, desc: 'SCL / INT0' },
      { name: 'D22', type: 'digital', is5V: true, desc: 'Digital Header 22' },
      { name: 'A0', type: 'analog',  is5V: true, desc: 'Analog In 0' },
      { name: 'A1', type: 'analog',  is5V: true, desc: 'Analog In 1' },
      { name: 'A2', type: 'analog',  is5V: true, desc: 'Analog In 2' },
      { name: 'A3', type: 'analog',  is5V: true, desc: 'Analog In 3' },
      { name: 'A4', type: 'analog',  is5V: true, desc: 'Analog In 4' },
      { name: 'A5', type: 'analog',  is5V: true, desc: 'Analog In 5' },
    ],
    defaultMapping: {
      dht11: 'D4',
      buzzer: 'D5',
      ultrasonic_trig: 'D7',
      ultrasonic_echo: 'D8',
      pir_motion: 'D3',
      rgb_red: 'D9',
      rgb_green: 'D10',
      rgb_blue: 'D11',
      ldr_light: 'A1',
      lm35_temp: 'A2',
      potentiometer: 'A0',
      btn_key1: 'D2',
      btn_key2: 'D6'
    }
  },

  'esp32': {
    id: 'esp32',
    name: 'ESP32 NodeMCU (WROOM-32)',
    family: 'ESP',
    arch: 'Xtensa Dual-Core 32-bit LX6',
    voltage: '3.3V Logic (NOT 5V Tolerant!)',
    flash: '4 MB',
    clock: '240 MHz',
    formFactor: '30/38-Pin DIP',
    defaultBaud: 115200,
    firmwareType: 'esp32_cpp',
    pins: [
      { name: 'GPIO4',  type: 'digital', is5V: false, desc: 'D4, ADC2_0, Touch 0' },
      { name: 'GPIO5',  type: 'digital', is5V: false, desc: 'D5, VSPI CS' },
      { name: 'GPIO12', type: 'digital', is5V: false, desc: 'D12, ADC2_5, Touch 5' },
      { name: 'GPIO13', type: 'digital', is5V: false, desc: 'D13, ADC2_4, Touch 4' },
      { name: 'GPIO14', type: 'digital', is5V: false, desc: 'D14, ADC2_6, Touch 6' },
      { name: 'GPIO15', type: 'digital', is5V: false, desc: 'D15, ADC2_3, Touch 3' },
      { name: 'GPIO16', type: 'digital', is5V: false, desc: 'RX2, UART2' },
      { name: 'GPIO17', type: 'digital', is5V: false, desc: 'TX2, UART2' },
      { name: 'GPIO18', type: 'digital', is5V: false, desc: 'VSPI SCK' },
      { name: 'GPIO19', type: 'digital', is5V: false, desc: 'VSPI MISO' },
      { name: 'GPIO21', type: 'digital', is5V: false, desc: 'I2C SDA' },
      { name: 'GPIO22', type: 'digital', is5V: false, desc: 'I2C SCL' },
      { name: 'GPIO23', type: 'digital', is5V: false, desc: 'VSPI MOSI' },
      { name: 'GPIO25', type: 'digital', is5V: false, desc: 'DAC1, ADC2_8' },
      { name: 'GPIO26', type: 'digital', is5V: false, desc: 'DAC2, ADC2_9' },
      { name: 'GPIO27', type: 'digital', is5V: false, desc: 'ADC2_7, Touch 7' },
      { name: 'GPIO32', type: 'analog',  is5V: false, desc: 'ADC1_4, Touch 9' },
      { name: 'GPIO33', type: 'analog',  is5V: false, desc: 'ADC1_5, Touch 8' },
      { name: 'GPIO34', type: 'analog',  is5V: false, desc: 'ADC1_6 (Input Only)' },
      { name: 'GPIO35', type: 'analog',  is5V: false, desc: 'ADC1_7 (Input Only)' },
      { name: 'GPIO36', type: 'analog',  is5V: false, desc: 'VP / ADC1_0 (Input Only)' },
      { name: 'GPIO39', type: 'analog',  is5V: false, desc: 'VN / ADC1_3 (Input Only)' },
    ],
    defaultMapping: {
      dht11: 'GPIO4',
      buzzer: 'GPIO5',
      ultrasonic_trig: 'GPIO18',
      ultrasonic_echo: 'GPIO19',
      pir_motion: 'GPIO13',
      rgb_red: 'GPIO25',
      rgb_green: 'GPIO26',
      rgb_blue: 'GPIO27',
      ldr_light: 'GPIO34',
      lm35_temp: 'GPIO35',
      potentiometer: 'GPIO32',
      btn_key1: 'GPIO14',
      btn_key2: 'GPIO15'
    }
  },

  'esp8266': {
    id: 'esp8266',
    name: 'ESP8266 NodeMCU (ESP-12E)',
    family: 'ESP',
    arch: 'Tensilica L106 32-bit',
    voltage: '3.3V Logic (NOT 5V Tolerant!)',
    flash: '4 MB',
    clock: '80 / 160 MHz',
    formFactor: '30-Pin NodeMCU DIP',
    defaultBaud: 115200,
    firmwareType: 'esp8266_cpp',
    pins: [
      { name: 'D0', type: 'digital', is5V: false, desc: 'GPIO16 (Wake from Deep Sleep)' },
      { name: 'D1', type: 'digital', is5V: false, desc: 'GPIO5 (I2C SCL)' },
      { name: 'D2', type: 'digital', is5V: false, desc: 'GPIO4 (I2C SDA)' },
      { name: 'D3', type: 'digital', is5V: false, desc: 'GPIO0 (Flash / 10k Pull-up)' },
      { name: 'D4', type: 'digital', is5V: false, desc: 'GPIO2 (Onboard Blue LED)' },
      { name: 'D5', type: 'digital', is5V: false, desc: 'GPIO14 (SPI SCK)' },
      { name: 'D6', type: 'digital', is5V: false, desc: 'GPIO12 (SPI MISO)' },
      { name: 'D7', type: 'digital', is5V: false, desc: 'GPIO13 (SPI MOSI / RX2)' },
      { name: 'D8', type: 'digital', is5V: false, desc: 'GPIO15 (SPI SS / 10k Pull-down)' },
      { name: 'A0', type: 'analog',  is5V: false, desc: 'ADC0 (1.0V Max ADC input)' },
      { name: 'TX', type: 'serial',  is5V: false, desc: 'GPIO1 (UART TX0)' },
      { name: 'RX', type: 'serial',  is5V: false, desc: 'GPIO3 (UART RX0)' },
    ],
    defaultMapping: {
      dht11: 'D4',
      buzzer: 'D5',
      ultrasonic_trig: 'D1',
      ultrasonic_echo: 'D2',
      pir_motion: 'D6',
      rgb_red: 'D7',
      rgb_green: 'D8',
      rgb_blue: 'D0',
      ldr_light: 'A0',
      lm35_temp: 'A0',
      potentiometer: 'A0',
      btn_key1: 'D3',
      btn_key2: 'RX'
    }
  },

  'stm32_bluepill': {
    id: 'stm32_bluepill',
    name: 'STM32F103C8T6 "Blue Pill"',
    family: 'STM32',
    arch: 'ARM Cortex-M3 32-bit',
    voltage: '3.3V Logic (5V Tolerant on FT Pins)',
    flash: '64 / 128 KB',
    clock: '72 MHz',
    formFactor: '40-Pin DIP Module',
    defaultBaud: 115200,
    firmwareType: 'stm32_cpp',
    pins: [
      { name: 'PA0', type: 'analog',  is5V: false, desc: 'ADC1_IN0, PWM, 3.3V Max' },
      { name: 'PA1', type: 'analog',  is5V: false, desc: 'ADC1_IN1, PWM, 3.3V Max' },
      { name: 'PA2', type: 'analog',  is5V: false, desc: 'ADC1_IN2, USART2_TX' },
      { name: 'PA3', type: 'analog',  is5V: false, desc: 'ADC1_IN3, USART2_RX' },
      { name: 'PA4', type: 'analog',  is5V: false, desc: 'ADC1_IN4, SPI1_NSS' },
      { name: 'PA5', type: 'analog',  is5V: false, desc: 'ADC1_IN5, SPI1_SCK' },
      { name: 'PA6', type: 'analog',  is5V: false, desc: 'ADC1_IN6, PWM' },
      { name: 'PA7', type: 'analog',  is5V: false, desc: 'ADC1_IN7, PWM' },
      { name: 'PA8', type: 'digital', is5V: true,  desc: 'FT: 5V Tolerant, PWM' },
      { name: 'PA9', type: 'serial',  is5V: true,  desc: 'FT: USART1_TX, 5V Tolerant' },
      { name: 'PA10', type: 'serial', is5V: true,  desc: 'FT: USART1_RX, 5V Tolerant' },
      { name: 'PB0', type: 'analog',  is5V: false, desc: 'ADC1_IN8, PWM' },
      { name: 'PB1', type: 'analog',  is5V: false, desc: 'ADC1_IN9, PWM' },
      { name: 'PB6', type: 'digital', is5V: true,  desc: 'FT: I2C1_SCL, 5V Tolerant' },
      { name: 'PB7', type: 'digital', is5V: true,  desc: 'FT: I2C1_SDA, 5V Tolerant' },
      { name: 'PB8', type: 'digital', is5V: true,  desc: 'FT: 5V Tolerant, PWM' },
      { name: 'PB9', type: 'digital', is5V: true,  desc: 'FT: 5V Tolerant, PWM' },
      { name: 'PC13', type: 'digital', is5V: false, desc: 'Onboard User LED (Active Low)' },
    ],
    defaultMapping: {
      dht11: 'PB8',
      buzzer: 'PB9',
      ultrasonic_trig: 'PA8',
      ultrasonic_echo: 'PB6',
      pir_motion: 'PB7',
      rgb_red: 'PA1',
      rgb_green: 'PA2',
      rgb_blue: 'PA3',
      ldr_light: 'PA4',
      lm35_temp: 'PA5',
      potentiometer: 'PA0',
      btn_key1: 'PA6',
      btn_key2: 'PA7'
    }
  },

  'stm32_blackpill': {
    id: 'stm32_blackpill',
    name: 'STM32F401/F411 "Black Pill"',
    family: 'STM32',
    arch: 'ARM Cortex-M4 with FPU',
    voltage: '3.3V Logic (5V Tolerant Pins)',
    flash: '512 KB',
    clock: '84 / 100 MHz',
    formFactor: '40-Pin DIP Module (USB-C)',
    defaultBaud: 115200,
    firmwareType: 'stm32_cpp',
    pins: [
      { name: 'PA0', type: 'analog',  is5V: false, desc: 'ADC1_0, User Button, WKUP' },
      { name: 'PA1', type: 'analog',  is5V: false, desc: 'ADC1_1, PWM' },
      { name: 'PA2', type: 'analog',  is5V: false, desc: 'ADC1_2, USART2_TX' },
      { name: 'PA3', type: 'analog',  is5V: false, desc: 'ADC1_3, USART2_RX' },
      { name: 'PA4', type: 'analog',  is5V: false, desc: 'ADC1_4' },
      { name: 'PA5', type: 'analog',  is5V: false, desc: 'ADC1_5, SPI1_SCK' },
      { name: 'PA6', type: 'analog',  is5V: false, desc: 'ADC1_6, PWM' },
      { name: 'PA7', type: 'analog',  is5V: false, desc: 'ADC1_7, PWM' },
      { name: 'PB0', type: 'analog',  is5V: false, desc: 'ADC1_8, PWM' },
      { name: 'PB1', type: 'analog',  is5V: false, desc: 'ADC1_9, PWM' },
      { name: 'PB6', type: 'digital', is5V: true,  desc: 'FT: 5V Tolerant, I2C1_SCL' },
      { name: 'PB7', type: 'digital', is5V: true,  desc: 'FT: 5V Tolerant, I2C1_SDA' },
      { name: 'PB8', type: 'digital', is5V: true,  desc: 'FT: 5V Tolerant, PWM' },
      { name: 'PB9', type: 'digital', is5V: true,  desc: 'FT: 5V Tolerant, PWM' },
      { name: 'PC13', type: 'digital', is5V: false, desc: 'User LED on C13' },
    ],
    defaultMapping: {
      dht11: 'PB8',
      buzzer: 'PB9',
      ultrasonic_trig: 'PA6',
      ultrasonic_echo: 'PB6',
      pir_motion: 'PB7',
      rgb_red: 'PA1',
      rgb_green: 'PA2',
      rgb_blue: 'PA3',
      ldr_light: 'PA4',
      lm35_temp: 'PA5',
      potentiometer: 'PA0',
      btn_key1: 'PB0',
      btn_key2: 'PB1'
    }
  },

  'raspberry_pi_pico': {
    id: 'raspberry_pi_pico',
    name: 'Raspberry Pi Pico (RP2040)',
    family: 'Raspberry Pi',
    arch: 'Dual ARM Cortex-M0+ (RP2040)',
    voltage: '3.3V Logic (NOT 5V Tolerant!)',
    flash: '2 MB',
    clock: '133 MHz',
    formFactor: '40-Pin DIP Module (Breadboard Friendly)',
    defaultBaud: 115200,
    firmwareType: 'pico_python',
    pins: [
      { name: 'GP0', type: 'digital', is5V: false, desc: 'UART0 TX, I2C0 SDA' },
      { name: 'GP1', type: 'digital', is5V: false, desc: 'UART0 RX, I2C0 SCL' },
      { name: 'GP2', type: 'digital', is5V: false, desc: 'SPI0 SCK, I2C1 SDA' },
      { name: 'GP3', type: 'digital', is5V: false, desc: 'SPI0 TX, I2C1 SCL' },
      { name: 'GP4', type: 'digital', is5V: false, desc: 'SPI0 RX, PWM2 A' },
      { name: 'GP5', type: 'digital', is5V: false, desc: 'SPI0 CSn, PWM2 B' },
      { name: 'GP6', type: 'digital', is5V: false, desc: 'PWM3 A' },
      { name: 'GP7', type: 'digital', is5V: false, desc: 'PWM3 B' },
      { name: 'GP8', type: 'digital', is5V: false, desc: 'UART1 TX, PWM4 A' },
      { name: 'GP9', type: 'digital', is5V: false, desc: 'UART1 RX, PWM4 B' },
      { name: 'GP14', type: 'digital', is5V: false, desc: 'PWM7 A' },
      { name: 'GP15', type: 'digital', is5V: false, desc: 'PWM7 B' },
      { name: 'GP16', type: 'digital', is5V: false, desc: 'SPI0 RX, PWM0 A' },
      { name: 'GP17', type: 'digital', is5V: false, desc: 'SPI0 CSn, PWM0 B' },
      { name: 'GP25', type: 'digital', is5V: false, desc: 'Onboard Green LED' },
      { name: 'GP26', type: 'analog',  is5V: false, desc: 'ADC0 (Channel 0)' },
      { name: 'GP27', type: 'analog',  is5V: false, desc: 'ADC1 (Channel 1)' },
      { name: 'GP28', type: 'analog',  is5V: false, desc: 'ADC2 (Channel 2)' },
    ],
    defaultMapping: {
      dht11: 'GP2',
      buzzer: 'GP3',
      ultrasonic_trig: 'GP4',
      ultrasonic_echo: 'GP5',
      pir_motion: 'GP6',
      rgb_red: 'GP14',
      rgb_green: 'GP15',
      rgb_blue: 'GP16',
      ldr_light: 'GP26',
      lm35_temp: 'GP27',
      potentiometer: 'GP28',
      btn_key1: 'GP7',
      btn_key2: 'GP8'
    }
  },

  'raspberry_pi_gpio': {
    id: 'raspberry_pi_gpio',
    name: 'Raspberry Pi 3/4/5 (40-Pin GPIO)',
    family: 'Raspberry Pi',
    arch: 'Broadcom 64-bit ARM Linux SBC',
    voltage: '3.3V Logic (Strictly 3.3V Only)',
    flash: 'MicroSD / NVMe',
    clock: '1.5 - 2.4 GHz',
    formFactor: '40-Pin Standard Dual-Row Header',
    defaultBaud: 115200,
    firmwareType: 'rpi_python',
    pins: [
      { name: 'GPIO2',  type: 'digital', is5V: false, desc: 'Pin 3: I2C1 SDA' },
      { name: 'GPIO3',  type: 'digital', is5V: false, desc: 'Pin 5: I2C1 SCL' },
      { name: 'GPIO4',  type: 'digital', is5V: false, desc: 'Pin 7: 1-Wire Pin' },
      { name: 'GPIO14', type: 'serial',  is5V: false, desc: 'Pin 8: UART0 TXD' },
      { name: 'GPIO15', type: 'serial',  is5V: false, desc: 'Pin 10: UART0 RXD' },
      { name: 'GPIO17', type: 'digital', is5V: false, desc: 'Pin 11: General I/O' },
      { name: 'GPIO18', type: 'digital', is5V: false, desc: 'Pin 12: Hardware PWM0' },
      { name: 'GPIO27', type: 'digital', is5V: false, desc: 'Pin 13: General I/O' },
      { name: 'GPIO22', type: 'digital', is5V: false, desc: 'Pin 15: General I/O' },
      { name: 'GPIO23', type: 'digital', is5V: false, desc: 'Pin 16: General I/O' },
      { name: 'GPIO24', type: 'digital', is5V: false, desc: 'Pin 18: General I/O' },
      { name: 'GPIO10', type: 'digital', is5V: false, desc: 'Pin 19: SPI0 MOSI' },
      { name: 'GPIO9',  type: 'digital', is5V: false, desc: 'Pin 21: SPI0 MISO' },
      { name: 'GPIO25', type: 'digital', is5V: false, desc: 'Pin 22: General I/O' },
      { name: 'GPIO11', type: 'digital', is5V: false, desc: 'Pin 23: SPI0 SCLK' },
      { name: 'GPIO8',  type: 'digital', is5V: false, desc: 'Pin 24: SPI0 CE0' },
    ],
    defaultMapping: {
      dht11: 'GPIO4',
      buzzer: 'GPIO18',
      ultrasonic_trig: 'GPIO23',
      ultrasonic_echo: 'GPIO24',
      pir_motion: 'GPIO17',
      rgb_red: 'GPIO27',
      rgb_green: 'GPIO22',
      rgb_blue: 'GPIO10',
      ldr_light: 'GPIO2',
      lm35_temp: 'GPIO3',
      potentiometer: 'GPIO25',
      btn_key1: 'GPIO9',
      btn_key2: 'GPIO11'
    }
  },

  'atmega328p_dip': {
    id: 'atmega328p_dip',
    name: 'ATmega328P Standalone 28-Pin DIP IC',
    family: 'Standalone DIP / ATmega',
    arch: 'AVR 8-bit Bare-Metal IC',
    voltage: '5V (or 3.3V @ 8MHz internal)',
    flash: '32 KB',
    clock: '16 MHz Crystal / 8MHz Int',
    formFactor: '28-Pin Skinny DIP (DIP-28)',
    defaultBaud: 9600,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'Pin 1 (PC6/RESET)', type: 'digital', is5V: true, desc: 'Pin 1: Hardware Reset (Pull to VCC)' },
      { name: 'Pin 2 (PD0/RXD)',   type: 'serial',  is5V: true, desc: 'Pin 2: Digital D0 / RXD' },
      { name: 'Pin 3 (PD1/TXD)',   type: 'serial',  is5V: true, desc: 'Pin 3: Digital D1 / TXD' },
      { name: 'Pin 4 (PD2/INT0)',  type: 'digital', is5V: true, desc: 'Pin 4: Digital D2 / INT0' },
      { name: 'Pin 5 (PD3/INT1)',  type: 'digital', is5V: true, desc: 'Pin 5: Digital D3 / PWM / INT1' },
      { name: 'Pin 6 (PD4/T0)',    type: 'digital', is5V: true, desc: 'Pin 6: Digital D4' },
      { name: 'Pin 11 (PD5/T1)',   type: 'digital', is5V: true, desc: 'Pin 11: Digital D5 / PWM' },
      { name: 'Pin 12 (PD6/AIN0)', type: 'digital', is5V: true, desc: 'Pin 12: Digital D6 / PWM' },
      { name: 'Pin 13 (PD7/AIN1)', type: 'digital', is5V: true, desc: 'Pin 13: Digital D7' },
      { name: 'Pin 14 (PB0/ICP1)', type: 'digital', is5V: true, desc: 'Pin 14: Digital D8' },
      { name: 'Pin 15 (PB1/OC1A)', type: 'digital', is5V: true, desc: 'Pin 15: Digital D9 / PWM' },
      { name: 'Pin 16 (PB2/SS)',   type: 'digital', is5V: true, desc: 'Pin 16: Digital D10 / PWM' },
      { name: 'Pin 17 (PB3/MOSI)', type: 'digital', is5V: true, desc: 'Pin 17: Digital D11 / PWM' },
      { name: 'Pin 18 (PB4/MISO)', type: 'digital', is5V: true, desc: 'Pin 18: Digital D12' },
      { name: 'Pin 19 (PB5/SCK)',  type: 'digital', is5V: true, desc: 'Pin 19: Digital D13 / User LED' },
      { name: 'Pin 23 (PC0/ADC0)', type: 'analog',  is5V: true, desc: 'Pin 23: Analog ADC0' },
      { name: 'Pin 24 (PC1/ADC1)', type: 'analog',  is5V: true, desc: 'Pin 24: Analog ADC1' },
      { name: 'Pin 25 (PC2/ADC2)', type: 'analog',  is5V: true, desc: 'Pin 25: Analog ADC2' },
      { name: 'Pin 26 (PC3/ADC3)', type: 'analog',  is5V: true, desc: 'Pin 26: Analog ADC3' },
      { name: 'Pin 27 (PC4/SDA)',  type: 'analog',  is5V: true, desc: 'Pin 27: Analog ADC4 / I2C SDA' },
      { name: 'Pin 28 (PC5/SCL)',  type: 'analog',  is5V: true, desc: 'Pin 28: Analog ADC5 / I2C SCL' },
    ],
    defaultMapping: {
      dht11: 'Pin 6 (PD4/T0)',
      buzzer: 'Pin 11 (PD5/T1)',
      ultrasonic_trig: 'Pin 13 (PD7/AIN1)',
      ultrasonic_echo: 'Pin 14 (PB0/ICP1)',
      pir_motion: 'Pin 5 (PD3/INT1)',
      rgb_red: 'Pin 15 (PB1/OC1A)',
      rgb_green: 'Pin 16 (PB2/SS)',
      rgb_blue: 'Pin 17 (PB3/MOSI)',
      ldr_light: 'Pin 24 (PC1/ADC1)',
      lm35_temp: 'Pin 25 (PC2/ADC2)',
      potentiometer: 'Pin 23 (PC0/ADC0)',
      btn_key1: 'Pin 4 (PD2/INT0)',
      btn_key2: 'Pin 12 (PD6/AIN0)'
    }
  },

  'attiny85_dip': {
    id: 'attiny85_dip',
    name: 'ATtiny85 Standalone 8-Pin DIP IC',
    family: 'Standalone DIP / ATmega',
    arch: 'AVR 8-bit Micro-IC',
    voltage: '2.7V - 5.5V Logic',
    flash: '8 KB',
    clock: '1 / 8 / 16 / 20 MHz',
    formFactor: '8-Pin Miniature DIP (DIP-8)',
    defaultBaud: 9600,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'PB0 (Pin 5)', type: 'digital', is5V: true, desc: 'Pin 5: MOSI, PWM, I2C SDA' },
      { name: 'PB1 (Pin 6)', type: 'digital', is5V: true, desc: 'Pin 6: MISO, PWM, Onboard LED' },
      { name: 'PB2 (Pin 7)', type: 'digital', is5V: true, desc: 'Pin 7: SCK, ADC1, I2C SCL' },
      { name: 'PB3 (Pin 2)', type: 'analog',  is5V: true, desc: 'Pin 2: XTAL1, ADC3' },
      { name: 'PB4 (Pin 3)', type: 'analog',  is5V: true, desc: 'Pin 3: XTAL2, ADC2, PWM' },
      { name: 'PB5 (Pin 1)', type: 'digital', is5V: true, desc: 'Pin 1: RESET / ADC0 (Weak)' },
    ],
    defaultMapping: {
      dht11: 'PB0 (Pin 5)',
      buzzer: 'PB1 (Pin 6)',
      ultrasonic_trig: 'PB2 (Pin 7)',
      ultrasonic_echo: 'PB3 (Pin 2)',
      pir_motion: 'PB4 (Pin 3)',
      rgb_red: 'PB0 (Pin 5)',
      rgb_green: 'PB1 (Pin 6)',
      rgb_blue: 'PB2 (Pin 7)',
      ldr_light: 'PB4 (Pin 3)',
      lm35_temp: 'PB3 (Pin 2)',
      potentiometer: 'PB2 (Pin 7)',
      btn_key1: 'PB0 (Pin 5)',
      btn_key2: 'PB4 (Pin 3)'
    }
  },

  'drone_mavlink': {
    id: 'drone_mavlink',
    name: 'Universal Kinematics Autopilot (Flight, Swim, Glide, Direct - MAVLink)',
    family: 'Multi-Domain Kinematics (Aero, Aqua, Glide, Direct)',
    arch: 'STM32H743 / F765 Flight & Navigation Controller',
    voltage: '5V BEC / 3.3V Logic',
    flash: '2 MB',
    clock: '480 MHz',
    formFactor: 'Universal Kinematics / Pixhawk Controller Header',
    defaultBaud: 57600,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'TELEM1_TX (Pin 2)', type: 'serial', is5V: false, desc: 'MAVLink Radio Telemetry TX (57600 baud)' },
      { name: 'TELEM1_RX (Pin 3)', type: 'serial', is5V: false, desc: 'MAVLink Radio Telemetry RX (57600 baud)' },
      { name: 'GPS_UART_TX',       type: 'serial', is5V: false, desc: 'U-blox NEO-M8N GPS TX' },
      { name: 'GPS_UART_RX',       type: 'serial', is5V: false, desc: 'U-blox NEO-M8N GPS RX' },
      { name: 'I2C_SDA (Compass)', type: 'digital',is5V: false, desc: 'External Mag / HMC5883L Compass' },
      { name: 'I2C_SCL (Compass)', type: 'digital',is5V: false, desc: 'External Mag / HMC5883L Compass' },
      { name: 'MOTOR_1_PWM',       type: 'digital',is5V: false, desc: 'ESC Motor 1 (Front Right CCW)' },
      { name: 'MOTOR_2_PWM',       type: 'digital',is5V: false, desc: 'ESC Motor 2 (Rear Left CCW)' },
      { name: 'MOTOR_3_PWM',       type: 'digital',is5V: false, desc: 'ESC Motor 3 (Front Left CW)' },
      { name: 'MOTOR_4_PWM',       type: 'digital',is5V: false, desc: 'ESC Motor 4 (Rear Right CW)' },
      { name: 'BATT_VOLT_ADC',     type: 'analog', is5V: false, desc: 'LiPo Main Voltage Divider ADC (3-6S)' },
      { name: 'BATT_CURR_ADC',     type: 'analog', is5V: false, desc: 'Hall-Effect Current Sensor ADC (0-100A)' },
      { name: 'ARM_BUZZER_PIN',    type: 'digital',is5V: true,  desc: 'Safety Disarm / Arm Warning Buzzer' },
      { name: 'OPTICAL_FLOW_RX',   type: 'serial', is5V: false, desc: 'Downward Rangefinder / LiDAR Echo' },
      { name: 'SAFETY_SWITCH',     type: 'digital',is5V: false, desc: 'Physical Hardware Safety Switch Button' }
    ],
    defaultMapping: {
      dht11: 'I2C_SDA (Compass)',
      buzzer: 'ARM_BUZZER_PIN',
      ultrasonic_trig: 'MOTOR_3_PWM',
      ultrasonic_echo: 'OPTICAL_FLOW_RX',
      pir_motion: 'SAFETY_SWITCH',
      rgb_red: 'MOTOR_1_PWM',
      rgb_green: 'MOTOR_2_PWM',
      rgb_blue: 'MOTOR_4_PWM',
      ldr_light: 'BATT_CURR_ADC',
      lm35_temp: 'BATT_VOLT_ADC',
      potentiometer: 'BATT_VOLT_ADC',
      btn_key1: 'SAFETY_SWITCH',
      btn_key2: 'MOTOR_1_PWM'
    }
  },

  'robotics_rover': {
    id: 'robotics_rover',
    name: 'Robotics Mobile Rover & AGV (ROS2 / ESP32-S3)',
    family: 'Robotics & AGVs',
    arch: 'Xtensa Dual-Core 32-bit LX7 (ESP32-S3)',
    voltage: '3.3V Logic / 12V Motor Driver',
    flash: '16 MB',
    clock: '240 MHz',
    formFactor: 'Mobile Rover Robotic Shield',
    defaultBaud: 115200,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'GPIO4 (Motor_L_PWM)', type: 'digital', is5V: false, desc: 'Left Drive Motor Speed PWM' },
      { name: 'GPIO5 (Motor_L_DIR)', type: 'digital', is5V: false, desc: 'Left Drive Direction H-Bridge' },
      { name: 'GPIO6 (Motor_R_PWM)', type: 'digital', is5V: false, desc: 'Right Drive Motor Speed PWM' },
      { name: 'GPIO7 (Motor_R_DIR)', type: 'digital', is5V: false, desc: 'Right Drive Direction H-Bridge' },
      { name: 'GPIO15 (Encoder_L)',  type: 'digital', is5V: false, desc: 'Left Optical Wheel Encoder Phase A' },
      { name: 'GPIO16 (Encoder_R)',  type: 'digital', is5V: false, desc: 'Right Optical Wheel Encoder Phase A' },
      { name: 'GPIO8 (LIDAR_TX)',    type: 'serial',  is5V: false, desc: '360° Laser ToF LiDAR Serial TX' },
      { name: 'GPIO9 (LIDAR_RX)',    type: 'serial',  is5V: false, desc: '360° Laser ToF LiDAR Serial RX' },
      { name: 'GPIO10 (Servo_Pan)',  type: 'digital', is5V: false, desc: 'Camera Turret Pan Servo (0-180°)' },
      { name: 'GPIO11 (Servo_Tilt)', type: 'digital', is5V: false, desc: 'Camera Turret Tilt Servo (0-90°)' },
      { name: 'GPIO1 (ADC_BATT)',    type: 'analog',  is5V: false, desc: '12V Rover Main Battery Voltage' },
      { name: 'GPIO2 (Obstacle_US)', type: 'digital', is5V: false, desc: 'Front Collision Ultrasonic Ping' }
    ],
    defaultMapping: {
      dht11: 'GPIO10 (Servo_Pan)',
      buzzer: 'GPIO5 (Motor_L_DIR)',
      ultrasonic_trig: 'GPIO2 (Obstacle_US)',
      ultrasonic_echo: 'GPIO16 (Encoder_R)',
      pir_motion: 'GPIO15 (Encoder_L)',
      rgb_red: 'GPIO4 (Motor_L_PWM)',
      rgb_green: 'GPIO6 (Motor_R_PWM)',
      rgb_blue: 'GPIO7 (Motor_R_DIR)',
      ldr_light: 'GPIO1 (ADC_BATT)',
      lm35_temp: 'GPIO1 (ADC_BATT)',
      potentiometer: 'GPIO1 (ADC_BATT)',
      btn_key1: 'GPIO15 (Encoder_L)',
      btn_key2: 'GPIO16 (Encoder_R)'
    }
  },

  'smart_agriculture': {
    id: 'smart_agriculture',
    name: 'Smart Agriculture 7-in-1 Soil & Weather Station',
    family: 'Agritech & Environment',
    arch: 'ARM Cortex-M4 STM32L476 Low-Power',
    voltage: '3.3V Solar MPPT / LiFePO4',
    flash: '512 KB',
    clock: '80 MHz',
    formFactor: 'IP67 Weatherproof Agritech Enclosure',
    defaultBaud: 9600,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'PA9 (RS485_TX)',    type: 'serial',  is5V: true, desc: 'Modbus RS485 TX (Soil NPK Sensor)' },
      { name: 'PA10 (RS485_RX)',   type: 'serial',  is5V: true, desc: 'Modbus RS485 RX (Soil NPK Sensor)' },
      { name: 'PB6 (I2C1_SCL)',    type: 'digital', is5V: true, desc: 'BME280 Ambient Temp/Hum/Baro SCL' },
      { name: 'PB7 (I2C1_SDA)',    type: 'digital', is5V: true, desc: 'BME280 Ambient Temp/Hum/Baro SDA' },
      { name: 'PA0 (Rain_Bucket)', type: 'digital', is5V: true, desc: 'Tipping Bucket Rain Gauge Pulse Interrupt' },
      { name: 'PA1 (Wind_Speed)',  type: 'digital', is5V: true, desc: 'Anemometer Cup Reed Switch Pulses' },
      { name: 'PA4 (Solar_Lux)',   type: 'analog',  is5V: false,desc: 'Solar Pyranometer Radiation ADC' },
      { name: 'PA5 (Soil_EC_ADC)', type: 'analog',  is5V: false,desc: 'Soil Electrical Conductivity ADC' },
      { name: 'PC13 (Valve_Relay)',type: 'digital', is5V: true, desc: '12V Irrigation Solenoid Valve Relay' }
    ],
    defaultMapping: {
      dht11: 'PB7 (I2C1_SDA)',
      buzzer: 'PC13 (Valve_Relay)',
      ultrasonic_trig: 'PA0 (Rain_Bucket)',
      ultrasonic_echo: 'PA1 (Wind_Speed)',
      pir_motion: 'PA0 (Rain_Bucket)',
      rgb_red: 'PA9 (RS485_TX)',
      rgb_green: 'PA10 (RS485_RX)',
      rgb_blue: 'PC13 (Valve_Relay)',
      ldr_light: 'PA4 (Solar_Lux)',
      lm35_temp: 'PA5 (Soil_EC_ADC)',
      potentiometer: 'PA5 (Soil_EC_ADC)',
      btn_key1: 'PA0 (Rain_Bucket)',
      btn_key2: 'PA1 (Wind_Speed)'
    }
  },

  'industrial_plc': {
    id: 'industrial_plc',
    name: 'Industrial PLC & Modbus RTU DIN Station',
    family: 'Industrial & Automation',
    arch: 'Cortex-M4 168MHz Industrial Gateway',
    voltage: '24V DC Industrial Bus / 3.3V Core',
    flash: '1 MB',
    clock: '168 MHz',
    formFactor: '35mm DIN-Rail Industrial Enclosure',
    defaultBaud: 19200,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'DI_1 (24V Opto)', type: 'digital', is5V: true, desc: '24V Optocoupled Digital Input 1 (Emergency Stop)' },
      { name: 'DI_2 (24V Opto)', type: 'digital', is5V: true, desc: '24V Optocoupled Digital Input 2 (Conveyor Sensor)' },
      { name: 'DO_1 (Relay_1)',  type: 'digital', is5V: true, desc: 'Form-C 10A Relay Output 1 (Motor Contactor)' },
      { name: 'DO_2 (Relay_2)',  type: 'digital', is5V: true, desc: 'Form-C 10A Relay Output 2 (Warning Beacon)' },
      { name: 'AI_1 (4-20mA)',   type: 'analog',  is5V: false,desc: '4-20mA Current Loop Loop-Powered Pressure Transmitter' },
      { name: 'AI_2 (0-10V)',    type: 'analog',  is5V: false,desc: '0-10V Analog Flow Rate Transmitter' },
      { name: 'RS485_A (+)',     type: 'serial',  is5V: true, desc: 'Modbus RTU RS485 Differential Data Positive' },
      { name: 'RS485_B (-)',     type: 'serial',  is5V: true, desc: 'Modbus RTU RS485 Differential Data Negative' }
    ],
    defaultMapping: {
      dht11: 'DI_2 (24V Opto)',
      buzzer: 'DO_2 (Relay_2)',
      ultrasonic_trig: 'DI_1 (24V Opto)',
      ultrasonic_echo: 'DI_2 (24V Opto)',
      pir_motion: 'DI_1 (24V Opto)',
      rgb_red: 'DO_1 (Relay_1)',
      rgb_green: 'DO_2 (Relay_2)',
      rgb_blue: 'DO_1 (Relay_1)',
      ldr_light: 'AI_2 (0-10V)',
      lm35_temp: 'AI_1 (4-20mA)',
      potentiometer: 'AI_2 (0-10V)',
      btn_key1: 'DI_1 (24V Opto)',
      btn_key2: 'DI_2 (24V Opto)'
    }
  },

  'cellular_gateway': {
    id: 'cellular_gateway',
    name: 'Cellular SIM / GSM / NB-IoT Gateway (SIM7000 / 4G)',
    family: 'Cellular & Wireless',
    arch: 'ESP32-WROVER + SIMCom SIM7000G LTE-CAT-M1',
    voltage: '3.7V LiPo / 3.3V Logic',
    flash: '8 MB',
    clock: '240 MHz',
    formFactor: 'Cellular IoT Breakout Board',
    defaultBaud: 115200,
    firmwareType: 'arduino_cpp',
    pins: [
      { name: 'GPIO27 (MODEM_TX)', type: 'serial',  is5V: false, desc: 'Hardware UART TX to SIM Modem (AT Commands)' },
      { name: 'GPIO26 (MODEM_RX)', type: 'serial',  is5V: false, desc: 'Hardware UART RX from SIM Modem' },
      { name: 'GPIO4 (MODEM_PWR)',  type: 'digital', is5V: false, desc: 'SIM Modem Power Key / Wakeup Pulse' },
      { name: 'GPIO23 (MODEM_RST)', type: 'digital', is5V: false, desc: 'SIM Modem Hardware Reset Pin' },
      { name: 'GPIO21 (I2C_SDA)',   type: 'digital', is5V: false, desc: 'I2C SDA Environmental Sensors' },
      { name: 'GPIO22 (I2C_SCL)',   type: 'digital', is5V: false, desc: 'I2C SCL Environmental Sensors' },
      { name: 'GPIO34 (VBAT_ADC)',  type: 'analog',  is5V: false, desc: 'LiPo Battery Voltage Monitor ADC' },
      { name: 'GPIO13 (NET_STATUS)',type: 'digital', is5V: false, desc: 'Cellular Network Registration LED Indicator' }
    ],
    defaultMapping: {
      dht11: 'GPIO21 (I2C_SDA)',
      buzzer: 'GPIO4 (MODEM_PWR)',
      ultrasonic_trig: 'GPIO13 (NET_STATUS)',
      ultrasonic_echo: 'GPIO26 (MODEM_RX)',
      pir_motion: 'GPIO13 (NET_STATUS)',
      rgb_red: 'GPIO4 (MODEM_PWR)',
      rgb_green: 'GPIO13 (NET_STATUS)',
      rgb_blue: 'GPIO23 (MODEM_RST)',
      ldr_light: 'GPIO34 (VBAT_ADC)',
      lm35_temp: 'GPIO34 (VBAT_ADC)',
      potentiometer: 'GPIO34 (VBAT_ADC)',
      btn_key1: 'GPIO13 (NET_STATUS)',
      btn_key2: 'GPIO4 (MODEM_PWR)'
    }
  }
};

/**
 * Universal Firmware Code Generator
 * Generates ready-to-flash Arduino C++, ESP-IDF C++, or MicroPython source code
 * based on the active board profile and pin assignments.
 */
export function generateBoardFirmware(boardId, pinMap) {
  const board = BOARD_PROFILES[boardId] || BOARD_PROFILES['arduino_uno'];

  if (board.firmwareType === 'pico_python' || board.firmwareType === 'rpi_python') {
    return generatePythonCode(board, pinMap);
  } else {
    return generateArduinoCppCode(board, pinMap);
  }
}

function cleanPin(val) {
  if (!val) return '2';
  // Extracts the identifier: e.g. "GPIO4" -> "4", "D4" -> "4", "Pin 6 (PD4/T0)" -> "4"
  const m = val.match(/Pin\s+\d+\s*\((?:P[A-D])?(\d+)/i) || val.match(/(?:GPIO|D|A|GP|PB|PC|PA)?(\d+)/i);
  return m ? m[1] : val;
}

function generateArduinoCppCode(board, map) {
  return `/* =========================================================================
 * Smart Room Sentinel Universal Firmware
 * Target Board: ${board.name} (${board.arch})
 * Logic Level : ${board.voltage}
 * Generated by Smart Room Sentinel Dashboard
 * ========================================================================= */

#include <Arduino.h>

// --- Pin Assignments for 9-in-1 Shield ---
#define PIN_DHT11       ${map.dht11 || '4'}
#define PIN_BUZZER      ${map.buzzer || '5'}
#define PIN_US_TRIG     ${map.ultrasonic_trig || '7'}
#define PIN_US_ECHO     ${map.ultrasonic_echo || '8'}
#define PIN_PIR         ${map.pir_motion || '3'}
#define PIN_RGB_R       ${map.rgb_red || '9'}
#define PIN_RGB_G       ${map.rgb_green || '10'}
#define PIN_RGB_B       ${map.rgb_blue || '11'}
#define PIN_LDR         ${map.ldr_light || 'A1'}
#define PIN_LM35        ${map.lm35_temp || 'A2'}
#define PIN_POT         ${map.potentiometer || 'A0'}
#define PIN_KEY1        ${map.btn_key1 || '2'}
#define PIN_KEY2        ${map.btn_key2 || '6'}

// --- Global Sensor Variables ---
float g_temperature = 24.0;
float g_humidity    = 55.0;
float g_distance    = 178.0;
int   g_motion      = 0;
int   g_light       = 620;

void setRgbColor(bool r, bool g, bool b) {
  digitalWrite(PIN_RGB_R, r ? HIGH : LOW);
  digitalWrite(PIN_RGB_G, g ? HIGH : LOW);
  digitalWrite(PIN_RGB_B, b ? HIGH : LOW);
}

void triggerAlarmBeep(int freq, int durationMs) {
  for (int i = 0; i < (durationMs / 2); i++) {
    digitalWrite(PIN_BUZZER, HIGH);
    delayMicroseconds(freq);
    digitalWrite(PIN_BUZZER, LOW);
    delayMicroseconds(freq);
  }
}

float measureUltrasonic() {
  digitalWrite(PIN_US_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_US_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_US_TRIG, LOW);
  long duration = pulseIn(PIN_US_ECHO, HIGH, 30000); // 30ms timeout
  if (duration <= 0) return 999.0;
  return (duration * 0.0343) / 2.0;
}

void setup() {
  Serial.begin(${board.defaultBaud});
  while (!Serial && millis() < 2500);

  Serial.println(F("[SENTINEL] Booting on ${board.name}..."));

  pinMode(PIN_BUZZER, OUTPUT);
  pinMode(PIN_US_TRIG, OUTPUT);
  pinMode(PIN_US_ECHO, INPUT);
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_KEY1, INPUT);
  pinMode(PIN_KEY2, INPUT);

  pinMode(PIN_RGB_R, OUTPUT);
  pinMode(PIN_RGB_G, OUTPUT);
  pinMode(PIN_RGB_B, OUTPUT);

  // Safe baseline indicator
  setRgbColor(false, true, false); // Green
  triggerAlarmBeep(600, 100);

  Serial.println(F("[SENTINEL] All 9 Sensor Lines Initialized. Telemetry Ready."));
}

void loop() {
  // Read ultrasonic proximity
  g_distance = measureUltrasonic();

  // Read PIR infrared motion
  g_motion = digitalRead(PIN_PIR);

  // Read light sensor ADC
  g_light = analogRead(PIN_LDR);

  // LM35 analog temperature: 10mV/°C
  int lm35Raw = analogRead(PIN_LM35);
  g_temperature = (lm35Raw * (${board.voltage.includes('3.3') ? '3.3' : '5.0'} / 1024.0)) * 100.0;

  // Security evaluation
  if (g_distance > 0 && g_distance < 20.0) {
    // Proximity Breach!
    setRgbColor(true, false, false); // Red
    triggerAlarmBeep(400, 120);
  } else if (g_motion == HIGH) {
    // Motion Alert
    setRgbColor(false, false, true); // Blue
  } else {
    // Secure
    setRgbColor(false, true, false); // Green
  }

  // Stream JSON telemetry to WebSerial / WebUSB
  Serial.print(F("{\\"temp\\":"));
  Serial.print(g_temperature, 1);
  Serial.print(F(",\\"hum\\":"));
  Serial.print(g_humidity, 1);
  Serial.print(F(",\\"dist\\":"));
  Serial.print(g_distance, 1);
  Serial.print(F(",\\"motion\\":"));
  Serial.print(g_motion);
  Serial.print(F(",\\"light\\":"));
  Serial.print(g_light);
  Serial.println(F("}"));

  delay(300);
}
`;
}

function generatePythonCode(board, map) {
  return `# =========================================================================
# Smart Room Sentinel MicroPython / CircuitPython Firmware
# Target Board: ${board.name} (${board.arch})
# =========================================================================

import time
from machine import Pin, PWM, ADC

# Pin Configurations
PIN_BUZZER  = ${cleanPin(map.buzzer) || '3'}
PIN_US_TRIG = ${cleanPin(map.ultrasonic_trig) || '4'}
PIN_US_ECHO = ${cleanPin(map.ultrasonic_echo) || '5'}
PIN_PIR     = ${cleanPin(map.pir_motion) || '6'}
PIN_RGB_R   = ${cleanPin(map.rgb_red) || '14'}
PIN_RGB_G   = ${cleanPin(map.rgb_green) || '15'}
PIN_RGB_B   = ${cleanPin(map.rgb_blue) || '16'}

# Initialize Actuators
buzzer = Pin(PIN_BUZZER, Pin.OUT)
trig   = Pin(PIN_US_TRIG, Pin.OUT)
echo   = Pin(PIN_US_ECHO, Pin.IN)
pir    = Pin(PIN_PIR, Pin.IN)

rgb_r = Pin(PIN_RGB_R, Pin.OUT)
rgb_g = Pin(PIN_RGB_G, Pin.OUT)
rgb_b = Pin(PIN_RGB_B, Pin.OUT)

print("[SENTINEL] MicroPython Sentinel Initialized on ${board.name}")

def measure_distance():
    trig.low()
    time.sleep_us(2)
    trig.high()
    time.sleep_us(10)
    trig.low()
    
    timeout = 30000
    start = time.ticks_us()
    while echo.value() == 0:
        if time.ticks_diff(time.ticks_us(), start) > timeout:
            return 999.0
    
    echo_start = time.ticks_us()
    while echo.value() == 1:
        if time.ticks_diff(time.ticks_us(), echo_start) > timeout:
            return 999.0
            
    duration = time.ticks_diff(time.ticks_us(), echo_start)
    return (duration * 0.0343) / 2.0

while True:
    dist = measure_distance()
    motion = pir.value()
    
    if dist < 20.0:
        rgb_r.value(1); rgb_g.value(0); rgb_b.value(1)
    elif motion == 1:
        rgb_r.value(0); rgb_g.value(0); rgb_b.value(1)
    else:
        rgb_r.value(0); rgb_g.value(1); rgb_b.value(0)
        
    print(f'{{"dist": {dist:.1f}, "motion": {motion}}}')
    time.sleep(0.3)
`;
}
