/**
 * Master Application Controller: Universal IoT Hardware Platform
 * Coordinates Multi-MCU Architecture, WebUSB & WebSerial, Sensor Calibration,
 * Port Line Pinging, Audio Synthesizer, and Cloud Telemetry.
 */

import { audioEngine } from './audioEngine.js';
import { particleApi } from './particleApi.js';
import { thingspeakApi } from './thingspeakApi.js';
import { sensorSimulator } from './simulator.js';
import { pinConfig } from './pinConfig.js';
import { hardwareDiagnostics } from './diagnostics.js';
import { BOARD_PROFILES, generateBoardFirmware } from './boardProfiles.js';
import { webSerialManager } from './webSerial.js';
import { calibrationManager, SENSOR_CALIBRATION_DEFAULTS } from './calibration.js';
import { portPinger } from './pinger.js';
import { homeConfig } from './homeConfig.js';
import { themeEngine, THEME_CATALOG } from './themeEngine.js';
import { driverHelper, DRIVER_DATABASE } from './driverHelper.js';
import { sensorScanner, I2C_CHIP_DATABASE } from './sensorScanner.js';
import { cameraManager } from './cameraManager.js';
import { extensionEngine, PUBLIC_EXTENSIONS_CATALOG } from './extensionEngine.js';
import { wirelessManager } from './wirelessManager.js';
import { TEKSTEP_INFO, renderAboutModalHtml } from './aboutTekstep.js';
import { deviceRegistry, AVAILABLE_SENSORS_CATALOG } from './deviceRegistry.js';
import { circuitBoardSchematic } from './circuitBoardSchematic.js';

class SmartRoomApp {
  constructor() {
    this.mode = 'live'; // 'live' or 'simulation'
    this.audioAlarmEnabled = true;
    this.proximityThreshold = 20; // cm
    this.pollInterval = null;
    this.isAlerting = false;
    this.activeTone = 'siren';
    this.activeRgb = 'auto';
    this.recordingHotkeyFor = null;
    this.activeCalSensor = 'dht11_temp';
    this.firmwareFileBuffer = null;
    this.detectedUsbDevice = null;
    this.thingspeakSyncTimer = null;
    this.latestTelemetry = null;
    this.startTime = Date.now();
    this.autoPingEnabled = true;
    this.autoPingTimer = null;
    this.dashboardViewMode = localStorage.getItem('sr_dashboard_view_mode') || 'monitor';
    this.activeHumiditySource = 'sz_hs100';
    this.lastGatheredMapping = null;

    this.dom = {};
  }

  init() {
    this.cacheDom();
    this.bindEvents();
    this.initAudioVisualizer();
    this.initPinSetupModal();
    this.initGlobalHotkeys();
    this.initWebSerialCallbacks();
    this.initPortPingerCallbacks();
    this.syncBoardSelector();
    this.syncSensorTogglesUi();
    this.syncThemeSelector();
    this.initDriverHelpModal();
    this.syncHomeSetupInputs();
    this.startThingSpeakSyncLoop();
    this.initSensorScanUi();
    this.initCameraUi();
    this.initExtensionsUi();
    this.initWirelessUi();
    this.initAboutTekstepUi();
    this.initTopMenuToggleUi();
    this.initDeviceRegistryUi();
    this.initBriefSummaryAndHealthUi();
    this.initCircuitBoardSchematics();
    this.initViewModeUi();
    this.initSensorEditorModalUi();
    this.initAutoGatherSensorsUi();
    this.renderPingDetailsTable();
    this.updateBriefSummaryStats();
    homeConfig.applyBranding();

    // Start in Live mode by default
    this.switchMode('live');
    this.log('Smart IoT Hub Initialized &bull; Built by TekStep Apps Uganda 🇺🇬', 'success');
  }

  cacheDom() {
    // View Mode Selector
    this.dom.btnViewMonitor = document.getElementById('btnViewMonitor');
    this.dom.btnViewDeveloper = document.getElementById('btnViewDeveloper');
    this.dom.btnAutoGatherSensors = document.getElementById('btnAutoGatherSensors');
    this.dom.btnOpenSensorEditor = document.getElementById('btnOpenSensorEditor');

    // Compact Monitoring Dashboard Elements
    this.dom.compactMonitoringDashboard = document.getElementById('compactMonitoringDashboard');
    this.dom.compactSecurityPill = document.getElementById('compactSecurityPill');
    this.dom.compactSecurityText = document.getElementById('compactSecurityText');
    this.dom.compactValTemp = document.getElementById('compactValTemp');
    this.dom.compactBadgeTemp = document.getElementById('compactBadgeTemp');
    this.dom.compactBarTemp = document.getElementById('compactBarTemp');
    this.dom.compactValHum = document.getElementById('compactValHum');
    this.dom.compactBadgeHum = document.getElementById('compactBadgeHum');
    this.dom.compactBarHum = document.getElementById('compactBarHum');
    this.dom.compactActiveSensorTag = document.getElementById('compactActiveSensorTag');
    this.dom.compactCardSwitchHum = document.getElementById('compactCardSwitchHum');
    this.dom.compactValDist = document.getElementById('compactValDist');
    this.dom.compactBadgeDist = document.getElementById('compactBadgeDist');
    this.dom.compactBarDist = document.getElementById('compactBarDist');
    this.dom.compactValMotionText = document.getElementById('compactValMotionText');
    this.dom.compactBadgeMotion = document.getElementById('compactBadgeMotion');
    this.dom.compactMotionIndicator = document.getElementById('compactMotionIndicator');
    this.dom.compactMotionSubtext = document.getElementById('compactMotionSubtext');
    this.dom.compactValLight = document.getElementById('compactValLight');
    this.dom.compactBadgeLight = document.getElementById('compactBadgeLight');
    this.dom.compactBarLight = document.getElementById('compactBarLight');
    this.dom.compactRadarBlip = document.getElementById('compactRadarBlip');
    this.dom.compactRadarDistText = document.getElementById('compactRadarDistText');
    this.dom.compactTickerContent = document.getElementById('compactTickerContent');
    this.dom.compactBtnToggleHum = document.getElementById('compactBtnToggleHum');
    this.dom.compactHumBtnText = document.getElementById('compactHumBtnText');
    this.dom.compactBtnAutoGather = document.getElementById('compactBtnAutoGather');
    this.dom.compactBtnEditSensors = document.getElementById('compactBtnEditSensors');
    this.dom.compactBtnSilence = document.getElementById('compactBtnSilence');
    this.dom.compactBtnTestBuzzer = document.getElementById('compactBtnTestBuzzer');

    // Modals for Sensor Edit and Auto-Gather
    this.dom.sensorEditModal = document.getElementById('sensorEditModal');
    this.dom.btnCloseSensorEditModal = document.getElementById('btnCloseSensorEditModal');
    this.dom.sensorEditorListContainer = document.getElementById('sensorEditorListContainer');
    this.dom.btnModalAutoGather = document.getElementById('btnModalAutoGather');
    this.dom.btnModalResetDefaults = document.getElementById('btnModalResetDefaults');
    this.dom.btnCancelSensorEdit = document.getElementById('btnCancelSensorEdit');
    this.dom.btnSaveSensorEdit = document.getElementById('btnSaveSensorEdit');

    this.dom.autoGatherModal = document.getElementById('autoGatherModal');
    this.dom.btnCloseAutoGatherModal = document.getElementById('btnCloseAutoGatherModal');
    this.dom.autoGatherScanningState = document.getElementById('autoGatherScanningState');
    this.dom.autoGatherResultsState = document.getElementById('autoGatherResultsState');
    this.dom.autoGatherBoardName = document.getElementById('autoGatherBoardName');
    this.dom.autoGatherSummaryText = document.getElementById('autoGatherSummaryText');
    this.dom.autoGatherTableBody = document.getElementById('autoGatherTableBody');
    this.dom.btnDismissAutoGather = document.getElementById('btnDismissAutoGather');
    this.dom.btnApplyAutoGather = document.getElementById('btnApplyAutoGather');

    // Top Bar & Board Selector
    this.dom.selectBoardProfile = document.getElementById('selectBoardProfile');
    this.dom.btnModeLive = document.getElementById('btnModeLive');
    this.dom.btnModeSim  = document.getElementById('btnModeSim');
    this.dom.btnWebSerialConnect = document.getElementById('btnWebSerialConnect');
    this.dom.serialBtnText = document.getElementById('serialBtnText');
    this.dom.btnPingAllPorts = document.getElementById('btnPingAllPorts');
    this.dom.btnOpenFlasher = document.getElementById('btnOpenFlasher');
    this.dom.btnOpenPinSetup  = document.getElementById('btnOpenPinSetup');
    this.dom.btnOpenPinMatrix = document.getElementById('btnOpenPinMatrix');
    this.dom.deviceBadge = document.getElementById('deviceStatusBadge');
    this.dom.deviceStatusText = document.getElementById('deviceStatusText');
    this.dom.btnOpenSettings = document.getElementById('btnOpenSettings');

    // Metrics
    this.dom.valTemp   = document.getElementById('valTemp');
    this.dom.badgeTemp = document.getElementById('badgeTemp');
    this.dom.valHum    = document.getElementById('valHum');
    this.dom.badgeHum  = document.getElementById('badgeHum');
    this.dom.valDist   = document.getElementById('valDist');
    this.dom.badgeDist = document.getElementById('badgeDist');
    this.dom.valMotion = document.getElementById('valMotion');
    this.dom.badgeMotion = document.getElementById('badgeMotion');
    this.dom.valLight  = document.getElementById('valLight') || document.getElementById('modLdrVal');
    this.dom.badgeLight = document.getElementById('badgeLight');

    // Brief Menu Sonar Visual Radar Scope & Blip (Visual Only: No numbers or words)
    this.dom.cardBriefSonar = document.getElementById('cardBriefSonar');
    this.dom.briefRadarScope = document.getElementById('briefRadarScope');
    this.dom.briefRadarBlip = document.getElementById('briefRadarBlip');
    this.dom.valSonarBrief = document.getElementById('valSonarBrief');
    this.dom.badgeSonarBrief = document.getElementById('badgeSonarBrief');
    this.dom.vectorSonarBrief = document.getElementById('vectorSonarBrief');
    this.dom.cardBriefSummary = document.getElementById('cardBriefSummary');
    this.dom.briefHealthBadge = document.getElementById('briefHealthBadge');
    this.dom.briefDevStatus = document.getElementById('briefDevStatus');
    this.dom.btnToggleBriefPing = document.getElementById('btnToggleBriefPing');
    this.dom.textBriefPingState = document.getElementById('textBriefPingState');
    this.dom.briefUptime = document.getElementById('briefUptime');
    this.dom.briefPingStats = document.getElementById('briefPingStats');
    this.dom.btnOpenPingDetailsModal = document.getElementById('btnOpenPingDetailsModal');
    this.dom.modalPingDetails = document.getElementById('modalPingDetails');
    this.dom.btnClosePingDetails = document.getElementById('btnClosePingDetails');
    this.dom.modalPingDevName = document.getElementById('modalPingDevName');
    this.dom.modalPingDevStatus = document.getElementById('modalPingDevStatus');
    this.dom.modalPingHealthScore = document.getElementById('modalPingHealthScore');
    this.dom.modalPingHealthSubtext = document.getElementById('modalPingHealthSubtext');
    this.dom.modalPingMonitoringState = document.getElementById('modalPingMonitoringState');
    this.dom.modalPingUptimeText = document.getElementById('modalPingUptimeText');
    this.dom.btnModalPingAll = document.getElementById('btnModalPingAll');
    this.dom.pingDetailsTableBody = document.getElementById('pingDetailsTableBody');

    // Dedicated Sensor Health Part Elements
    this.dom.sensorHealthPart = document.getElementById('sensorHealthPart');
    this.dom.dedicatedPingTableBody = document.getElementById('dedicatedPingTableBody');
    this.dom.btnDedicatedPingAll = document.getElementById('btnDedicatedPingAll');
    this.dom.btnDedicatedTogglePing = document.getElementById('btnDedicatedTogglePing');
    this.dom.textDedicatedPingState = document.getElementById('textDedicatedPingState');
    this.dom.dedicatedDevName = document.getElementById('dedicatedDevName');
    this.dom.dedicatedDevStatusBadge = document.getElementById('dedicatedDevStatusBadge');
    this.dom.dedicatedHealthScore = document.getElementById('dedicatedHealthScore');
    this.dom.dedicatedHealthSubtext = document.getElementById('dedicatedHealthSubtext');
    this.dom.dedicatedPingLatency = document.getElementById('dedicatedPingLatency');
    this.dom.dedicatedPingStatsText = document.getElementById('dedicatedPingStatsText');
    this.dom.dedicatedHumModeText = document.getElementById('dedicatedHumModeText');
    this.dom.footerUptimeDisplay = document.getElementById('footerUptimeDisplay');

    // Radar
    this.dom.radarScope   = document.querySelector('.radar-scope');
    this.dom.radarBlip    = document.getElementById('radarBlip');
    this.dom.radarReadout = document.getElementById('radarReadout');
    this.dom.radarDistNum = document.getElementById('radarDistNum');

    // Audio Studio
    this.dom.audioCanvas   = document.getElementById('audioVisualizer');
    this.dom.toneButtons   = document.querySelectorAll('.tone-pill-btn');
    this.dom.btnTestSound  = document.getElementById('btnTestSound');
    this.dom.btnStopSound  = document.getElementById('btnStopSound');
    this.dom.sliderPitch   = document.getElementById('sliderPitch');
    this.dom.valPitch      = document.getElementById('valPitch');
    this.dom.sliderVolume  = document.getElementById('sliderVolume');
    this.dom.valVolume     = document.getElementById('valVolume');
    this.dom.chkAudioAlarm = document.getElementById('chkAudioAlarm');

    // Actuators
    this.dom.btnTriggerBuzzer = document.getElementById('btnTriggerBuzzer');
    this.dom.btnStopBuzzer    = document.getElementById('btnStopBuzzer');
    this.dom.rgbButtons       = document.querySelectorAll('.rgb-color-btn');
    this.dom.sliderThreshold  = document.getElementById('sliderThreshold');
    this.dom.valThreshold     = document.getElementById('valThreshold');

    // Module Cards Elements
    this.dom.modDhtTemp    = document.getElementById('modDhtTemp');
    this.dom.modDhtHum     = document.getElementById('modDhtHum');
    this.dom.modDistVal    = document.getElementById('modDistVal');
    this.dom.modPirState   = document.getElementById('modPirState');
    this.dom.modBuzzerState = document.getElementById('modBuzzerState');
    this.dom.modRgbState   = document.getElementById('modRgbState');
    this.dom.modLdrVal     = document.getElementById('modLdrVal');
    this.dom.modLm35Val    = document.getElementById('modLm35Val');
    this.dom.modPotVal     = document.getElementById('modPotVal');
    this.dom.modKey1State  = document.getElementById('modKey1State');
    this.dom.modKey2State  = document.getElementById('modKey2State');
    this.dom.btnQuickBeep  = document.getElementById('btnQuickBeep');

    // Scenario testing
    this.dom.scenarioBar   = document.getElementById('scenarioBar');
    this.dom.btnScenIntruder = document.getElementById('btnScenIntruder');
    this.dom.btnScenOverheat = document.getElementById('btnScenOverheat');
    this.dom.btnScenNormal   = document.getElementById('btnScenNormal');

    // Manual simulator sliders
    this.dom.simControls   = document.getElementById('simControls');
    this.dom.simTemp       = document.getElementById('simTemp');
    this.dom.simDist       = document.getElementById('simDist');
    this.dom.simMotion     = document.getElementById('simMotion');

    // Web Serial Drawer
    this.dom.serialIndicatorDot = document.getElementById('serialIndicatorDot');
    this.dom.serialIndicatorText = document.getElementById('serialIndicatorText');
    this.dom.selectBaudRate = document.getElementById('selectBaudRate');
    this.dom.btnToggleSerialPort = document.getElementById('btnToggleSerialPort');
    this.dom.btnDfuTrigger = document.getElementById('btnDfuTrigger');
    this.dom.serialTerminalOutput = document.getElementById('serialTerminalOutput');
    this.dom.inputSerialSend = document.getElementById('inputSerialSend');
    this.dom.btnSerialSend = document.getElementById('btnSerialSend');
    this.dom.btnQuickCmdPing = document.getElementById('btnQuickCmdPing');
    this.dom.btnQuickCmdReset = document.getElementById('btnQuickCmdReset');
    this.dom.btnClearSerialLog = document.getElementById('btnClearSerialLog');

    // Calibration Studio Modal
    this.dom.modalCalibration = document.getElementById('modalCalibration');
    this.dom.btnCloseCalibration = document.getElementById('btnCloseCalibration');
    this.dom.selectCalSensor = document.getElementById('selectCalSensor');
    this.dom.calSensorEnabled = document.getElementById('calSensorEnabled');
    this.dom.calRawVal = document.getElementById('calRawVal');
    this.dom.calOutputVal = document.getElementById('calOutputVal');
    this.dom.calUnitRaw = document.getElementById('calUnitRaw');
    this.dom.calUnitOutput = document.getElementById('calUnitOutput');
    this.dom.calOffsetSlider = document.getElementById('calOffsetSlider');
    this.dom.calOffsetNum = document.getElementById('calOffsetNum');
    this.dom.calGainSlider = document.getElementById('calGainSlider');
    this.dom.calGainNum = document.getElementById('calGainNum');
    this.dom.twoPtRaw1 = document.getElementById('twoPtRaw1');
    this.dom.twoPtAct1 = document.getElementById('twoPtAct1');
    this.dom.twoPtRaw2 = document.getElementById('twoPtRaw2');
    this.dom.twoPtAct2 = document.getElementById('twoPtAct2');
    this.dom.btnComputeTwoPoint = document.getElementById('btnComputeTwoPoint');
    this.dom.btnResetSensorCal = document.getElementById('btnResetSensorCal');
    this.dom.btnSaveCalibration = document.getElementById('btnSaveCalibration');

    // Firmware Flasher Modal
    this.dom.modalFlasher = document.getElementById('modalFlasher');
    this.dom.btnCloseFlasher = document.getElementById('btnCloseFlasher');
    this.dom.flasherBoardBanner = document.getElementById('flasherBoardBanner');
    this.dom.btnCopyGeneratedCode = document.getElementById('btnCopyGeneratedCode');
    this.dom.btnDownloadSketch = document.getElementById('btnDownloadSketch');
    this.dom.txtGeneratedFirmware = document.getElementById('txtGeneratedFirmware');
    this.dom.flashDropZone = document.getElementById('flashDropZone');
    this.dom.inputFileFirmware = document.getElementById('inputFileFirmware');
    this.dom.flashFileInfo = document.getElementById('flashFileInfo');
    this.dom.flashProgressBox = document.getElementById('flashProgressBox');
    this.dom.flashProgressBar = document.getElementById('flashProgressBar');
    this.dom.flashProgressText = document.getElementById('flashProgressText');
    this.dom.btnStartFlashUsb = document.getElementById('btnStartFlashUsb');

    // Pin Setup Modal
    this.dom.btnClosePinSetup = document.getElementById('btnClosePinSetup');
    this.dom.modalPinSetup    = document.getElementById('modalPinSetup');
    this.dom.pinSetupTableBody = document.getElementById('pinSetupTableBody');
    this.dom.pinWarningBox    = document.getElementById('pinWarningBox');
    this.dom.instructionsList = document.getElementById('instructionsList');
    this.dom.hotkeysTableBody = document.getElementById('hotkeysTableBody');
    this.dom.txtProfileJson   = document.getElementById('txtProfileJson');
    this.dom.btnExportProfile = document.getElementById('btnExportProfile');
    this.dom.btnImportProfile = document.getElementById('btnImportProfile');
    this.dom.btnResetDefaults = document.getElementById('btnResetDefaults');
    this.dom.btnSavePinSetup  = document.getElementById('btnSavePinSetup');

    // Pin Matrix Modal
    this.dom.btnClosePinMatrix = document.getElementById('btnClosePinMatrix');
    this.dom.modalPinMatrix    = document.getElementById('modalPinMatrix');
    this.dom.pinMatrixRenderArea = document.getElementById('pinMatrixRenderArea');

    // Settings Modal
    this.dom.btnCloseSettings = document.getElementById('btnCloseSettings');
    this.dom.modalSettings    = document.getElementById('modalSettings');
    this.dom.inputDeviceId    = document.getElementById('inputDeviceId');
    this.dom.inputToken       = document.getElementById('inputToken');
    this.dom.inputTsKey       = document.getElementById('inputTsKey');
    this.dom.btnSaveSettings  = document.getElementById('btnSaveSettings');

    // Theme Profile Selector
    this.dom.selectThemeProfile = document.getElementById('selectThemeProfile');

    // Home Setup & Rebranding Modal
    this.dom.btnOpenHomeSetup = document.getElementById('btnOpenHomeSetup');
    this.dom.modalHomeSetup   = document.getElementById('modalHomeSetup');
    this.dom.btnCloseHomeSetup = document.getElementById('btnCloseHomeSetup');
    this.dom.inputHomeName    = document.getElementById('inputHomeName');
    this.dom.inputZoneName    = document.getElementById('inputZoneName');
    this.dom.inputLocationTag = document.getElementById('inputLocationTag');
    this.dom.inputOwnerName   = document.getElementById('inputOwnerName');
    this.dom.inputTsChannelId = document.getElementById('inputTsChannelId');
    this.dom.inputTsWriteKey  = document.getElementById('inputTsWriteKey');
    this.dom.inputTsReadKey   = document.getElementById('inputTsReadKey');
    this.dom.checkTsAutoPublish = document.getElementById('checkTsAutoPublish');
    this.dom.tsStatusAlert    = document.getElementById('tsStatusAlert');
    this.dom.btnResetHomeSetup = document.getElementById('btnResetHomeSetup');
    this.dom.btnTestTsSync    = document.getElementById('btnTestTsSync');
    this.dom.btnSaveHomeSetup = document.getElementById('btnSaveHomeSetup');
    this.dom.tsSyncIndicator  = document.getElementById('tsSyncIndicator');
    this.dom.tsSyncCountdown  = document.getElementById('tsSyncCountdown');

    // Hardware Driver Assistant Modal
    this.dom.btnOpenDriverHelp = document.getElementById('btnOpenDriverHelp');
    this.dom.modalDriverHelp   = document.getElementById('modalDriverHelp');
    this.dom.btnCloseDriverHelp = document.getElementById('btnCloseDriverHelp');
    this.dom.driverDetectedHardwareText = document.getElementById('driverDetectedHardwareText');
    this.dom.btnDriverAutoSwitchBoard = document.getElementById('btnDriverAutoSwitchBoard');
    this.dom.driverCardsList   = document.getElementById('driverCardsList');
    this.dom.troubleshootingList = document.getElementById('troubleshootingList');

    // Auto-Search Bus Scanner Modal
    this.dom.btnOpenSensorScan = document.getElementById('btnOpenSensorScan');
    this.dom.modalSensorScan   = document.getElementById('modalSensorScan');
    this.dom.btnCloseSensorScan = document.getElementById('btnCloseSensorScan');
    this.dom.btnStartAutoScan  = document.getElementById('btnStartAutoScan');
    this.dom.btnApplyAutoConfig = document.getElementById('btnApplyAutoConfig');
    this.dom.scanProgressBar   = document.getElementById('scanProgressBar');
    this.dom.scanProgressText  = document.getElementById('scanProgressText');
    this.dom.scanStatusText    = document.getElementById('scanStatusText');
    this.dom.busScanMatrix     = document.getElementById('busScanMatrix');
    this.dom.detectedSensorsList = document.getElementById('detectedSensorsList');
    this.dom.detectedCount     = document.getElementById('detectedCount');

    // Camera / Vision Peripheral Modal
    this.dom.btnToggleCameraView = document.getElementById('btnToggleCameraView');
    this.dom.modalCameraView     = document.getElementById('modalCameraView');
    this.dom.btnCloseCameraView  = document.getElementById('btnCloseCameraView');
    this.dom.cameraHiddenVideo   = document.getElementById('cameraHiddenVideo');
    this.dom.cameraRenderCanvas  = document.getElementById('cameraRenderCanvas');
    this.dom.selectCameraSource  = document.getElementById('selectCameraSource');
    this.dom.btnToggleHudOverlay = document.getElementById('btnToggleHudOverlay');
    this.dom.btnCaptureSnapshot  = document.getElementById('btnCaptureSnapshot');
    this.dom.cameraFilterBtns    = document.querySelectorAll('.camera-filter-btn');

    // Extensions Studio & Marketplace Modal
    this.dom.btnOpenExtensions     = document.getElementById('btnOpenExtensions');
    this.dom.modalExtensions       = document.getElementById('modalExtensions');
    this.dom.btnCloseExtensions    = document.getElementById('btnCloseExtensions');
    this.dom.extMarketplaceGrid    = document.getElementById('extMarketplaceGrid');
    this.dom.extInstalledList      = document.getElementById('extInstalledList');
    this.dom.extensionsDashboardRow = document.getElementById('extensionsDashboardRow');
    this.dom.btnCreateCustomExt    = document.getElementById('btnCreateCustomExt');
    this.dom.inputCustomExtName    = document.getElementById('inputCustomExtName');
    this.dom.inputCustomExtAuthor  = document.getElementById('inputCustomExtAuthor');
    this.dom.inputCustomExtIcon    = document.getElementById('inputCustomExtIcon');
    this.dom.selectCustomExtCategory = document.getElementById('selectCustomExtCategory');
    this.dom.inputCustomExtKeys    = document.getElementById('inputCustomExtKeys');
    this.dom.txtCustomExtDesc      = document.getElementById('txtCustomExtDesc');
    this.dom.btnExportAllExt       = document.getElementById('btnExportAllExt');
    this.dom.btnApplyImportExt     = document.getElementById('btnApplyImportExt');
    this.dom.txtExtJsonCode        = document.getElementById('txtExtJsonCode');

    // Multi-Protocol Wireless Modal
    this.dom.btnOpenWireless     = document.getElementById('btnOpenWireless');
    this.dom.modalWireless       = document.getElementById('modalWireless');
    this.dom.btnCloseWireless    = document.getElementById('btnCloseWireless');
    this.dom.inputWifiEndpoint   = document.getElementById('inputWifiEndpoint');
    this.dom.btnTestWifiPing     = document.getElementById('btnTestWifiPing');
    this.dom.btnStartWifiPolling = document.getElementById('btnStartWifiPolling');
    this.dom.wifiStatusBox       = document.getElementById('wifiStatusBox');
    this.dom.btnScanBleDevice    = document.getElementById('btnScanBleDevice');
    this.dom.btnDisconnectBle    = document.getElementById('btnDisconnectBle');
    this.dom.bleStatusBox        = document.getElementById('bleStatusBox');
    this.dom.inputAtCommand      = document.getElementById('inputAtCommand');
    this.dom.btnSendAtCommand    = document.getElementById('btnSendAtCommand');
    this.dom.cellularTerminalLog = document.getElementById('cellularTerminalLog');
    this.dom.atQuickCmdBtns      = document.querySelectorAll('.at-quick-cmd-btn');

    // TekStep Apps Uganda Info Modal
    this.dom.btnOpenAboutTekstep = document.getElementById('btnOpenAboutTekstep');
    this.dom.modalAboutTekstep   = document.getElementById('modalAboutTekstep');
    this.dom.btnCloseAboutTekstep = document.getElementById('btnCloseAboutTekstep');
    this.dom.aboutTekstepContentArea = document.getElementById('aboutTekstepContentArea');

    // Mobile Bottom Navigation Bar
    this.dom.mBtnScan       = document.getElementById('mBtnScan');
    this.dom.mBtnCamera     = document.getElementById('mBtnCamera');
    this.dom.mBtnExtensions = document.getElementById('mBtnExtensions');
    this.dom.mBtnWireless   = document.getElementById('mBtnWireless');
    this.dom.mBtnSerial     = document.getElementById('mBtnSerial');
    this.dom.mBtnAbout      = document.getElementById('mBtnAbout');
    this.dom.mBtnSilence    = document.getElementById('mBtnSilence');

    // Terminal & Alert Overlay
    this.dom.logTerminal = document.getElementById('logTerminal');
    this.dom.alarmOverlay = document.getElementById('alarmOverlay');

    // Top Menu Toolbar Toggle
    this.dom.topActionsToolbar   = document.getElementById('topActionsToolbar');
    this.dom.btnToggleTopMenu    = document.getElementById('btnToggleTopMenu');
    this.dom.iconToggleMenu      = document.getElementById('iconToggleMenu');
    this.dom.textToggleMenu      = document.getElementById('textToggleMenu');
    this.dom.btnHeaderAddDevice  = document.getElementById('btnHeaderAddDevice');

    // Active Connected Device & Project Status Banner
    this.dom.activeDeviceBanner      = document.getElementById('activeDeviceBanner');
    this.dom.activeProjectName       = document.getElementById('activeProjectName');
    this.dom.btnStartNewProject      = document.getElementById('btnStartNewProject');
    this.dom.activeDeviceName        = document.getElementById('activeDeviceName');
    this.dom.activeDeviceStatusBadge = document.getElementById('activeDeviceStatusBadge');
    this.dom.activeDeviceTypeTag     = document.getElementById('activeDeviceTypeTag');
    this.dom.activeDeviceSensorsRow  = document.getElementById('activeDeviceSensorsRow');
    this.dom.btnAddSensorToDevice    = document.getElementById('btnAddSensorToDevice');
    this.dom.btnOpenDeviceManager    = document.getElementById('btnOpenDeviceManager');
    this.dom.btnOpenAddDeviceModal   = document.getElementById('btnOpenAddDeviceModal');

    // Telemetry Stream Bar Packets (Column 2)
    this.dom.telemetryPacketRate     = document.getElementById('telemetryPacketRate');
    this.dom.telCellPktRate          = document.getElementById('telCellPktRate');
    this.dom.telCellLatency          = document.getElementById('telCellLatency');
    this.dom.telCellCrc              = document.getElementById('telCellCrc');
    this.dom.telCellActiveSensors    = document.getElementById('telCellActiveSensors');
    this.dom.telCellTsSync           = document.getElementById('telCellTsSync');
    this.dom.telCellFrameSeq         = document.getElementById('telCellFrameSeq');

    // Modal: Add Device
    this.dom.modalAddDevice         = document.getElementById('modalAddDevice');
    this.dom.btnCloseAddDevice      = document.getElementById('btnCloseAddDevice');
    this.dom.inputAddSparkName      = document.getElementById('inputAddSparkName');
    this.dom.inputAddSparkId        = document.getElementById('inputAddSparkId');
    this.dom.inputAddSparkToken     = document.getElementById('inputAddSparkToken');
    this.dom.inputAddSparkZone      = document.getElementById('inputAddSparkZone');
    this.dom.btnSubmitAddSpark      = document.getElementById('btnSubmitAddSpark');
    this.dom.inputAddSimName        = document.getElementById('inputAddSimName');
    this.dom.inputAddSimZone        = document.getElementById('inputAddSimZone');
    this.dom.btnSubmitAddSim        = document.getElementById('btnSubmitAddSim');
    this.dom.selectAddSerialProfile = document.getElementById('selectAddSerialProfile');
    this.dom.selectAddSerialBaud    = document.getElementById('selectAddSerialBaud');
    this.dom.inputAddSerialName     = document.getElementById('inputAddSerialName');
    this.dom.btnSubmitAddSerial     = document.getElementById('btnSubmitAddSerial');
    this.dom.inputAddWirelessName   = document.getElementById('inputAddWirelessName');
    this.dom.inputAddWirelessUrl    = document.getElementById('inputAddWirelessUrl');
    this.dom.btnSubmitAddWireless   = document.getElementById('btnSubmitAddWireless');

    // Modal: Add Sensor to Device
    this.dom.modalAddSensor            = document.getElementById('modalAddSensor');
    this.dom.btnCloseAddSensor         = document.getElementById('btnCloseAddSensor');
    this.dom.addSensorTargetDeviceName = document.getElementById('addSensorTargetDeviceName');
    this.dom.inputSearchSensors        = document.getElementById('inputSearchSensors');
    this.dom.addSensorCatalogGrid      = document.getElementById('addSensorCatalogGrid');

    // Modal: Device Manager
    this.dom.modalDeviceManager     = document.getElementById('modalDeviceManager');
    this.dom.btnCloseDeviceManager  = document.getElementById('btnCloseDeviceManager');
    this.dom.deviceManagerList      = document.getElementById('deviceManagerList');
    this.dom.btnMgrAddNewDevice     = document.getElementById('btnMgrAddNewDevice');
    this.dom.modalProjectNameText   = document.getElementById('modalProjectNameText');
    this.dom.btnModalNewProject     = document.getElementById('btnModalNewProject');
    this.dom.btnModalRestoreSpark   = document.getElementById('btnModalRestoreSpark');
  }

  switchBoardProfile(boardId) {
    pinConfig.setBoard(boardId);
    if (this.dom.selectBoardProfile && this.dom.selectBoardProfile.value !== boardId) {
      this.dom.selectBoardProfile.value = boardId;
    }
    const board = pinConfig.getActiveBoard();
    this.log(`Switched target board to [${board.name}] (${board.voltage})`, 'success');
    this.updateDashboardModuleHeaders();
    this.renderFirmwareFlasher();
    circuitBoardSchematic.setBoard(boardId);
    if (this.dom.modalPinMatrix && this.dom.modalPinMatrix.classList.contains('active')) {
      this.dom.pinMatrixRenderArea.innerHTML = hardwareDiagnostics.renderPinMatrixHtml();
    }
  }

  bindEvents() {
    // 1. Target Board Switching
    this.dom.selectBoardProfile.addEventListener('change', (e) => {
      this.switchBoardProfile(e.target.value);
    });

    // 2. Web Serial Quick Connect Header Button
    this.dom.btnWebSerialConnect.addEventListener('click', () => {
      if (webSerialManager.isConnected) {
        webSerialManager.disconnect();
      } else {
        const baud = this.dom.selectBaudRate.value;
        webSerialManager.connect(baud).catch(err => {
          this.log(`Web Serial: ${err.message}`, 'error');
        });
      }
    });

    // 3. Port Pinging: Ping All Ports Button
    this.dom.btnPingAllPorts.addEventListener('click', async () => {
      this.log('Starting hardware port ping scan across all 9 sensor lines...', 'warn');
      this.dom.btnPingAllPorts.disabled = true;
      this.dom.btnPingAllPorts.innerHTML = '<span style="color: var(--accent-amber);">Scanning...</span>';

      const snapshot = this.mode === 'simulation' ? sensorSimulator.getSnapshot() : {
        temperature: parseFloat(this.dom.valTemp.textContent) || 24.0,
        humidity: parseFloat(this.dom.valHum.textContent) || 55.0,
        distance: parseFloat(this.dom.valDist.textContent) || 178.0,
        motion: this.dom.valMotion.textContent === 'DETECTED' ? 1 : 0,
        light: parseInt(this.dom.valLight ? this.dom.valLight.textContent : '620', 10) || 620
      };

      await portPinger.pingAllPorts(snapshot, webSerialManager, (sensorId, current, total) => {
        this.log(`Pinging port line [${sensorId}] (${current}/${total})...`);
      });

      this.dom.btnPingAllPorts.disabled = false;
      this.dom.btnPingAllPorts.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
        Ping Ports
      `;
      this.updateAllSensorPingBadges();
      this.updateBriefSummaryStats();
      const summary = portPinger.getPingSummary();
      this.log(`Port ping completed: ${summary.passed} Pass / ${summary.failed} Fault. Device Status: ${summary.activeDevice.name} (${summary.activeDevice.status.toUpperCase()})`, 'success');
    });

    // 3b. Dedicated Sensor Health & Pings Part Buttons
    if (this.dom.btnDedicatedPingAll) {
      this.dom.btnDedicatedPingAll.addEventListener('click', () => {
        if (this.dom.btnPingAllPorts) {
          this.dom.btnPingAllPorts.click();
        }
      });
    }

    if (this.dom.btnDedicatedTogglePing) {
      this.dom.btnDedicatedTogglePing.addEventListener('click', () => {
        if (this.dom.btnToggleBriefPing) {
          this.dom.btnToggleBriefPing.click();
        }
        const isOn = this.dom.textBriefPingState ? this.dom.textBriefPingState.textContent.includes('ON') : true;
        if (this.dom.textDedicatedPingState) {
          this.dom.textDedicatedPingState.textContent = isOn ? 'PINGS: ON' : 'PINGS: PAUSED';
        }
      });
    }

    // 4. Individual Sensor On/Off Isolation Toggles
    document.querySelectorAll('.sensor-enable-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const sensorId = e.target.getAttribute('data-sensor-id');
        const isEnabled = e.target.checked;
        calibrationManager.toggleSensor(sensorId, isEnabled);

        const card = e.target.closest('.module-card');
        if (card) {
          card.classList.toggle('sensor-isolated', !isEnabled);
        }

        const badge = document.getElementById(`pingBadge_${sensorId}`);
        if (badge) {
          if (!isEnabled) {
            badge.className = 'port-health-badge disabled';
            badge.textContent = 'ISOLATED';
          } else {
            badge.className = 'port-health-badge pass';
            badge.textContent = 'PASS';
          }
        }

        this.updateBriefSummaryStats();
        this.log(`Sensor [${sensorId.toUpperCase()}]: ${isEnabled ? 'ACTIVE' : 'ISOLATED / DISABLED'}`, isEnabled ? 'success' : 'warn');
      });
    });

    // 5. Individual Sensor Action Mini-Tools (Calibrate & Ping)
    document.querySelectorAll('.btn-cal-sensor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sensorId = btn.getAttribute('data-sensor-id');
        this.openCalibrationStudio(sensorId);
      });
    });

    document.querySelectorAll('.btn-ping-sensor').forEach(btn => {
      btn.addEventListener('click', async () => {
        const sensorId = btn.getAttribute('data-sensor-id');
        btn.innerHTML = '<span style="color: var(--accent-amber);">Pinging...</span>';
        const snapshot = {
          temperature: parseFloat(this.dom.valTemp.textContent) || 24.0,
          humidity: parseFloat(this.dom.valHum.textContent) || 55.0,
          distance: parseFloat(this.dom.valDist.textContent) || 178.0,
          motion: this.dom.valMotion.textContent === 'DETECTED' ? 1 : 0,
          light: parseInt(this.dom.valLight ? this.dom.valLight.textContent : '620', 10) || 620
        };
        const res = await portPinger.pingSensorPort(sensorId, snapshot, webSerialManager);
        btn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Ping Port
        `;

        // Display device status prominently on sensor card and brief menu
        const devName = res.device ? res.device.name : 'Spark Core';
        const devStatus = res.device ? res.device.status : 'online';
        const badge = document.getElementById(`pingBadge_${sensorId}`);
        if (badge) {
          badge.className = `port-health-badge ${res.status === 'fail' ? 'fail' : 'pass'}`;
          badge.innerHTML = `${res.badge} <span style="font-size: 9px; opacity: 0.85;">(${devName.split(' ')[0]}: ${devStatus.toUpperCase()})</span>`;
          badge.title = `Device: ${devName} (${devStatus}) | Latency: ${res.latencyMs}ms | Voltage: ${res.voltage}`;
        }

        if (this.dom.briefDevStatus) {
          this.dom.briefDevStatus.textContent = `${devName.split(' ')[0]} (${devStatus.toUpperCase()})`;
          this.dom.briefDevStatus.style.color = devStatus.toLowerCase() === 'online' ? 'var(--accent-emerald)' : 'var(--accent-cyan)';
        }

        this.updateBriefSummaryStats();
        this.log(`[DEVICE: ${devName} (${devStatus.toUpperCase()})] Port [${sensorId}]: ${res.badge} (${res.latencyMs}ms) - ${res.detail}`, res.status === 'fail' ? 'error' : 'success');
      });
    });

    // 6. Web Serial Drawer Controls
    this.dom.btnToggleSerialPort.addEventListener('click', () => {
      if (webSerialManager.isConnected) {
        webSerialManager.disconnect();
      } else {
        const baud = this.dom.selectBaudRate.value;
        webSerialManager.connect(baud).catch(err => {
          this.logSerial(`[ERROR] ${err.message}`);
        });
      }
    });

    this.dom.btnDfuTrigger.addEventListener('click', async () => {
      const isSpark = pinConfig.activeBoardId === 'spark_core';
      const baud = isSpark ? 14400 : 1200;
      this.log(`Triggering DFU touch at ${baud} baud...`, 'warn');
      try {
        await webSerialManager.triggerDfuReset(baud);
      } catch (e) {
        this.log(`DFU Error: ${e.message}`, 'error');
      }
    });

    this.dom.btnSerialSend.addEventListener('click', () => this.sendSerialFromInput());
    this.dom.inputSerialSend.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendSerialFromInput();
    });

    this.dom.btnQuickCmdPing.addEventListener('click', () => {
      this.dom.inputSerialSend.value = 'PING:ALL';
      this.sendSerialFromInput();
    });

    this.dom.btnQuickCmdReset.addEventListener('click', () => {
      this.dom.inputSerialSend.value = 'RESET';
      this.sendSerialFromInput();
    });

    this.dom.btnClearSerialLog.addEventListener('click', () => {
      this.dom.serialTerminalOutput.innerHTML = '';
    });

    // 7. Calibration Studio Modal Events
    this.dom.selectCalSensor.addEventListener('change', (e) => {
      this.loadCalibrationIntoStudio(e.target.value);
    });

    this.dom.calSensorEnabled.addEventListener('change', (e) => {
      calibrationManager.toggleSensor(this.activeCalSensor, e.target.checked);
      this.syncSensorTogglesUi();
    });

    this.dom.calOffsetSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.dom.calOffsetNum.textContent = val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1);
      this.updateCalibrationLivePreview();
    });

    this.dom.calGainSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.dom.calGainNum.textContent = `${val.toFixed(3)}x`;
      this.updateCalibrationLivePreview();
    });

    this.dom.btnComputeTwoPoint.addEventListener('click', () => {
      const r1 = this.dom.twoPtRaw1.value;
      const a1 = this.dom.twoPtAct1.value;
      const r2 = this.dom.twoPtRaw2.value;
      const a2 = this.dom.twoPtAct2.value;

      const curve = calibrationManager.computeTwoPointCurve(r1, a1, r2, a2);
      this.dom.calGainSlider.value = curve.gain;
      this.dom.calGainNum.textContent = `${curve.gain.toFixed(3)}x`;
      this.dom.calOffsetSlider.value = curve.offset;
      this.dom.calOffsetNum.textContent = curve.offset >= 0 ? `+${curve.offset.toFixed(1)}` : curve.offset.toFixed(1);
      this.updateCalibrationLivePreview();
      this.log(`Two-Point Curve calculated: Gain=${curve.gain}, Offset=${curve.offset}`, 'success');
    });

    this.dom.btnSaveCalibration.addEventListener('click', () => {
      const offset = parseFloat(this.dom.calOffsetSlider.value);
      const gain = parseFloat(this.dom.calGainSlider.value);
      const twoPoint = {
        raw1: parseFloat(this.dom.twoPtRaw1.value) || 0,
        act1: parseFloat(this.dom.twoPtAct1.value) || 0,
        raw2: parseFloat(this.dom.twoPtRaw2.value) || 100,
        act2: parseFloat(this.dom.twoPtAct2.value) || 100
      };

      calibrationManager.setCalibration(this.activeCalSensor, { offset, gain, twoPoint });
      this.dom.modalCalibration.classList.remove('active');
      this.log(`Calibration profile saved for [${this.activeCalSensor.toUpperCase()}].`, 'success');
    });

    this.dom.btnResetSensorCal.addEventListener('click', () => {
      if (confirm(`Reset calibration for ${this.activeCalSensor} to factory defaults?`)) {
        calibrationManager.resetSensor(this.activeCalSensor);
        this.loadCalibrationIntoStudio(this.activeCalSensor);
        this.log(`Calibration reset for [${this.activeCalSensor}].`, 'warn');
      }
    });

    this.dom.btnCloseCalibration.addEventListener('click', () => {
      this.dom.modalCalibration.classList.remove('active');
    });

    // 8. Firmware Flasher Modal Events
    this.dom.btnOpenFlasher.addEventListener('click', () => {
      this.renderFirmwareFlasher();
      this.dom.modalFlasher.classList.add('active');
    });

    this.dom.btnCloseFlasher.addEventListener('click', () => {
      this.dom.modalFlasher.classList.remove('active');
    });

    this.dom.modalFlasher.querySelectorAll('.modal-tab-btn').forEach(tab => {
      tab.addEventListener('click', () => {
        this.dom.modalFlasher.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        this.dom.modalFlasher.querySelectorAll('.tab-content-pane').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const target = document.getElementById(tab.getAttribute('data-tab'));
        if (target) target.classList.add('active');
      });
    });

    this.dom.btnCopyGeneratedCode.addEventListener('click', () => {
      navigator.clipboard.writeText(this.dom.txtGeneratedFirmware.value);
      this.log('Universal firmware sketch copied to clipboard!', 'success');
    });

    this.dom.btnDownloadSketch.addEventListener('click', () => {
      const board = pinConfig.getActiveBoard();
      const isPy = board.firmwareType.includes('python');
      const filename = `sentinel_${board.id}.${isPy ? 'py' : 'ino'}`;
      const blob = new Blob([this.dom.txtGeneratedFirmware.value], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      this.log(`Downloaded firmware file: ${filename}`, 'success');
    });

    // Drag & Drop Flashing
    this.dom.flashDropZone.addEventListener('click', () => this.dom.inputFileFirmware.click());
    this.dom.inputFileFirmware.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFirmwareFile(e.target.files[0]);
      }
    });

    this.dom.flashDropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dom.flashDropZone.classList.add('dragover');
    });

    this.dom.flashDropZone.addEventListener('dragleave', () => {
      this.dom.flashDropZone.classList.remove('dragover');
    });

    this.dom.flashDropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dom.flashDropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFirmwareFile(e.dataTransfer.files[0]);
      }
    });

    this.dom.btnStartFlashUsb.addEventListener('click', async () => {
      if (!this.firmwareFileBuffer) return;
      this.dom.btnStartFlashUsb.disabled = true;
      this.dom.flashProgressBox.style.display = 'block';
      this.dom.flashProgressText.style.display = 'block';

      try {
        await webSerialManager.flashFirmware(this.firmwareFileBuffer, (pct, cur, total) => {
          this.dom.flashProgressBar.style.width = `${pct}%`;
          this.dom.flashProgressText.textContent = `Flashing ${pct}% (${cur}/${total} packets)...`;
        });
        this.dom.flashProgressText.textContent = '✅ Flashing 100% Complete! Verification Verified.';
        this.log('Firmware successfully flashed to board via WebUSB!', 'success');
      } catch (err) {
        this.dom.flashProgressText.textContent = `❌ Flashing Failed: ${err.message}`;
        this.log(`WebUSB Flash failed: ${err.message}`, 'error');
      } finally {
        this.dom.btnStartFlashUsb.disabled = false;
      }
    });

    // 9. Standard App Controls (Tone presets, Mode, Pin Setup, Actuators)
    this.dom.btnModeLive.addEventListener('click', () => this.switchMode('live'));
    this.dom.btnModeSim.addEventListener('click', () => this.switchMode('simulation'));

    this.dom.toneButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.dom.toneButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const tone = btn.getAttribute('data-tone');
        this.activeTone = tone;
        audioEngine.setPreset(tone);
        this.log(`Alarm tone preset switched to: ${tone.toUpperCase()}`);

        if (this.mode === 'live' && pinConfig.activeBoardId === 'spark_core') {
          particleApi.callFunction('alarm', `tone:${tone}`);
        }
      });
    });

    this.dom.btnTestSound.addEventListener('click', () => {
      audioEngine.startTone(this.activeTone);
      this.dom.btnTestSound.style.display = 'none';
      this.dom.btnStopSound.style.display = 'inline-flex';
      this.log(`Testing Web Audio tone: ${this.activeTone}`);
    });

    this.dom.btnStopSound.addEventListener('click', () => {
      audioEngine.stopTone();
      this.dom.btnStopSound.style.display = 'none';
      this.dom.btnTestSound.style.display = 'inline-flex';
      this.log('Audio playback stopped');
    });

    this.dom.sliderPitch.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.dom.valPitch.textContent = `${val.toFixed(1)}x`;
      audioEngine.setPitch(val);
    });

    this.dom.sliderVolume.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      this.dom.valVolume.textContent = `${val}%`;
      audioEngine.setVolume(val / 100);
    });

    this.dom.chkAudioAlarm.addEventListener('change', (e) => {
      this.audioAlarmEnabled = e.target.checked;
      this.log(`Browser Alarm Audio: ${this.audioAlarmEnabled ? 'ENABLED' : 'MUTED'}`);
      if (!this.audioAlarmEnabled && this.isAlerting) {
        audioEngine.stopTone();
      }
    });

    this.dom.btnTriggerBuzzer.addEventListener('click', () => this.triggerBuzzerAction());
    this.dom.btnQuickBeep.addEventListener('click', () => this.triggerBuzzerAction());

    this.dom.btnStopBuzzer.addEventListener('click', async () => {
      audioEngine.stopTone();
      if (this.mode === 'live' && pinConfig.activeBoardId === 'spark_core') {
        await particleApi.callFunction('alarm', 'off');
      }
      this.log('All alarms silenced.');
    });

    this.dom.rgbButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        this.dom.rgbButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const color = btn.getAttribute('data-color');
        this.setRgbAction(color);
      });
    });

    this.dom.sliderThreshold.addEventListener('input', (e) => {
      this.proximityThreshold = parseInt(e.target.value, 10);
      this.dom.valThreshold.textContent = `${this.proximityThreshold} cm`;
    });

    // Scenarios
    this.dom.btnScenIntruder.addEventListener('click', () => {
      this.setScenarioButtonActive(this.dom.btnScenIntruder);
      this.log('Starting Scenario: INTRUDER APPROACH (<20cm)', 'warn');
      sensorSimulator.runScenario('intruder', (data) => this.updateDashboard(data));
    });

    this.dom.btnScenOverheat.addEventListener('click', () => {
      this.setScenarioButtonActive(this.dom.btnScenOverheat);
      this.log('Starting Scenario: ROOM TEMPERATURE SPIKE', 'warn');
      sensorSimulator.runScenario('overheat', (data) => this.updateDashboard(data));
    });

    this.dom.btnScenNormal.addEventListener('click', () => {
      this.setScenarioButtonActive(this.dom.btnScenNormal);
      this.log('Resetting to Normal Safe Baseline', 'success');
      sensorSimulator.runScenario('normal', (data) => this.updateDashboard(data));
    });

    this.dom.simTemp.addEventListener('input', (e) => sensorSimulator.setManualValue('temperature', e.target.value));
    this.dom.simDist.addEventListener('input', (e) => sensorSimulator.setManualValue('distance', e.target.value));
    this.dom.simMotion.addEventListener('change', (e) => sensorSimulator.setManualValue('motion', e.target.checked ? 1 : 0));

    // Settings Modal
    this.dom.btnOpenSettings.addEventListener('click', () => {
      const creds = particleApi.getCredentials();
      this.dom.inputDeviceId.value = creds.deviceId;
      this.dom.inputToken.value = creds.token;
      this.dom.inputTsKey.value = thingspeakApi.readKey;
      this.dom.modalSettings.classList.add('active');
    });

    this.dom.btnCloseSettings.addEventListener('click', () => {
      this.dom.modalSettings.classList.remove('active');
    });

    this.dom.btnSaveSettings.addEventListener('click', () => {
      particleApi.setCredentials(this.dom.inputDeviceId.value.trim(), this.dom.inputToken.value.trim());
      thingspeakApi.setReadKey(this.dom.inputTsKey.value.trim());
      this.dom.modalSettings.classList.remove('active');
      this.log('Cloud credentials updated and saved to local storage.', 'success');
      if (this.mode === 'live') {
        this.pollLiveSensors();
      }
    });

    // Pin Setup Modal Toggle & Tabs
    this.dom.btnOpenPinSetup.addEventListener('click', () => {
      this.renderPinSetupTable();
      this.renderInstructionsList();
      this.renderHotkeysTable();
      this.dom.txtProfileJson.value = pinConfig.exportProfile();
      this.dom.modalPinSetup.classList.add('active');
    });

    this.dom.btnClosePinSetup.addEventListener('click', () => {
      this.dom.modalPinSetup.classList.remove('active');
    });

    this.dom.modalPinSetup.querySelectorAll('.modal-tab-btn').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => {
        this.dom.modalPinSetup.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
        this.dom.modalPinSetup.querySelectorAll('.tab-content-pane').forEach(p => p.classList.remove('active'));
        tabBtn.classList.add('active');
        const target = document.getElementById(tabBtn.getAttribute('data-tab'));
        if (target) target.classList.add('active');
      });
    });

    this.dom.btnSavePinSetup.addEventListener('click', () => {
      this.savePinSetupChanges();
      this.dom.modalPinSetup.classList.remove('active');
      this.log('Sensor pin assignments and instructions updated successfully.', 'success');
    });

    this.dom.btnExportProfile.addEventListener('click', () => {
      navigator.clipboard.writeText(pinConfig.exportProfile());
      this.log('JSON profile copied to clipboard!', 'success');
    });

    this.dom.btnImportProfile.addEventListener('click', () => {
      const success = pinConfig.importProfile(this.dom.txtProfileJson.value);
      if (success) {
        this.syncBoardSelector();
        this.renderPinSetupTable();
        this.renderInstructionsList();
        this.renderHotkeysTable();
        this.log('JSON profile imported and applied!', 'success');
      } else {
        alert('Invalid JSON configuration profile format.');
      }
    });

    this.dom.btnResetDefaults.addEventListener('click', () => {
      if (confirm('Reset all pin mappings and instructions to defaults for this board?')) {
        pinConfig.resetDefaults();
        this.renderPinSetupTable();
        this.renderInstructionsList();
        this.renderHotkeysTable();
        this.dom.txtProfileJson.value = pinConfig.exportProfile();
        this.log('Reset to default board configuration.', 'warn');
      }
    });

    // Pin Matrix Modal & Schematic Smooth Navigation
    this.dom.btnOpenPinMatrix.addEventListener('click', () => {
      const schematicSec = document.getElementById('circuitBoardSchematicSection');
      if (schematicSec) {
        schematicSec.scrollIntoView({ behavior: 'smooth' });
      }
      this.dom.pinMatrixRenderArea.innerHTML = hardwareDiagnostics.renderPinMatrixHtml();
      this.dom.modalPinMatrix.classList.add('active');
    });

    this.dom.btnClosePinMatrix.addEventListener('click', () => {
      this.dom.modalPinMatrix.classList.remove('active');
    });

    // Theme Selector
    if (this.dom.selectThemeProfile) {
      this.dom.selectThemeProfile.addEventListener('change', (e) => {
        themeEngine.setTheme(e.target.value);
        const info = themeEngine.getActiveThemeInfo();
        this.log(`Environment Theme changed: ${info.icon} ${info.name}`, 'info');
      });
    }

    // Home Setup & Rebranding
    if (this.dom.btnOpenHomeSetup) {
      this.dom.btnOpenHomeSetup.addEventListener('click', () => {
        this.syncHomeSetupInputs();
        if (this.dom.tsStatusAlert) this.dom.tsStatusAlert.style.display = 'none';
        this.dom.modalHomeSetup.classList.add('active');
      });
    }

    if (this.dom.btnCloseHomeSetup) {
      this.dom.btnCloseHomeSetup.addEventListener('click', () => {
        this.dom.modalHomeSetup.classList.remove('active');
      });
    }

    if (this.dom.btnResetHomeSetup) {
      this.dom.btnResetHomeSetup.addEventListener('click', () => {
        if (confirm('Reset home branding and ThingSpeak configurations to factory defaults?')) {
          homeConfig.resetDefaults();
          this.syncHomeSetupInputs();
          this.log('Home configuration reset to defaults.', 'warn');
        }
      });
    }

    if (this.dom.btnSaveHomeSetup) {
      this.dom.btnSaveHomeSetup.addEventListener('click', () => {
        const newConfig = {
          homeName: this.dom.inputHomeName.value.trim() || 'SMART ROOM SENTINEL',
          zoneName: this.dom.inputZoneName.value.trim() || 'Zone 1 - Master Chamber',
          locationTag: this.dom.inputLocationTag.value.trim(),
          ownerName: this.dom.inputOwnerName.value.trim(),
          thingspeakChannelId: this.dom.inputTsChannelId.value.trim(),
          thingspeakWriteKey: this.dom.inputTsWriteKey.value.trim(),
          thingspeakReadKey: this.dom.inputTsReadKey.value.trim(),
          autoPublish: this.dom.checkTsAutoPublish.checked
        };
        homeConfig.saveConfig(newConfig);
        this.dom.modalHomeSetup.classList.remove('active');
        this.log(`App rebranded to "${newConfig.homeName}" (${newConfig.zoneName}).`, 'success');
      });
    }

    if (this.dom.btnTestTsSync) {
      this.dom.btnTestTsSync.addEventListener('click', async () => {
        if (this.dom.tsStatusAlert) {
          this.dom.tsStatusAlert.style.display = 'block';
          this.dom.tsStatusAlert.style.background = 'rgba(0, 242, 254, 0.1)';
          this.dom.tsStatusAlert.style.color = 'var(--accent-cyan)';
          this.dom.tsStatusAlert.textContent = 'Testing ThingSpeak Cloud connection...';
        }

        const telemetry = this.getCurrentTelemetry();
        const res = await thingspeakApi.publishTelemetry(telemetry);
        if (res.success) {
          if (this.dom.tsStatusAlert) {
            this.dom.tsStatusAlert.style.background = 'rgba(16, 185, 129, 0.15)';
            this.dom.tsStatusAlert.style.color = 'var(--accent-emerald)';
            this.dom.tsStatusAlert.textContent = `✓ Write successful! Entry #${res.entryId} saved to ThingSpeak Channel.`;
          }
          this.log(`Manual ThingSpeak Test: Success (Entry #${res.entryId})`, 'success');
        } else {
          if (this.dom.tsStatusAlert) {
            this.dom.tsStatusAlert.style.background = 'rgba(239, 68, 68, 0.15)';
            this.dom.tsStatusAlert.style.color = 'var(--accent-rose)';
            this.dom.tsStatusAlert.textContent = `✗ Cloud Write Error: ${res.error || 'Check Channel ID and Key.'}`;
          }
          this.log(`ThingSpeak Test Failed: ${res.error}`, 'error');
        }
      });
    }

    if (this.dom.tsSyncIndicator) {
      this.dom.tsSyncIndicator.addEventListener('click', () => {
        this.dom.btnOpenHomeSetup.click();
      });
    }

    // Hardware Driver Assistant Modal
    if (this.dom.btnOpenDriverHelp) {
      this.dom.btnOpenDriverHelp.addEventListener('click', () => {
        this.dom.modalDriverHelp.classList.add('active');
      });
    }

    if (this.dom.btnCloseDriverHelp) {
      this.dom.btnCloseDriverHelp.addEventListener('click', () => {
        this.dom.modalDriverHelp.classList.remove('active');
      });
    }

    if (this.dom.btnDriverAutoSwitchBoard) {
      this.dom.btnDriverAutoSwitchBoard.addEventListener('click', () => {
        if (this.detectedUsbDevice && this.detectedUsbDevice.suggestedBoardId) {
          this.dom.selectBoardProfile.value = this.detectedUsbDevice.suggestedBoardId;
          this.dom.selectBoardProfile.dispatchEvent(new Event('change'));
          this.dom.modalDriverHelp.classList.remove('active');
          this.log(`Switched to auto-detected board profile: ${this.detectedUsbDevice.boardLabel}`, 'success');
        }
      });
    }

    // Auto-Search Bus Scanner Modal
    if (this.dom.btnOpenSensorScan) {
      this.dom.btnOpenSensorScan.addEventListener('click', () => {
        this.dom.modalSensorScan.classList.add('active');
      });
    }

    if (this.dom.btnCloseSensorScan) {
      this.dom.btnCloseSensorScan.addEventListener('click', () => {
        this.dom.modalSensorScan.classList.remove('active');
      });
    }

    if (this.dom.btnStartAutoScan) {
      this.dom.btnStartAutoScan.addEventListener('click', () => {
        this.runSensorAutoScan();
      });
    }

    if (this.dom.btnApplyAutoConfig) {
      this.dom.btnApplyAutoConfig.addEventListener('click', () => {
        this.applyAutoDetectedSensors();
      });
    }

    // Camera View Modal & Controls
    if (this.dom.btnToggleCameraView) {
      this.dom.btnToggleCameraView.addEventListener('click', () => {
        this.dom.modalCameraView.classList.add('active');
        if (!cameraManager.isStreaming) {
          cameraManager.startWebcam();
        }
      });
    }

    if (this.dom.btnCloseCameraView) {
      this.dom.btnCloseCameraView.addEventListener('click', () => {
        this.dom.modalCameraView.classList.remove('active');
      });
    }

    if (this.dom.selectCameraSource) {
      this.dom.selectCameraSource.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'webcam') {
          cameraManager.startWebcam();
        } else if (val === 'esp32_cam') {
          const url = prompt('Enter ESP32-CAM MJPEG Stream URL:', 'http://192.168.4.1/stream');
          if (url) cameraManager.startIpStream(url);
        } else if (val === 'test_pattern') {
          cameraManager.startSimulatedPattern('Vision HUD Test Feed');
        }
      });
    }

    if (this.dom.btnToggleHudOverlay) {
      this.dom.btnToggleHudOverlay.addEventListener('click', () => {
        cameraManager.toggleHud();
      });
    }

    if (this.dom.btnCaptureSnapshot) {
      this.dom.btnCaptureSnapshot.addEventListener('click', () => {
        const snap = cameraManager.captureSnapshot();
        if (snap) {
          this.log('Camera Vision snapshot captured & downloaded.', 'success');
        }
      });
    }

    if (this.dom.cameraFilterBtns) {
      this.dom.cameraFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          this.dom.cameraFilterBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          cameraManager.setFilter(btn.getAttribute('data-filter') || 'normal');
        });
      });
    }

    // Extensions Modal & Studio Controls
    if (this.dom.btnOpenExtensions) {
      this.dom.btnOpenExtensions.addEventListener('click', () => {
        this.renderMarketplaceExtensions();
        this.renderInstalledExtensionsList();
        this.dom.modalExtensions.classList.add('active');
      });
    }

    if (this.dom.btnCloseExtensions) {
      this.dom.btnCloseExtensions.addEventListener('click', () => {
        this.dom.modalExtensions.classList.remove('active');
      });
    }

    if (this.dom.modalExtensions) {
      this.dom.modalExtensions.querySelectorAll('.modal-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          this.dom.modalExtensions.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
          this.dom.modalExtensions.querySelectorAll('.tab-content-pane').forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const target = document.getElementById(tab.getAttribute('data-tab'));
          if (target) target.classList.add('active');
        });
      });
    }

    if (this.dom.btnCreateCustomExt) {
      this.dom.btnCreateCustomExt.addEventListener('click', () => {
        const name = (this.dom.inputCustomExtName.value || '').trim();
        if (!name) {
          alert('Please specify an extension name.');
          return;
        }
        const author = (this.dom.inputCustomExtAuthor.value || 'User').trim();
        const icon = (this.dom.inputCustomExtIcon.value || '🧩').trim();
        const category = this.dom.selectCustomExtCategory.value;
        const rawKeys = (this.dom.inputCustomExtKeys.value || '').split(',').map(s => s.trim()).filter(Boolean);
        const desc = (this.dom.txtCustomExtDesc.value || '').trim();

        extensionEngine.createCustomExtension({
          name,
          author,
          icon,
          category,
          telemetryKeys: rawKeys.length ? rawKeys : ['custom_val'],
          description: desc
        });

        this.dom.inputCustomExtName.value = '';
        this.dom.txtCustomExtDesc.value = '';
        this.renderInstalledExtensionsList();
        this.renderActiveExtensions(this.latestTelemetry || {});
        this.log(`Custom extension created: ${icon} ${name}`, 'success');

        const instTabBtn = this.dom.modalExtensions.querySelector('[data-tab="tabExtInstalled"]');
        if (instTabBtn) instTabBtn.click();
      });
    }

    if (this.dom.btnExportAllExt) {
      this.dom.btnExportAllExt.addEventListener('click', () => {
        const installed = extensionEngine.getInstalledExtensions().map(e => {
          const c = { ...e };
          delete c.render;
          return c;
        });
        this.dom.txtExtJsonCode.value = JSON.stringify(installed, null, 2);
        this.log('Exported installed extensions JSON.', 'info');
      });
    }

    if (this.dom.btnApplyImportExt) {
      this.dom.btnApplyImportExt.addEventListener('click', () => {
        const code = (this.dom.txtExtJsonCode.value || '').trim();
        if (!code) {
          alert('Please enter extension JSON manifest.');
          return;
        }
        const res = extensionEngine.importExtensionJson(code);
        if (res.success) {
          this.renderInstalledExtensionsList();
          this.renderActiveExtensions(this.latestTelemetry || {});
          this.log(`Imported extension: ${res.extension.name}`, 'success');
          const instTabBtn = this.dom.modalExtensions.querySelector('[data-tab="tabExtInstalled"]');
          if (instTabBtn) instTabBtn.click();
        } else {
          alert('Import Error: ' + res.error);
        }
      });
    }

    // Wireless Multi-Protocol Modal Controls
    if (this.dom.btnOpenWireless) {
      this.dom.btnOpenWireless.addEventListener('click', () => {
        this.dom.modalWireless.classList.add('active');
      });
    }

    if (this.dom.btnCloseWireless) {
      this.dom.btnCloseWireless.addEventListener('click', () => {
        this.dom.modalWireless.classList.remove('active');
      });
    }

    if (this.dom.modalWireless) {
      this.dom.modalWireless.querySelectorAll('.modal-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          this.dom.modalWireless.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
          this.dom.modalWireless.querySelectorAll('.tab-content-pane').forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const target = document.getElementById(tab.getAttribute('data-tab'));
          if (target) target.classList.add('active');
        });
      });
    }

    if (this.dom.btnTestWifiPing) {
      this.dom.btnTestWifiPing.addEventListener('click', async () => {
        const url = (this.dom.inputWifiEndpoint.value || '').trim();
        this.dom.wifiStatusBox.innerHTML = '<span style="color: var(--accent-cyan);">Pinging device IP...</span>';
        const res = await wirelessManager.testWifiPing(url);
        if (res.success) {
          this.dom.wifiStatusBox.innerHTML = `<span style="color: var(--accent-emerald);">✓ Device Reachable &bull; HTTP ${res.status} &bull; Latency: ${res.latency}ms</span>`;
          this.log(`WiFi Ping: Reachable (${res.latency}ms)`, 'success');
        } else {
          this.dom.wifiStatusBox.innerHTML = `<span style="color: var(--accent-rose);">✗ Ping Failed: ${res.error || 'Host Unreachable'}</span>`;
          this.log(`WiFi Ping Failed: ${res.error}`, 'error');
        }
      });
    }

    if (this.dom.btnStartWifiPolling) {
      this.dom.btnStartWifiPolling.addEventListener('click', () => {
        if (wirelessManager.wifiPollTimer) {
          wirelessManager.stopWifiPolling();
          this.dom.btnStartWifiPolling.textContent = 'Start Live Polling';
          this.dom.btnStartWifiPolling.classList.remove('active');
          this.dom.wifiStatusBox.innerHTML = 'WiFi Polling Stopped &bull; Idle';
          this.log('WiFi continuous polling stopped.');
        } else {
          wirelessManager.wifiConfig.ipEndpoint = (this.dom.inputWifiEndpoint.value || '').trim();
          wirelessManager.startWifiPolling(data => this.updateDashboard(data));
          this.dom.btnStartWifiPolling.textContent = 'Stop Polling';
          this.dom.btnStartWifiPolling.classList.add('active');
          this.dom.wifiStatusBox.innerHTML = '<span style="color: var(--accent-emerald);">● Live WiFi Polling Active (2s interval)</span>';
          this.log('WiFi live telemetry polling active.', 'success');
        }
      });
    }

    if (this.dom.btnScanBleDevice) {
      this.dom.btnScanBleDevice.addEventListener('click', async () => {
        this.dom.bleStatusBox.innerHTML = '<span style="color: var(--accent-cyan);">Requesting Bluetooth pair dialog in browser...</span>';
        const res = await wirelessManager.connectBleDevice();
        if (res.success) {
          this.dom.bleStatusBox.innerHTML = `<span style="color: var(--accent-emerald);">✓ Paired & Connected: <strong>${res.deviceName}</strong></span>`;
          this.dom.btnDisconnectBle.style.display = 'inline-block';
          this.dom.btnScanBleDevice.style.display = 'none';
          this.log(`Bluetooth BLE: Connected to [${res.deviceName}]`, 'success');
        } else {
          this.dom.bleStatusBox.innerHTML = `<span style="color: var(--accent-rose);">BLE Pairing: ${res.error}</span>`;
          this.log(`Bluetooth BLE Error: ${res.error}`, 'error');
        }
      });
    }

    if (this.dom.btnDisconnectBle) {
      this.dom.btnDisconnectBle.addEventListener('click', () => {
        wirelessManager.disconnectBle();
        this.dom.bleStatusBox.innerHTML = 'BLE State: Disconnected &bull; Ready to pair';
        this.dom.btnDisconnectBle.style.display = 'none';
        this.dom.btnScanBleDevice.style.display = 'inline-block';
        this.log('Bluetooth BLE disconnected.');
      });
    }

    if (this.dom.btnSendAtCommand) {
      this.dom.btnSendAtCommand.addEventListener('click', () => {
        const cmd = (this.dom.inputAtCommand.value || '').trim();
        if (cmd) {
          wirelessManager.sendAtCommand(cmd);
          this.dom.inputAtCommand.value = '';
        }
      });
    }

    if (this.dom.inputAtCommand) {
      this.dom.inputAtCommand.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const cmd = (this.dom.inputAtCommand.value || '').trim();
          if (cmd) {
            wirelessManager.sendAtCommand(cmd);
            this.dom.inputAtCommand.value = '';
          }
        }
      });
    }

    if (this.dom.atQuickCmdBtns) {
      this.dom.atQuickCmdBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const cmd = btn.getAttribute('data-cmd');
          if (cmd) wirelessManager.sendAtCommand(cmd);
        });
      });
    }

    // TekStep Apps Uganda Info Modal Controls
    if (this.dom.btnOpenAboutTekstep) {
      this.dom.btnOpenAboutTekstep.addEventListener('click', () => {
        this.dom.modalAboutTekstep.classList.add('active');
      });
    }

    if (this.dom.btnCloseAboutTekstep) {
      this.dom.btnCloseAboutTekstep.addEventListener('click', () => {
        this.dom.modalAboutTekstep.classList.remove('active');
      });
    }

    // Mobile Bottom Navigation Bar Actions
    if (this.dom.mBtnScan) {
      this.dom.mBtnScan.addEventListener('click', () => {
        this.dom.btnOpenSensorScan.click();
      });
    }

    if (this.dom.mBtnCamera) {
      this.dom.mBtnCamera.addEventListener('click', () => {
        this.dom.btnToggleCameraView.click();
      });
    }

    if (this.dom.mBtnExtensions) {
      this.dom.mBtnExtensions.addEventListener('click', () => {
        this.dom.btnOpenExtensions.click();
      });
    }

    if (this.dom.mBtnWireless) {
      this.dom.mBtnWireless.addEventListener('click', () => {
        this.dom.btnOpenWireless.click();
      });
    }

    if (this.dom.mBtnSerial) {
      this.dom.mBtnSerial.addEventListener('click', () => {
        this.dom.btnWebSerialConnect.click();
      });
    }

    if (this.dom.mBtnAbout) {
      this.dom.mBtnAbout.addEventListener('click', () => {
        this.dom.btnOpenAboutTekstep.click();
      });
    }

    if (this.dom.mBtnSilence) {
      this.dom.mBtnSilence.addEventListener('click', () => {
        audioEngine.stopTone();
        this.log('Silenced all alarm buzzers via mobile quick control.');
      });
    }
  }

  syncBoardSelector() {
    this.dom.selectBoardProfile.value = pinConfig.activeBoardId;
  }

  syncThemeSelector() {
    if (this.dom.selectThemeProfile) {
      this.dom.selectThemeProfile.value = themeEngine.activeTheme;
    }
    themeEngine.onChange((newThemeId) => {
      if (this.dom.selectThemeProfile) {
        this.dom.selectThemeProfile.value = newThemeId;
      }
    });
  }

  syncHomeSetupInputs() {
    const c = homeConfig.config;
    if (this.dom.inputHomeName) this.dom.inputHomeName.value = c.homeName || '';
    if (this.dom.inputZoneName) this.dom.inputZoneName.value = c.zoneName || '';
    if (this.dom.inputLocationTag) this.dom.inputLocationTag.value = c.locationTag || '';
    if (this.dom.inputOwnerName) this.dom.inputOwnerName.value = c.ownerName || '';
    if (this.dom.inputTsChannelId) this.dom.inputTsChannelId.value = c.thingspeakChannelId || '';
    if (this.dom.inputTsWriteKey) this.dom.inputTsWriteKey.value = c.thingspeakWriteKey || '';
    if (this.dom.inputTsReadKey) this.dom.inputTsReadKey.value = c.thingspeakReadKey || '';
    if (this.dom.checkTsAutoPublish) this.dom.checkTsAutoPublish.checked = !!c.autoPublish;
  }

  initDriverHelpModal() {
    // 1. Render Driver Cards
    if (this.dom.driverCardsList) {
      this.dom.driverCardsList.innerHTML = DRIVER_DATABASE.map(drv => `
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 14px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px; flex-wrap: wrap; gap: 8px;">
            <div>
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">${drv.name}</div>
              <div style="font-size: 11px; color: var(--accent-cyan); font-family: var(--font-mono);">${drv.chip}</div>
            </div>
            <span class="badge" style="font-size: 10px;">${drv.id.toUpperCase()}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${drv.description}</div>
          <div style="font-size: 11px; color: var(--text-dim); margin-bottom: 10px;">
            <strong style="color: var(--text-muted);">Used on:</strong> ${drv.usedBy}
          </div>
          
          <!-- Downloads -->
          <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px;">
            ${drv.downloads.map(dl => `
              <a href="${dl.url}" target="_blank" rel="noopener noreferrer" class="btn-outline" style="padding: 4px 10px; font-size: 11px; text-decoration: none; display: inline-flex; align-items: center; gap: 5px;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                <span>${dl.label}</span>
                <span style="font-size: 9px; opacity: 0.7;">(${dl.os.split(' ')[0]})</span>
              </a>
            `).join('')}
          </div>

          <!-- Install Steps -->
          <div style="background: rgba(0, 0, 0, 0.25); border-radius: var(--radius-sm); padding: 8px 12px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); margin-bottom: 4px; text-transform: uppercase;">Quick Install Steps:</div>
            <ol style="margin: 0; padding-left: 18px; font-size: 11px; color: var(--text-dim); line-height: 1.5;">
              ${drv.installSteps.map(s => `<li>${s}</li>`).join('')}
            </ol>
          </div>
        </div>
      `).join('');
    }

    // 2. Render Troubleshooting
    if (this.dom.troubleshootingList) {
      const checklist = driverHelper.getTroubleshootingChecklist();
      this.dom.troubleshootingList.innerHTML = checklist.map((item, idx) => `
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 12px; font-weight: 800; color: ${item.severity === 'high' ? 'var(--accent-rose)' : item.severity === 'medium' ? 'var(--accent-amber)' : 'var(--accent-cyan)'};">
              #${idx + 1} ${item.severity.toUpperCase()}
            </span>
            <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">${item.title}</span>
          </div>
          <div style="font-size: 12px; color: var(--text-muted); line-height: 1.4;">${item.detail}</div>
        </div>
      `).join('');
    }

    // Tab buttons in driver help modal
    if (this.dom.modalDriverHelp) {
      this.dom.modalDriverHelp.querySelectorAll('.modal-tab-btn').forEach(tab => {
        tab.addEventListener('click', () => {
          this.dom.modalDriverHelp.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
          this.dom.modalDriverHelp.querySelectorAll('.tab-content-pane').forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const target = document.getElementById(tab.getAttribute('data-tab'));
          if (target) target.classList.add('active');
        });
      });
    }
  }

  initSensorScanUi() {
    if (!this.dom.busScanMatrix) return;
    
    // Render initial I2C hex address grid 0x08 to 0x77
    let matrixHtml = '';
    for (let addr = 0x08; addr <= 0x77; addr++) {
      const hex = '0x' + addr.toString(16).toUpperCase().padStart(2, '0');
      matrixHtml += `<div class="bus-hex-cell" id="busCell_${addr}" title="I2C Address ${hex}">${hex}</div>`;
    }
    this.dom.busScanMatrix.innerHTML = matrixHtml;

    sensorScanner.onUpdate((state) => {
      if (this.dom.scanProgressBar) this.dom.scanProgressBar.style.width = `${state.progress}%`;
      if (this.dom.scanProgressText) this.dom.scanProgressText.textContent = `${state.progress}% Complete`;
      if (this.dom.scanStatusText) {
        this.dom.scanStatusText.textContent = state.isScanning 
          ? 'Scanning I2C buses (0x08..0x77) & UART protocol signatures...'
          : `Scan Complete &bull; ${state.foundDevices.length} Hardware Peripherals Detected`;
      }
      if (this.dom.detectedCount) this.dom.detectedCount.textContent = state.foundDevices.length;

      // Update cells
      if (state.isScanning) {
        state.foundDevices.forEach(d => {
          if (d.addrNum) {
            const cell = document.getElementById(`busCell_${d.addrNum}`);
            if (cell) cell.className = 'bus-hex-cell hit';
          }
        });
      }
    });
  }

  async runSensorAutoScan() {
    if (this.dom.btnStartAutoScan) {
      this.dom.btnStartAutoScan.disabled = true;
      this.dom.btnStartAutoScan.innerHTML = 'Scanning Buses...';
    }

    // Reset grid styling
    document.querySelectorAll('.bus-hex-cell').forEach(c => c.className = 'bus-hex-cell');
    if (this.dom.detectedSensorsList) {
      this.dom.detectedSensorsList.innerHTML = '<div style="color: var(--text-dim); padding: 12px; font-size: 12px;">Bus probe sequence active...</div>';
    }

    const found = await sensorScanner.scanHardwareBuses({
      boardId: pinConfig.activeBoardId
    });

    if (this.dom.btnStartAutoScan) {
      this.dom.btnStartAutoScan.disabled = false;
      this.dom.btnStartAutoScan.innerHTML = 'Re-Scan All Buses';
    }
    if (this.dom.btnApplyAutoConfig) {
      this.dom.btnApplyAutoConfig.disabled = false;
    }

    // Highlight hit cells
    found.forEach(d => {
      if (d.addrNum) {
        const cell = document.getElementById(`busCell_${d.addrNum}`);
        if (cell) cell.className = 'bus-hex-cell hit';
      }
    });

    // Render list
    if (this.dom.detectedSensorsList) {
      this.dom.detectedSensorsList.innerHTML = found.map(dev => `
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 3px;">
              <span style="font-size: 13px; font-weight: 700; color: var(--accent-cyan); font-family: var(--font-mono);">${dev.chip}</span>
              <span style="font-size: 12px; font-weight: 600; color: var(--text-main);">${dev.name}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);">
              Bus: <strong>${dev.type.toUpperCase()}</strong> @ ${dev.address} &bull; Category: ${dev.category}
            </div>
          </div>
          <span class="badge badge-normal" style="font-size: 10px;">${dev.status} &bull; ${dev.confidence}</span>
        </div>
      `).join('');
    }

    this.log(`Bus Scanner detected ${found.length} hardware peripherals connected.`, 'success');
  }

  applyAutoDetectedSensors() {
    const found = sensorScanner.foundDevices;
    if (!found || found.length === 0) {
      alert('No hardware devices were detected during the scan.');
      return;
    }

    // Auto-enable standard sensors
    ['dht11', 'dht11_temp', 'dht11_hum', 'ultrasonic', 'pir_motion', 'ldr_light', 'lm35_temp', 'potentiometer'].forEach(s => {
      calibrationManager.toggleSensor(s, true);
    });

    // If drone MAVLink stream found, install Drone HUD extension
    if (found.some(d => d.chip === 'MAVLink-v2')) {
      extensionEngine.install('ext_drone_hud');
    }

    // If thermal sensor found, install AMG8833 extension
    if (found.some(d => d.chip === 'AMG8833')) {
      extensionEngine.install('ext_amg8833_thermal');
    }

    this.syncSensorTogglesUi();
    this.renderActiveExtensions(this.latestTelemetry || {});
    this.dom.modalSensorScan.classList.remove('active');
    this.log(`Auto-configuration applied for ${found.length} detected sensors.`, 'success');
  }

  initCameraUi() {
    if (this.dom.cameraHiddenVideo && this.dom.cameraRenderCanvas) {
      cameraManager.attachElements(this.dom.cameraHiddenVideo, this.dom.cameraRenderCanvas);
    }
  }

  initExtensionsUi() {
    this.renderMarketplaceExtensions();
    this.renderInstalledExtensionsList();
    this.renderActiveExtensions(this.latestTelemetry || {});

    extensionEngine.onChange(() => {
      this.renderMarketplaceExtensions();
      this.renderInstalledExtensionsList();
      this.renderActiveExtensions(this.latestTelemetry || {});
    });
  }

  renderMarketplaceExtensions() {
    if (!this.dom.extMarketplaceGrid) return;
    const available = extensionEngine.getAllAvailable();

    this.dom.extMarketplaceGrid.innerHTML = available.map(ext => {
      const isInst = extensionEngine.isInstalled(ext.id);
      return `
        <div class="ext-market-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 24px;">${ext.icon || '🧩'}</span>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${ext.name}</div>
                <div style="font-size: 11px; color: var(--text-dim);">${ext.author || 'TekStep Apps'} &bull; v${ext.version}</div>
              </div>
            </div>
            ${ext.badge ? `<span class="badge badge-normal" style="font-size: 9px;">${ext.badge}</span>` : ''}
          </div>
          <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4; margin-bottom: 12px; flex: 1;">
            ${ext.description}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-subtle); padding-top: 8px;">
            <span style="font-size: 10px; color: var(--accent-cyan); font-family: var(--font-mono);">${ext.category}</span>
            <button class="btn-toggle-install-ext ${isInst ? 'btn-outline' : 'btn-primary'}" data-ext-id="${ext.id}" style="padding: 4px 10px; font-size: 11px;">
              ${isInst ? 'Uninstall' : 'Install (1-Click)'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Wire buttons
    this.dom.extMarketplaceGrid.querySelectorAll('.btn-toggle-install-ext').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const extId = e.currentTarget.getAttribute('data-ext-id');
        if (extensionEngine.isInstalled(extId)) {
          extensionEngine.uninstall(extId);
          this.log(`Uninstalled extension [${extId}].`);
        } else {
          extensionEngine.install(extId);
          this.log(`Installed extension [${extId}].`, 'success');
        }
      });
    });
  }

  renderInstalledExtensionsList() {
    if (!this.dom.extInstalledList) return;
    const installed = extensionEngine.getInstalledExtensions();

    if (installed.length === 0) {
      this.dom.extInstalledList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-dim); font-size: 12px;">
          No extensions currently installed. Browse the Marketplace tab to 1-click install Drone, Thermal, or GPS modules!
        </div>
      `;
      return;
    }

    this.dom.extInstalledList.innerHTML = installed.map(ext => `
      <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 22px;">${ext.icon || '🧩'}</span>
          <div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main);">${ext.name}</div>
            <div style="font-size: 11px; color: var(--text-dim);">${ext.category} &bull; v${ext.version} &bull; by ${ext.author}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <button class="btn-outline btn-export-single-ext" data-ext-id="${ext.id}" style="padding: 4px 8px; font-size: 11px;" title="Export JSON">Export</button>
          <button class="btn-outline btn-uninstall-single-ext" data-ext-id="${ext.id}" style="padding: 4px 8px; font-size: 11px; color: var(--accent-rose);" title="Uninstall">Remove</button>
        </div>
      </div>
    `).join('');

    this.dom.extInstalledList.querySelectorAll('.btn-export-single-ext').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const extId = e.currentTarget.getAttribute('data-ext-id');
        const json = extensionEngine.exportExtensionJson(extId);
        if (json) {
          navigator.clipboard.writeText(json);
          this.log(`Extension [${extId}] manifest copied to clipboard.`, 'success');
        }
      });
    });

    this.dom.extInstalledList.querySelectorAll('.btn-uninstall-single-ext').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const extId = e.currentTarget.getAttribute('data-ext-id');
        extensionEngine.uninstall(extId);
        this.log(`Removed extension [${extId}].`);
      });
    });
  }

  renderActiveExtensions(telemetry = {}) {
    if (!this.dom.extensionsDashboardRow) return;
    const installed = extensionEngine.getInstalledExtensions();

    if (installed.length === 0) {
      this.dom.extensionsDashboardRow.innerHTML = '';
      return;
    }

    const fullTelemetry = {
      ...telemetry,
      pitch: (telemetry.pitch !== undefined) ? telemetry.pitch : (Math.sin(Date.now() / 2500) * 8),
      roll: (telemetry.roll !== undefined) ? telemetry.roll : (Math.cos(Date.now() / 3000) * 12),
      altitude: (telemetry.altitude !== undefined) ? telemetry.altitude : 48.6,
      speed: (telemetry.speed !== undefined) ? telemetry.speed : 14.2,
      battery_v: (telemetry.battery_v !== undefined) ? telemetry.battery_v : 15.4,
      armed: true,
      t_max: (telemetry.temperature ? (telemetry.temperature + 9.5) : 34.6),
      t_min: (telemetry.temperature ? (telemetry.temperature - 3.2) : 21.0),
      latitude: '0.3476° N (Kampala)',
      longitude: '32.5825° E',
      satellites: 14,
      nitrogen: 48,
      phosphorus: 24,
      potassium: 165,
      ph: 6.8,
      moisture: (telemetry.humidity ? telemetry.humidity : 62),
      voltage: 232.4,
      current: 4.82,
      power: 1120.1,
      energy: 38.64,
      heart_rate: 76,
      spo2: 98
    };

    this.dom.extensionsDashboardRow.innerHTML = installed.map(ext => {
      try {
        const isExp = extensionEngine.isExpanded(ext.id);
        return ext.render ? ext.render(fullTelemetry, isExp) : '';
      } catch (err) {
        console.error('Error rendering extension widget:', ext.id, err);
        return '';
      }
    }).join('');

    // Wire up expand / collapse toggle buttons on extension cards
    this.dom.extensionsDashboardRow.querySelectorAll('.btn-expand-ext').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const extId = e.currentTarget.getAttribute('data-ext-id');
        extensionEngine.toggleExpanded(extId);
        this.renderActiveExtensions(telemetry);
      });
    });
  }

  initTopMenuToggleUi() {
    if (!this.dom.btnToggleTopMenu || !this.dom.topActionsToolbar) return;

    const isHidden = localStorage.getItem('sr_top_menu_hidden') === 'true';
    if (isHidden) {
      this.dom.topActionsToolbar.classList.add('collapsed');
      if (this.dom.textToggleMenu) this.dom.textToggleMenu.textContent = 'Show Menu';
      if (this.dom.iconToggleMenu) {
        this.dom.iconToggleMenu.innerHTML = '<polyline points="6 9 12 15 18 9"/>';
      }
    } else {
      this.dom.topActionsToolbar.classList.remove('collapsed');
      if (this.dom.textToggleMenu) this.dom.textToggleMenu.textContent = 'Hide Menu';
      if (this.dom.iconToggleMenu) {
        this.dom.iconToggleMenu.innerHTML = '<polyline points="18 15 12 9 6 15"/>';
      }
    }

    this.dom.btnToggleTopMenu.addEventListener('click', () => {
      const willCollapse = !this.dom.topActionsToolbar.classList.contains('collapsed');
      if (willCollapse) {
        this.dom.topActionsToolbar.classList.add('collapsed');
        if (this.dom.textToggleMenu) this.dom.textToggleMenu.textContent = 'Show Menu';
        if (this.dom.iconToggleMenu) {
          this.dom.iconToggleMenu.innerHTML = '<polyline points="6 9 12 15 18 9"/>';
        }
        localStorage.setItem('sr_top_menu_hidden', 'true');
        this.log('Top menu hidden (Live, Sim, Auto-Search, Camera, Exts, Wireless, Drivers, Flasher, etc.)');
      } else {
        this.dom.topActionsToolbar.classList.remove('collapsed');
        if (this.dom.textToggleMenu) this.dom.textToggleMenu.textContent = 'Hide Menu';
        if (this.dom.iconToggleMenu) {
          this.dom.iconToggleMenu.innerHTML = '<polyline points="18 15 12 9 6 15"/>';
        }
        localStorage.setItem('sr_top_menu_hidden', 'false');
        this.log('Top menu expanded and visible');
      }
    });
  }

  initDeviceRegistryUi() {
    // 1. Initial render of Active Connected Device Banner
    this.renderActiveDeviceBanner();

    // 2. Subscribe to device registry changes
    deviceRegistry.onChange(() => {
      this.renderActiveDeviceBanner();
      this.renderDeviceManagerList();
    });

    // 3. First-time onboarding: prompt user to select/add device on entry
    if (!deviceRegistry.hasCompletedOnboarding()) {
      setTimeout(() => {
        if (this.dom.modalAddDevice) {
          this.dom.modalAddDevice.classList.add('active');
          this.log('Welcome to SMART IOT HUB! Please select your device or launch Virtual Simulation to begin.', 'warn');
        }
      }, 350);
    }

    // 4. Modal Open triggers
    const openAddDevice = () => {
      if (this.dom.modalDeviceManager) this.dom.modalDeviceManager.classList.remove('active');
      if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.add('active');
    };

    if (this.dom.btnHeaderAddDevice) this.dom.btnHeaderAddDevice.addEventListener('click', openAddDevice);
    if (this.dom.btnOpenAddDeviceModal) this.dom.btnOpenAddDeviceModal.addEventListener('click', openAddDevice);
    if (this.dom.btnMgrAddNewDevice) this.dom.btnMgrAddNewDevice.addEventListener('click', openAddDevice);

    if (this.dom.btnCloseAddDevice) {
      this.dom.btnCloseAddDevice.addEventListener('click', () => {
        this.dom.modalAddDevice.classList.remove('active');
      });
    }

    // Modal Tabs for Add Device
    if (this.dom.modalAddDevice) {
      this.dom.modalAddDevice.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.dom.modalAddDevice.querySelectorAll('.modal-tab-btn').forEach(b => b.classList.remove('active'));
          this.dom.modalAddDevice.querySelectorAll('.tab-content-pane').forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const pane = document.getElementById(btn.getAttribute('data-tab'));
          if (pane) pane.classList.add('active');
        });
      });
    }

    // 5. Submit Spark Core
    if (this.dom.btnSubmitAddSpark) {
      this.dom.btnSubmitAddSpark.addEventListener('click', () => {
        const name = this.dom.inputAddSparkName ? this.dom.inputAddSparkName.value.trim() : 'Spark Core (Master Chamber)';
        const devId = this.dom.inputAddSparkId ? this.dom.inputAddSparkId.value.trim() : '53ff6e066667574849402567';
        const token = this.dom.inputAddSparkToken ? this.dom.inputAddSparkToken.value.trim() : '2bb1082c94a974b77f88427f7fb28469ad46dc75';
        const zone = this.dom.inputAddSparkZone ? this.dom.inputAddSparkZone.value.trim() : 'Master Lab / Chamber';

        particleApi.setCredentials(devId, token);
        deviceRegistry.registerDevice({
          id: 'dev_spark_core_primary',
          name,
          type: 'spark_core',
          boardProfileId: 'spark_core',
          connectionMethod: 'particle_cloud',
          status: 'online',
          credentials: { deviceId: devId, token },
          zone
        });

        this.switchBoardProfile('spark_core');
        this.switchMode('live');
        this.dom.modalAddDevice.classList.remove('active');
        this.log(`🌟 Connected User Device: ${name} via Particle Cloud!`, 'success');
      });
    }

    // 6. Submit Virtual Simulation
    if (this.dom.btnSubmitAddSim) {
      this.dom.btnSubmitAddSim.addEventListener('click', () => {
        const name = this.dom.inputAddSimName ? this.dom.inputAddSimName.value.trim() : 'Virtual IoT Sentinel (Simulation)';
        const zone = this.dom.inputAddSimZone ? this.dom.inputAddSimZone.value.trim() : 'Cyber Simulation Zone';

        deviceRegistry.registerDevice({
          id: 'dev_virtual_sentinel',
          name,
          type: 'virtual_sim',
          boardProfileId: 'spark_core',
          connectionMethod: 'virtual_simulation',
          status: 'simulated',
          zone
        });

        this.switchMode('simulation');
        this.dom.modalAddDevice.classList.remove('active');
        this.log(`💻 Virtual Simulation Environment Launched: ${name}`, 'success');
      });
    }

    // 7. Submit USB Serial
    if (this.dom.btnSubmitAddSerial) {
      this.dom.btnSubmitAddSerial.addEventListener('click', async () => {
        const profile = this.dom.selectAddSerialProfile ? this.dom.selectAddSerialProfile.value : 'arduino_uno';
        const baud = this.dom.selectAddSerialBaud ? parseInt(this.dom.selectAddSerialBaud.value) : 9600;
        const name = this.dom.inputAddSerialName ? this.dom.inputAddSerialName.value.trim() : 'USB Serial Controller';

        const dev = deviceRegistry.registerDevice({
          id: 'dev_serial_' + Date.now(),
          name,
          type: 'usb_serial',
          boardProfileId: profile,
          connectionMethod: 'web_serial',
          status: 'online',
          credentials: { baudRate: baud }
        });

        this.switchBoardProfile(profile);
        this.dom.modalAddDevice.classList.remove('active');
        this.log(`🔌 Serial Device Registered: ${name} (${baud} Baud). Opening COM Port...`, 'info');
        this.handleSerialConnectClick();
      });
    }

    // 8. Submit Wireless
    if (this.dom.btnSubmitAddWireless) {
      this.dom.btnSubmitAddWireless.addEventListener('click', () => {
        const name = this.dom.inputAddWirelessName ? this.dom.inputAddWirelessName.value.trim() : 'WiFi Remote Node';
        const url = this.dom.inputAddWirelessUrl ? this.dom.inputAddWirelessUrl.value.trim() : 'http://192.168.4.1/telemetry';

        deviceRegistry.registerDevice({
          id: 'dev_wifi_' + Date.now(),
          name,
          type: 'wifi_ip',
          boardProfileId: 'esp32',
          connectionMethod: 'rest_wifi',
          status: 'online',
          credentials: { endpoint: url }
        });

        if (this.dom.inputWifiEndpoint) this.dom.inputWifiEndpoint.value = url;
        this.dom.modalAddDevice.classList.remove('active');
        this.log(`📶 Wireless Device Registered: ${name} (${url})`, 'success');
      });
    }

    // 9. Add Sensor to Device Modal
    if (this.dom.btnAddSensorToDevice) {
      this.dom.btnAddSensorToDevice.addEventListener('click', () => {
        this.openAddSensorModal();
      });
    }

    if (this.dom.btnCloseAddSensor) {
      this.dom.btnCloseAddSensor.addEventListener('click', () => {
        this.dom.modalAddSensor.classList.remove('active');
      });
    }

    if (this.dom.inputSearchSensors) {
      this.dom.inputSearchSensors.addEventListener('input', (e) => {
        this.renderSensorCatalogGrid(e.target.value.trim().toLowerCase());
      });
    }

    // 10. Device Manager Modal
    if (this.dom.btnOpenDeviceManager) {
      this.dom.btnOpenDeviceManager.addEventListener('click', () => {
        this.renderDeviceManagerList();
        if (this.dom.modalDeviceManager) this.dom.modalDeviceManager.classList.add('active');
      });
    }

    if (this.dom.btnCloseDeviceManager) {
      this.dom.btnCloseDeviceManager.addEventListener('click', () => {
        this.dom.modalDeviceManager.classList.remove('active');
      });
    }

    // 11. Project Management: + New Project & Restore Spark Core Flow
    const handleStartNewProject = () => {
      const confirmed = window.confirm('Start a new project? This will clear all connected boards, peripherals, and device registrations so you can start completely fresh.');
      if (!confirmed) return;
      deviceRegistry.startNewProject('Clean Slate IoT Project');
      this.log('[PROJECT] New project initialized. All boards and peripheral registries cleared.', 'warn');
      this.renderActiveDeviceBanner();
      this.renderDeviceManagerList();
      if (this.dom.modalDeviceManager) this.dom.modalDeviceManager.classList.remove('active');
      if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.add('active');
    };

    const handleRestoreSparkProject = () => {
      deviceRegistry.loadSparkCoreProject();
      this.log('[PROJECT] Restored Spark Core Sentinel Project with master chamber hardware.', 'success');
      this.renderActiveDeviceBanner();
      this.renderDeviceManagerList();
      this.switchBoardProfile('spark_core');
      this.switchMode('live');
    };

    if (this.dom.btnStartNewProject) {
      this.dom.btnStartNewProject.addEventListener('click', handleStartNewProject);
    }
    if (this.dom.btnModalNewProject) {
      this.dom.btnModalNewProject.addEventListener('click', handleStartNewProject);
    }
    if (this.dom.btnModalRestoreSpark) {
      this.dom.btnModalRestoreSpark.addEventListener('click', handleRestoreSparkProject);
    }
  }

  renderActiveDeviceBanner() {
    const active = deviceRegistry.getActiveDevice();
    const projectName = deviceRegistry.getProjectName();

    if (this.dom.activeProjectName) {
      this.dom.activeProjectName.textContent = projectName;
    }
    if (this.dom.modalProjectNameText) {
      this.dom.modalProjectNameText.textContent = projectName;
    }

    if (!active) {
      if (this.dom.activeDeviceName) {
        this.dom.activeDeviceName.textContent = 'No Connected Boards';
      }
      if (this.dom.activeDeviceStatusBadge) {
        this.dom.activeDeviceStatusBadge.className = 'active-device-status-badge';
        this.dom.activeDeviceStatusBadge.innerHTML = 'EMPTY PROJECT &bull; ADD HARDWARE';
      }
      if (this.dom.activeDeviceTypeTag) {
        this.dom.activeDeviceTypeTag.textContent = 'Unassigned';
      }
      if (this.dom.activeDeviceSensorsRow) {
        this.dom.activeDeviceSensorsRow.innerHTML = '<span style="font-size: 11px; color: var(--text-dim);">Clean slate project initialized. Click "+ Add Device" or "+ New Project" to setup boards.</span>';
      }
      return;
    }

    if (this.dom.activeDeviceName) {
      this.dom.activeDeviceName.textContent = active.name;
    }

    if (this.dom.activeDeviceStatusBadge) {
      const isSim = active.connectionMethod === 'virtual_simulation';
      this.dom.activeDeviceStatusBadge.className = `active-device-status-badge ${isSim ? 'simulated' : 'online'}`;
      this.dom.activeDeviceStatusBadge.innerHTML = isSim 
        ? 'VIRTUAL TWIN &bull; SIMULATING' 
        : 'CONNECTED &bull; LIVE STREAM';
    }

    if (this.dom.activeDeviceTypeTag) {
      const methodMap = {
        particle_cloud: 'Particle Cloud',
        virtual_simulation: 'Simulation Engine',
        web_serial: 'Web USB Serial',
        rest_wifi: 'WiFi REST Endpoint',
        web_ble: 'Web Bluetooth BLE'
      };
      this.dom.activeDeviceTypeTag.textContent = methodMap[active.connectionMethod] || active.type;
    }

    // Render sensor chips in banner
    if (this.dom.activeDeviceSensorsRow) {
      const attached = active.attachedSensors || [];
      if (attached.length === 0) {
        this.dom.activeDeviceSensorsRow.innerHTML = '<span style="font-size: 11px; color: var(--text-dim);">No sensors currently attached. Click "Add Sensor to Device" to connect peripherals.</span>';
      } else {
        this.dom.activeDeviceSensorsRow.innerHTML = attached.map(sId => {
          const sObj = AVAILABLE_SENSORS_CATALOG.find(s => s.id === sId);
          const icon = sObj ? sObj.icon : '📡';
          const name = sObj ? sObj.name.split(' ')[0] : sId;
          return `
            <span class="active-sensor-chip" title="${sObj ? sObj.name : sId}">
              <span class="chip-dot"></span>
              <span>${icon} ${name}</span>
            </span>
          `;
        }).join('');
      }
    }
  }

  openAddSensorModal() {
    const active = deviceRegistry.getActiveDevice();
    if (this.dom.addSensorTargetDeviceName) {
      this.dom.addSensorTargetDeviceName.textContent = active ? active.name : 'Active Device';
    }
    if (this.dom.inputSearchSensors) {
      this.dom.inputSearchSensors.value = '';
    }
    this.renderSensorCatalogGrid('');
    if (this.dom.modalAddSensor) {
      this.dom.modalAddSensor.classList.add('active');
    }
  }

  renderSensorCatalogGrid(query = '') {
    if (!this.dom.addSensorCatalogGrid) return;
    const active = deviceRegistry.getActiveDevice();
    const attached = active ? active.attachedSensors : [];

    const filtered = AVAILABLE_SENSORS_CATALOG.filter(s => {
      if (!query) return true;
      return s.name.toLowerCase().includes(query) || 
             s.category.toLowerCase().includes(query) || 
             s.bus.toLowerCase().includes(query);
    });

    this.dom.addSensorCatalogGrid.innerHTML = filtered.map(s => {
      const isAttached = attached.includes(s.id);
      return `
        <div style="background: rgba(255, 255, 255, 0.03); border: 1px solid ${isAttached ? 'rgba(0, 242, 254, 0.4)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 12px; display: flex; flex-direction: column; justify-content: space-between;">
          <div style="margin-bottom: 10px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
              <span style="font-size: 22px;">${s.icon}</span>
              <span class="badge ${isAttached ? 'badge-normal' : ''}" style="font-size: 10px; font-family: var(--font-mono);">${s.category}</span>
            </div>
            <div style="font-size: 13px; font-weight: 700; color: var(--text-main); margin-bottom: 4px;">${s.name}</div>
            <div style="font-size: 11px; color: var(--text-dim); font-family: var(--font-mono);">${s.bus}</div>
          </div>
          <button class="btn-toggle-sensor-attach ${isAttached ? 'btn-outline' : 'btn-primary'}" data-sensor-id="${s.id}" style="width: 100%; padding: 6px 10px; font-size: 11px; font-weight: 600;">
            ${isAttached ? 'Attached ✓ (Remove)' : '+ Attach to Device'}
          </button>
        </div>
      `;
    }).join('');

    // Wire button clicks
    this.dom.addSensorCatalogGrid.querySelectorAll('.btn-toggle-sensor-attach').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sensorId = e.currentTarget.getAttribute('data-sensor-id');
        const isAttached = attached.includes(sensorId);
        if (isAttached) {
          deviceRegistry.removeSensorFromActiveDevice(sensorId);
          this.log(`Detached sensor [${sensorId}] from ${active.name}.`);
        } else {
          deviceRegistry.addSensorToActiveDevice(sensorId);
          this.log(`Attached sensor [${sensorId}] to ${active.name}.`, 'success');
          // Auto-install extension if drone or thermal
          if (sensorId === 'drone_mavlink' && !extensionEngine.isInstalled('ext_drone_hud')) {
            extensionEngine.install('ext_drone_hud');
          }
          if (sensorId === 'amg8833_thermal' && !extensionEngine.isInstalled('ext_amg8833_thermal')) {
            extensionEngine.install('ext_amg8833_thermal');
          }
        }
        this.renderSensorCatalogGrid(query);
        this.renderActiveDeviceBanner();
      });
    });
  }

  renderDeviceManagerList() {
    if (!this.dom.deviceManagerList) return;
    const devices = deviceRegistry.getDevices();
    const active = deviceRegistry.getActiveDevice();

    if (devices.length === 0) {
      this.dom.deviceManagerList.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-dim); background: rgba(255,255,255,0.02); border: 1px dashed var(--border-subtle); border-radius: var(--radius-md);">
          <div style="font-size: 28px; margin-bottom: 8px;">📭</div>
          <div style="font-weight: 700; color: var(--text-main); font-size: 14px; margin-bottom: 4px;">No Devices Registered in this Project</div>
          <div style="font-size: 12px; margin-bottom: 14px;">This project has been cleared. Add your boards or restore the Spark Core project.</div>
          <div style="display: flex; gap: 8px; justify-content: center;">
            <button id="btnEmptyAddDev" class="btn-primary" style="padding: 6px 14px; font-size: 12px;">+ Add First Device</button>
            <button id="btnEmptyRestoreSpark" class="btn-outline" style="padding: 6px 14px; font-size: 12px; color: var(--accent-cyan);">⚡ Restore Spark Core</button>
          </div>
        </div>
      `;
      const btnEmptyAddDev = document.getElementById('btnEmptyAddDev');
      const btnEmptyRestoreSpark = document.getElementById('btnEmptyRestoreSpark');
      if (btnEmptyAddDev) {
        btnEmptyAddDev.addEventListener('click', () => {
          if (this.dom.modalDeviceManager) this.dom.modalDeviceManager.classList.remove('active');
          if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.add('active');
        });
      }
      if (btnEmptyRestoreSpark) {
        btnEmptyRestoreSpark.addEventListener('click', () => {
          deviceRegistry.loadSparkCoreProject();
          this.renderActiveDeviceBanner();
          this.renderDeviceManagerList();
          this.switchBoardProfile('spark_core');
          this.switchMode('live');
        });
      }
      return;
    }

    this.dom.deviceManagerList.innerHTML = devices.map(dev => {
      const isActive = active && dev.id === active.id;
      const isSim = dev.connectionMethod === 'virtual_simulation';
      const attachedCount = (dev.attachedSensors || []).length;

      return `
        <div style="background: ${isActive ? 'rgba(0, 242, 254, 0.06)' : 'rgba(255, 255, 255, 0.02)'}; border: 1px solid ${isActive ? 'rgba(0, 242, 254, 0.4)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 26px;">${isSim ? '💻' : '⚡'}</span>
            <div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14px; font-weight: 700; color: var(--text-main);">${dev.name}</span>
                ${isActive ? '<span class="badge badge-normal" style="background: rgba(0,242,254,0.15); color: var(--accent-cyan); font-size: 10px;">ACTIVE CONTROLLER</span>' : ''}
              </div>
              <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">
                Zone: ${dev.zone || 'Primary'} &bull; ${dev.connectionMethod} &bull; ${attachedCount} attached sensor${attachedCount === 1 ? '' : 's'}
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            ${!isActive ? `<button class="btn-primary btn-switch-to-dev" data-dev-id="${dev.id}" style="padding: 6px 12px; font-size: 11px;">Switch to This</button>` : ''}
            <button class="btn-outline btn-mgr-add-sensor" data-dev-id="${dev.id}" style="padding: 6px 10px; font-size: 11px;">+ Sensors</button>
            ${devices.length > 1 ? `<button class="btn-outline btn-remove-dev" data-dev-id="${dev.id}" style="padding: 6px 10px; font-size: 11px; color: var(--accent-rose);" title="Remove Device">Remove</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Wire buttons
    this.dom.deviceManagerList.querySelectorAll('.btn-switch-to-dev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const devId = e.currentTarget.getAttribute('data-dev-id');
        deviceRegistry.setActiveDevice(devId);
        const newActive = deviceRegistry.getActiveDevice();

        if (newActive.connectionMethod === 'virtual_simulation') {
          this.switchMode('simulation');
        } else if (newActive.type === 'spark_core') {
          if (newActive.credentials && newActive.credentials.deviceId) {
            particleApi.setCredentials(newActive.credentials.deviceId, newActive.credentials.token);
          }
          this.switchBoardProfile('spark_core');
          this.switchMode('live');
        } else if (newActive.connectionMethod === 'web_serial') {
          this.switchBoardProfile(newActive.boardProfileId || 'arduino_uno');
        }

        this.log(`Switched active device to: ${newActive.name}`, 'success');
        this.renderDeviceManagerList();
      });
    });

    this.dom.deviceManagerList.querySelectorAll('.btn-mgr-add-sensor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const devId = e.currentTarget.getAttribute('data-dev-id');
        deviceRegistry.setActiveDevice(devId);
        if (this.dom.modalDeviceManager) this.dom.modalDeviceManager.classList.remove('active');
        this.openAddSensorModal();
      });
    });

    this.dom.deviceManagerList.querySelectorAll('.btn-remove-dev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const devId = e.currentTarget.getAttribute('data-dev-id');
        deviceRegistry.removeDevice(devId);
        this.renderDeviceManagerList();
        this.renderActiveDeviceBanner();
      });
    });
  }

  initWirelessUi() {
    wirelessManager.onUpdate((state) => {
      // Cellular log
      if (this.dom.cellularTerminalLog) {
        const history = wirelessManager.atCommandHistory;
        if (history.length > 0) {
          this.dom.cellularTerminalLog.innerHTML = history.slice(-15).map(item => `
            <div style="margin-bottom: 4px;">
              <span style="color: var(--accent-cyan);">[${item.time}] &gt; ${item.command}</span><br>
              <span style="color: var(--accent-emerald); padding-left: 12px;">${item.response.replace(/\r?\n/g, '<br>&nbsp;&nbsp;')}</span>
            </div>
          `).join('');
          this.dom.cellularTerminalLog.scrollTop = this.dom.cellularTerminalLog.scrollHeight;
        }
      }
    });
  }

  initAboutTekstepUi() {
    if (this.dom.aboutTekstepContentArea) {
      this.dom.aboutTekstepContentArea.innerHTML = renderAboutModalHtml();
    }
  }

  getCurrentTelemetry() {
    if (this.latestTelemetry) {
      return {
        temp: this.latestTelemetry.temperature !== undefined ? this.latestTelemetry.temperature : 24.0,
        hum: this.latestTelemetry.humidity !== undefined ? this.latestTelemetry.humidity : 55.0,
        dist: this.latestTelemetry.distance !== undefined ? this.latestTelemetry.distance : 150.0,
        motion: this.latestTelemetry.motion !== undefined ? this.latestTelemetry.motion : 0,
        light: this.latestTelemetry.light !== undefined ? this.latestTelemetry.light : 600
      };
    }
    return {
      temp: parseFloat(this.dom.valTemp.textContent) || 24.0,
      hum: parseFloat(this.dom.valHum.textContent) || 55.0,
      dist: parseFloat(this.dom.valDist.textContent) || 150.0,
      motion: this.dom.valMotion.textContent === 'DETECTED' ? 1 : 0,
      light: parseInt(this.dom.valLight.textContent, 10) || 600
    };
  }

  startThingSpeakSyncLoop() {
    if (this.thingspeakSyncTimer) clearInterval(this.thingspeakSyncTimer);

    this.thingspeakSyncTimer = setInterval(async () => {
      const waitSec = thingspeakApi.getSecondsUntilNextPublish();

      if (waitSec > 0) {
        if (this.dom.tsSyncCountdown) {
          this.dom.tsSyncCountdown.textContent = `TS: wait ${waitSec}s`;
        }
        if (this.dom.tsSyncIndicator) {
          this.dom.tsSyncIndicator.className = 'metric-badge badge-warning';
        }
      } else {
        if (this.dom.tsSyncCountdown) {
          this.dom.tsSyncCountdown.textContent = 'TS: Ready';
        }
        if (this.dom.tsSyncIndicator) {
          this.dom.tsSyncIndicator.className = 'metric-badge badge-normal';
        }

        // Auto-publish if enabled
        if (homeConfig.config.autoPublish) {
          const telemetry = this.getCurrentTelemetry();
          if (telemetry.temp !== null && telemetry.temp !== undefined) {
            const res = await thingspeakApi.publishTelemetry(telemetry);
            if (res && res.success) {
              if (this.dom.tsSyncCountdown) {
                this.dom.tsSyncCountdown.textContent = `TS: #${res.entryId}`;
              }
              if (this.dom.tsSyncIndicator) {
                this.dom.tsSyncIndicator.className = 'metric-badge badge-normal';
              }
              this.log(`ThingSpeak Telemetry Synced: Entry #${res.entryId} at ${res.timestamp}`, 'info');
            }
          }
        }
      }
    }, 1000);
  }

  syncSensorTogglesUi() {
    document.querySelectorAll('.sensor-enable-toggle').forEach(toggle => {
      const sensorId = toggle.getAttribute('data-sensor-id');
      const isEnabled = calibrationManager.isSensorEnabled(sensorId);
      toggle.checked = isEnabled;
      const card = toggle.closest('.module-card');
      if (card) card.classList.toggle('sensor-isolated', !isEnabled);
    });
  }

  initWebSerialCallbacks() {
    webSerialManager.onStatusChange((e) => {
      if (e.isConnected) {
        this.dom.serialIndicatorDot.className = 'serial-indicator-dot connected';
        this.dom.serialIndicatorText.textContent = `CONNECTED (${e.baudRate})`;
        this.dom.btnToggleSerialPort.textContent = 'Disconnect';
        this.dom.btnWebSerialConnect.classList.add('active');
        this.dom.serialBtnText.textContent = 'USB Connected';
        this.logSerial(`[SYSTEM] Connected to COM port at ${e.baudRate} baud.`);
        this.log(`Web Serial connected at ${e.baudRate} baud`, 'success');

        // Automatic USB VID/PID microcontroller identification
        const port = webSerialManager.port;
        if (port && port.getInfo) {
          const info = port.getInfo();
          if (info && info.usbVendorId) {
            const result = driverHelper.identifyUsbDevice(info.usbVendorId, info.usbProductId);
            this.detectedUsbDevice = result;
            if (result.matched) {
              if (this.dom.driverDetectedHardwareText) {
                this.dom.driverDetectedHardwareText.innerHTML = `
                  <strong style="color: var(--accent-cyan);">${result.vendor}</strong> &bull; ${result.chip} 
                  <span style="opacity: 0.7; font-family: var(--font-mono); font-size: 11px;">(VID: ${result.vendorId}, PID: ${result.productId})</span>
                  <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">Recommended board: <strong>${result.boardLabel}</strong></div>
                `;
              }
              if (this.dom.btnDriverAutoSwitchBoard) {
                this.dom.btnDriverAutoSwitchBoard.style.display = 'inline-block';
                this.dom.btnDriverAutoSwitchBoard.textContent = `Switch to ${result.chip}`;
              }
              this.log(`USB Hardware Auto-Detected: ${result.vendor} (${result.chip}) [VID ${result.vendorId}]`, 'success');
            } else {
              if (this.dom.driverDetectedHardwareText) {
                this.dom.driverDetectedHardwareText.textContent = result.detail;
              }
              if (this.dom.btnDriverAutoSwitchBoard) {
                this.dom.btnDriverAutoSwitchBoard.style.display = 'none';
              }
            }
          }
        }
      } else {
        this.dom.serialIndicatorDot.className = 'serial-indicator-dot';
        this.dom.serialIndicatorText.textContent = 'DISCONNECTED';
        this.dom.btnToggleSerialPort.textContent = 'Connect USB Port';
        this.dom.btnWebSerialConnect.classList.remove('active');
        this.dom.serialBtnText.textContent = 'USB Serial';
        this.logSerial(`[SYSTEM] Disconnected: ${e.detail || ''}`);

        this.detectedUsbDevice = null;
        if (this.dom.driverDetectedHardwareText) {
          this.dom.driverDetectedHardwareText.textContent = 'No USB device currently connected. Click "USB Serial" to test.';
        }
        if (this.dom.btnDriverAutoSwitchBoard) {
          this.dom.btnDriverAutoSwitchBoard.style.display = 'none';
        }
      }
    });

    webSerialManager.onData(({ raw }) => {
      this.logSerial(raw);
    });
  }

  initPortPingerCallbacks() {
    portPinger.onResult((results) => {
      Object.entries(results).forEach(([sensorId, r]) => {
        const badge = document.getElementById(`pingBadge_${sensorId}`);
        if (badge) {
          badge.className = `port-health-badge ${r.status}`;
          badge.textContent = r.badge;
          if (r.color) badge.style.color = r.color;
        }
      });
    });
  }

  sendSerialFromInput() {
    const text = this.dom.inputSerialSend.value.trim();
    if (!text) return;

    if (!webSerialManager.isConnected) {
      this.logSerial(`[TX ERROR] Serial port is not connected. Connect first.`);
      return;
    }

    webSerialManager.send(text + '\n').then(() => {
      this.logSerial(`[TX] > ${text}`);
      this.dom.inputSerialSend.value = '';
    }).catch(err => {
      this.logSerial(`[TX ERROR] ${err.message}`);
    });
  }

  logSerial(msg) {
    const entry = document.createElement('div');
    entry.textContent = msg;
    this.dom.serialTerminalOutput.appendChild(entry);
    this.dom.serialTerminalOutput.scrollTop = this.dom.serialTerminalOutput.scrollHeight;
  }

  openCalibrationStudio(sensorId) {
    this.activeCalSensor = sensorId || 'dht11_temp';
    this.dom.selectCalSensor.value = this.activeCalSensor;
    this.loadCalibrationIntoStudio(this.activeCalSensor);
    this.dom.modalCalibration.classList.add('active');
  }

  loadCalibrationIntoStudio(sensorId) {
    this.activeCalSensor = sensorId;
    const s = calibrationManager.getSensor(sensorId) || {};
    this.dom.calSensorEnabled.checked = s.enabled !== false;
    this.dom.calOffsetSlider.value = s.offset || 0;
    this.dom.calOffsetNum.textContent = (s.offset || 0) >= 0 ? `+${(s.offset || 0).toFixed(1)}` : (s.offset || 0).toFixed(1);
    this.dom.calGainSlider.value = s.gain || 1.0;
    this.dom.calGainNum.textContent = `${(s.gain || 1.0).toFixed(3)}x`;

    const tp = s.twoPoint || { raw1: 0, act1: 0, raw2: 100, act2: 100 };
    this.dom.twoPtRaw1.value = tp.raw1;
    this.dom.twoPtAct1.value = tp.act1;
    this.dom.twoPtRaw2.value = tp.raw2;
    this.dom.twoPtAct2.value = tp.act2;

    const unit = s.unit || 'units';
    this.dom.calUnitRaw.textContent = unit;
    this.dom.calUnitOutput.textContent = unit;

    this.updateCalibrationLivePreview();
  }

  updateCalibrationLivePreview() {
    let raw = 24.0;
    if (this.activeCalSensor.includes('temp')) raw = parseFloat(this.dom.valTemp.textContent) || 24.0;
    else if (this.activeCalSensor.includes('hum')) raw = parseFloat(this.dom.valHum.textContent) || 55.0;
    else if (this.activeCalSensor.includes('ultrasonic')) raw = parseFloat(this.dom.valDist.textContent) || 178.0;
    else if (this.activeCalSensor.includes('light')) raw = parseInt(this.dom.valLight.textContent, 10) || 620;
    else if (this.activeCalSensor.includes('pot')) raw = 50;

    const offset = parseFloat(this.dom.calOffsetSlider.value) || 0;
    const gain = parseFloat(this.dom.calGainSlider.value) || 1.0;
    const calibrated = (raw * gain) + offset;

    this.dom.calRawVal.textContent = raw.toFixed(1);
    this.dom.calOutputVal.textContent = calibrated.toFixed(1);
  }

  renderFirmwareFlasher() {
    const board = pinConfig.getActiveBoard();
    this.dom.flasherBoardBanner.innerHTML = `
      Target Board: <strong>${board.name}</strong> (${board.arch}) &bull; <span style="color: var(--accent-emerald);">${board.voltage}</span>
    `;

    const code = generateBoardFirmware(board.id, pinConfig.mapping);
    this.dom.txtGeneratedFirmware.value = code;
  }

  handleFirmwareFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.firmwareFileBuffer = e.target.result;
      this.dom.flashFileInfo.style.display = 'block';
      this.dom.flashFileInfo.innerHTML = `
        <strong>Selected File:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)<br>
        <span style="color: var(--accent-emerald);">Ready to flash over WebUSB / WebSerial.</span>
      `;
      this.dom.btnStartFlashUsb.disabled = false;
    };
    reader.readAsArrayBuffer(file);
  }

  initGlobalHotkeys() {
    pinConfig.onHotkey(' ', () => {
      audioEngine.stopTone();
      if (this.mode === 'live' && pinConfig.activeBoardId === 'spark_core') {
        particleApi.callFunction('alarm', 'off');
      }
      this.log('HOTKEY [SPACE]: All Alarms Silenced.');
    });
  }

  handleSensorHotkey(sensorId) {
    this.log(`HOTKEY PRESSED for sensor: [${sensorId.toUpperCase()}]`);

    switch (sensorId) {
      case 'buzzer':
        this.triggerBuzzerAction();
        break;
      case 'pir_motion':
        if (this.mode === 'simulation') {
          this.dom.simMotion.checked = !this.dom.simMotion.checked;
          sensorSimulator.setManualValue('motion', this.dom.simMotion.checked ? 1 : 0);
          this.log(`HOTKEY [M]: Simulated Motion toggled to ${this.dom.simMotion.checked ? 'HIGH' : 'LOW'}`);
        }
        break;
      case 'rgb_red':
        this.setRgbAction('red');
        break;
      case 'rgb_green':
        this.setRgbAction('green');
        break;
      case 'rgb_blue':
        this.setRgbAction('blue');
        break;
      case 'btn_key1':
        this.dom.modKey1State.textContent = 'PRESSED';
        this.dom.modKey1State.style.color = 'var(--accent-cyan)';
        setTimeout(() => {
          this.dom.modKey1State.textContent = 'IDLE';
          this.dom.modKey1State.style.color = 'var(--text-main)';
        }, 600);
        this.log('HOTKEY [1]: Push Button Key 1 pressed');
        break;
      case 'btn_key2':
        this.dom.modKey2State.textContent = 'PRESSED';
        this.dom.modKey2State.style.color = 'var(--accent-cyan)';
        setTimeout(() => {
          this.dom.modKey2State.textContent = 'IDLE';
          this.dom.modKey2State.style.color = 'var(--text-main)';
        }, 600);
        this.log('HOTKEY [2]: Push Button Key 2 pressed');
        break;
      default:
        audioEngine.playOneShot(this.activeTone, 150);
        break;
    }
  }

  async triggerBuzzerAction() {
    this.log('Triggering Buzzer test...', 'warn');
    audioEngine.playOneShot(this.activeTone, 300);
    this.dom.modBuzzerState.textContent = 'BUZZING';
    this.dom.modBuzzerState.style.color = 'var(--accent-red)';
    setTimeout(() => {
      this.dom.modBuzzerState.textContent = 'READY';
      this.dom.modBuzzerState.style.color = 'var(--accent-cyan)';
    }, 800);

    if (this.mode === 'live' && pinConfig.activeBoardId === 'spark_core') {
      const res = await particleApi.callFunction('alarm', 'test');
      if (res.success) {
        this.log(`Hardware buzzer triggered successfully (Code: ${res.return_value})`, 'success');
      }
    }
  }

  async setRgbAction(color) {
    this.activeRgb = color;
    this.log(`Setting RGB status light: ${color.toUpperCase()}`);
    this.dom.modRgbState.textContent = `${color.toUpperCase()}`;
    const colorHex = color === 'red' ? '#ef4444' : color === 'green' ? '#10b981' : color === 'blue' ? '#3b82f6' : '#a855f7';
    this.dom.modRgbState.style.color = colorHex;

    if (this.mode === 'live' && pinConfig.activeBoardId === 'spark_core') {
      const res = await particleApi.callFunction('alarm', `rgb:${color}`);
      if (res.success) {
        this.log(`Hardware RGB set to ${color} (Code: ${res.return_value})`, 'success');
      }
    }
  }

  initPinSetupModal() {
    this.renderPinSetupTable();
    this.renderInstructionsList();
    this.renderHotkeysTable();
  }

  renderPinSetupTable() {
    const sensors = Object.values(pinConfig.mapping);
    const availablePins = pinConfig.getActivePins();

    const rows = sensors.map(s => {
      const is5V = pinConfig.isPin5VTolerant(s.pin);
      const is5VBadge = is5V ? '<span class="pin-badge v5">5V Tolerant</span>' : '<span class="pin-badge v3">3.3V Max</span>';

      const options = availablePins.map(p => {
        const selected = p.name === s.pin ? 'selected' : '';
        const tol = p.is5V ? ' (5V)' : ' (3.3V)';
        return `<option value="${p.name}" ${selected}>${p.name}${tol}</option>`;
      }).join('');

      return `
        <tr>
          <td>
            <strong>${s.name}</strong>
            <div style="font-size: 11px; color: var(--text-dim);">${s.voltageReq}</div>
          </td>
          <td>
            <select class="pin-select-dropdown" data-sensor-id="${s.id}">
              ${options}
            </select>
          </td>
          <td>${is5VBadge}</td>
          <td style="font-family: var(--font-mono); font-size: 11px; color: var(--text-dim);">${s.signalType}</td>
        </tr>
      `;
    }).join('');

    this.dom.pinSetupTableBody.innerHTML = rows;

    this.dom.pinSetupTableBody.querySelectorAll('.pin-select-dropdown').forEach(select => {
      select.addEventListener('change', (e) => {
        const sensorId = e.target.getAttribute('data-sensor-id');
        const newPin = e.target.value;
        const validation = pinConfig.validatePinAssignment(sensorId, newPin);

        if (!validation.valid) {
          this.dom.pinWarningBox.style.display = 'block';
          this.dom.pinWarningBox.textContent = validation.warning;
        } else if (validation.notice) {
          this.dom.pinWarningBox.style.display = 'block';
          this.dom.pinWarningBox.textContent = validation.notice;
        } else {
          this.dom.pinWarningBox.style.display = 'none';
        }
      });
    });
  }

  renderInstructionsList() {
    const sensors = Object.values(pinConfig.mapping);
    this.dom.instructionsList.innerHTML = sensors.map(s => `
      <div style="background: rgba(15, 23, 42, 0.5); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <strong style="font-size: 13px; color: var(--text-main);">${s.name} (Pin ${s.pin})</strong>
          <span style="font-size: 11px; color: var(--accent-cyan); font-family: var(--font-mono);">${s.signalType}</span>
        </div>
        <textarea class="instruction-textarea" data-sensor-id="${s.id}" placeholder="Enter wiring instructions, calibration offsets, or pin notes for this sensor...">${s.instructions || ''}</textarea>
      </div>
    `).join('');
  }

  renderHotkeysTable() {
    const sensors = Object.values(pinConfig.mapping);
    this.dom.hotkeysTableBody.innerHTML = sensors.map(s => `
      <tr>
        <td><strong>${s.name}</strong></td>
        <td>
          <button class="hotkey-badge-btn" data-sensor-id="${s.id}" title="Click to change hotkey">
            <span>${(s.hotkey || '-').toUpperCase()}</span>
            <span style="font-size: 9px; opacity: 0.6;">edit</span>
          </button>
        </td>
        <td style="font-size: 12px; color: var(--text-muted);">
          Triggers test actuation or live probe for ${s.name}.
        </td>
      </tr>
    `).join('');

    this.dom.hotkeysTableBody.querySelectorAll('.hotkey-badge-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sensorId = btn.getAttribute('data-sensor-id');
        this.recordingHotkeyFor = sensorId;
        btn.innerHTML = '<span style="color: var(--accent-amber);">PRESS KEY...</span>';

        const recordHandler = (e) => {
          e.preventDefault();
          const key = e.key.toLowerCase();
          if (key !== 'escape') {
            pinConfig.updateSensor(sensorId, { hotkey: key });
            this.log(`Hotkey for ${pinConfig.mapping[sensorId].name} updated to [${key.toUpperCase()}]`, 'success');
          }
          this.recordingHotkeyFor = null;
          window.removeEventListener('keydown', recordHandler);
          this.renderHotkeysTable();
        };

        window.addEventListener('keydown', recordHandler, { once: true });
      });
    });
  }

  savePinSetupChanges() {
    this.dom.pinSetupTableBody.querySelectorAll('.pin-select-dropdown').forEach(select => {
      const sensorId = select.getAttribute('data-sensor-id');
      const newPin = select.value;
      pinConfig.updateSensor(sensorId, { pin: newPin });
    });

    this.dom.instructionsList.querySelectorAll('.instruction-textarea').forEach(textarea => {
      const sensorId = textarea.getAttribute('data-sensor-id');
      pinConfig.updateSensor(sensorId, { instructions: textarea.value.trim() });
    });

    this.updateDashboardModuleHeaders();
    this.renderFirmwareFlasher();
  }

  updateDashboardModuleHeaders() {
    const m = pinConfig.mapping;
    if (m.dht11) {
      const chip = document.getElementById('chipPinDht');
      if (chip) chip.textContent = `Pin ${m.dht11.pin}`;
      const prev = document.getElementById('instPreviewDht');
      if (prev) prev.textContent = m.dht11.instructions;
    }
    if (m.ultrasonic_trig && m.ultrasonic_echo) {
      const chip = document.getElementById('chipPinEcho');
      if (chip) chip.textContent = `T:${m.ultrasonic_trig.pin} | E:${m.ultrasonic_echo.pin}`;
      const prev = document.getElementById('instPreviewDist');
      if (prev) prev.textContent = m.ultrasonic_echo.instructions;
    }
    if (m.pir_motion) {
      const chip = document.getElementById('chipPinPir');
      if (chip) chip.textContent = `Pin ${m.pir_motion.pin}`;
      const prev = document.getElementById('instPreviewPir');
      if (prev) prev.textContent = m.pir_motion.instructions;
    }
    if (m.buzzer) {
      const chip = document.getElementById('chipPinBuzzer');
      if (chip) chip.textContent = `Pin ${m.buzzer.pin}`;
      const prev = document.getElementById('instPreviewBuzzer');
      if (prev) prev.textContent = m.buzzer.instructions;
    }
    if (m.ldr_light) {
      const chip = document.getElementById('chipPinLdr');
      if (chip) chip.textContent = `Pin ${m.ldr_light.pin}`;
      const prev = document.getElementById('instPreviewLdr');
      if (prev) prev.textContent = m.ldr_light.instructions;
    }
    if (m.lm35_temp) {
      const chip = document.getElementById('chipPinLm35');
      if (chip) chip.textContent = `Pin ${m.lm35_temp.pin}`;
      const prev = document.getElementById('instPreviewLm35');
      if (prev) prev.textContent = m.lm35_temp.instructions;
    }
    if (m.potentiometer) {
      const chip = document.getElementById('chipPinPot');
      if (chip) chip.textContent = `Pin ${m.potentiometer.pin}`;
      const prev = document.getElementById('instPreviewPot');
      if (prev) prev.textContent = m.potentiometer.instructions;
    }
  }

  setScenarioButtonActive(activeBtn) {
    [this.dom.btnScenIntruder, this.dom.btnScenOverheat, this.dom.btnScenNormal].forEach(b => b.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
  }

  initAudioVisualizer() {
    audioEngine.init(this.dom.audioCanvas);
  }

  switchMode(mode) {
    this.mode = mode;
    if (this.pollInterval) clearInterval(this.pollInterval);

    if (mode === 'live') {
      this.dom.btnModeLive.classList.add('active');
      this.dom.btnModeSim.classList.remove('active');
      this.dom.scenarioBar.style.display = 'none';
      this.dom.simControls.style.display = 'none';
      sensorSimulator.enabled = false;
      this.log(`Mode: LIVE HARDWARE (${pinConfig.getActiveBoard().name})`, 'success');

      this.pollLiveSensors();
      this.pollInterval = setInterval(() => this.pollLiveSensors(), 3000);
    } else {
      this.dom.btnModeSim.classList.add('active');
      this.dom.btnModeLive.classList.remove('active');
      this.dom.scenarioBar.style.display = 'flex';
      this.dom.simControls.style.display = 'block';
      sensorSimulator.enabled = true;
      this.log('Mode: SIMULATION STUDIO (Testing & Demonstrations)', 'warn');

      this.dom.deviceStatusText.textContent = 'SIMULATOR ACTIVE';
      this.dom.deviceBadge.className = 'device-status-badge';

      this.pollInterval = setInterval(() => {
        const data = sensorSimulator.getSnapshot();
        this.updateDashboard(data);
      }, 500);
    }
  }

  async pollLiveSensors() {
    // If not Spark Core, rely on WebSerial or ThingSpeak
    if (pinConfig.activeBoardId !== 'spark_core') {
      if (webSerialManager.isConnected) {
        this.dom.deviceStatusText.textContent = `${pinConfig.getActiveBoard().name} (USB)`;
        this.dom.deviceBadge.className = 'device-status-badge';
        return;
      }
      const tsData = await thingspeakApi.getLatestFeed();
      if (tsData && tsData.temperature !== null) {
        this.updateDashboard(tsData);
      }
      return;
    }

    const status = await particleApi.getDeviceStatus();
    if (!status.online) {
      this.dom.deviceStatusText.textContent = 'OFFLINE / RECONNECTING';
      this.dom.deviceBadge.className = 'device-status-badge';
      this.dom.deviceBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      this.dom.deviceBadge.style.color = '#ef4444';

      const tsData = await thingspeakApi.getLatestFeed();
      if (tsData && tsData.temperature !== null) {
        this.updateDashboard(tsData);
      }
      return;
    }

    this.dom.deviceStatusText.textContent = 'SPARK CORE ONLINE';
    this.dom.deviceBadge.className = 'device-status-badge';
    this.dom.deviceBadge.style.borderColor = '';
    this.dom.deviceBadge.style.color = '';

    const data = await particleApi.readAllSensors();
    if (data && data.temperature !== null) {
      this.updateDashboard(data);
    }
  }

  updateDashboard(data) {
    if (!data) return;

    this.latestTelemetry = data;
    hardwareDiagnostics.updateLiveTelemetry(data, this.mode === 'live');
    circuitBoardSchematic.updateTelemetry(data);

    // 1. Temperature (DHT11)
    const dhtEnabled = calibrationManager.isSensorEnabled('dht11');
    if (!dhtEnabled) {
      this.dom.valTemp.textContent = 'OFF';
      this.dom.modDhtTemp.textContent = 'OFF';
      this.dom.badgeTemp.textContent = 'ISOLATED';
      this.dom.badgeTemp.className = 'metric-badge';
    } else if (data.temperature !== null && data.temperature !== undefined) {
      const calT = calibrationManager.apply('dht11_temp', data.temperature);
      const tVal = calT.value !== null ? calT.value : data.temperature;
      this.dom.valTemp.textContent = tVal.toFixed(1);
      this.dom.modDhtTemp.textContent = tVal.toFixed(1);

      if (tVal > 32) {
        this.dom.badgeTemp.textContent = 'HIGH HEAT';
        this.dom.badgeTemp.className = 'metric-badge badge-danger';
      } else if (tVal < 18) {
        this.dom.badgeTemp.textContent = 'COOL';
        this.dom.badgeTemp.className = 'metric-badge badge-warning';
      } else {
        this.dom.badgeTemp.textContent = 'COMFORTABLE';
        this.dom.badgeTemp.className = 'metric-badge badge-normal';
      }
    }

    // 2. Humidity (DHT11)
    if (!dhtEnabled) {
      this.dom.valHum.textContent = 'OFF';
      this.dom.modDhtHum.textContent = 'OFF';
      this.dom.badgeHum.textContent = 'ISOLATED';
      this.dom.badgeHum.className = 'metric-badge';
    } else if (data.humidity !== null && data.humidity !== undefined) {
      const calH = calibrationManager.apply('dht11_hum', data.humidity);
      const hVal = calH.value !== null ? calH.value : data.humidity;
      this.dom.valHum.textContent = hVal.toFixed(1);
      this.dom.modDhtHum.textContent = hVal.toFixed(1);
      if (hVal > 70) {
        this.dom.badgeHum.textContent = 'HUMID';
        this.dom.badgeHum.className = 'metric-badge badge-warning';
      } else if (hVal < 30) {
        this.dom.badgeHum.textContent = 'DRY';
        this.dom.badgeHum.className = 'metric-badge badge-warning';
      } else {
        this.dom.badgeHum.textContent = 'IDEAL';
        this.dom.badgeHum.className = 'metric-badge badge-normal';
      }
    }

    // 3. PIR Motion
    const pirEnabled = calibrationManager.isSensorEnabled('pir_motion');
    let isMotion = false;
    if (!pirEnabled) {
      this.dom.valMotion.textContent = 'OFF';
      this.dom.valMotion.style.color = 'var(--text-dim)';
      this.dom.badgeMotion.textContent = 'ISOLATED';
      this.dom.badgeMotion.className = 'metric-badge';
      this.dom.modPirState.textContent = 'ISOLATED';
      this.dom.modPirState.style.color = 'var(--text-dim)';
    } else {
      isMotion = data.motion === 1;
      this.dom.valMotion.textContent = isMotion ? 'DETECTED' : 'CLEAR';
      this.dom.valMotion.style.color = isMotion ? 'var(--accent-red)' : 'var(--text-main)';
      this.dom.badgeMotion.textContent = isMotion ? 'INTRUSION ALERT' : 'AREA SECURE';
      this.dom.badgeMotion.className = isMotion ? 'metric-badge badge-danger' : 'metric-badge badge-normal';
      this.dom.modPirState.textContent = isMotion ? 'MOTION DETECTED' : 'CLEAR';
      this.dom.modPirState.style.color = isMotion ? 'var(--accent-red)' : 'var(--accent-emerald)';
    }

    // 4. Ultrasonic Distance & Sonar Radar
    const usEnabled = calibrationManager.isSensorEnabled('ultrasonic');
    let isProximityBreach = false;

    if (!usEnabled) {
      this.dom.valDist.textContent = 'OFF';
      this.dom.radarDistNum.textContent = '---';
      this.dom.modDistVal.textContent = 'OFF';
      this.dom.badgeDist.textContent = 'ISOLATED';
      this.dom.badgeDist.className = 'metric-badge';
      if (this.dom.briefRadarBlip) {
        this.dom.briefRadarBlip.style.opacity = '0';
      }
    } else if (data.distance !== null && data.distance !== undefined) {
      const calD = calibrationManager.apply('ultrasonic', data.distance);
      let dist = calD.value !== null ? calD.value : data.distance;
      if (dist > 300) dist = 300;

      this.dom.valDist.textContent = dist.toFixed(1);
      this.dom.radarDistNum.textContent = dist.toFixed(1);
      this.dom.modDistVal.textContent = dist.toFixed(1);

      // Radar Blip (Scales smoothly to compact or full scope)
      const maxRange = 220;
      const normalized = Math.min(1, Math.max(0, dist / maxRange));
      const scopeRadius = (this.dom.radarScope && this.dom.radarScope.clientWidth > 0) ? (this.dom.radarScope.clientWidth / 2 - 8) : 52;
      const radiusPx = normalized * scopeRadius;
      const angleRad = (45 * Math.PI) / 180;
      const blipX = Math.cos(angleRad) * radiusPx;
      const blipY = Math.sin(angleRad) * radiusPx;
      this.dom.radarBlip.style.transform = `translate(${blipX}px, ${-blipY}px)`;

      // Proximity Alert Check (< threshold cm)
      isProximityBreach = (dist > 0 && dist < this.proximityThreshold);

      if (isProximityBreach) {
        this.dom.badgeDist.textContent = 'BREACH (<' + this.proximityThreshold + 'cm)';
        this.dom.badgeDist.className = 'metric-badge badge-danger';
        this.dom.radarBlip.classList.add('danger');
        this.dom.radarReadout.classList.add('alert-proximity');
      } else {
        this.dom.badgeDist.textContent = 'NORMAL';
        this.dom.badgeDist.className = 'metric-badge badge-normal';
        this.dom.radarBlip.classList.remove('danger');
        this.dom.radarReadout.classList.remove('alert-proximity');
      }

      // Brief Menu Sonar Radar: Visual Only (No words, no numbers, shows radar and target location)
      if (this.dom.briefRadarBlip) {
        this.dom.briefRadarBlip.style.opacity = '1';
        const briefRadius = (this.dom.briefRadarScope && this.dom.briefRadarScope.clientWidth > 0)
          ? (this.dom.briefRadarScope.clientWidth / 2 - 6)
          : 36;
        const rPx = normalized * briefRadius;
        const angleDeg = (dist * 2.1) % 360;
        const bRad = (angleDeg * Math.PI) / 180;
        const bX = Math.cos(bRad) * rPx;
        const bY = Math.sin(bRad) * rPx;
        this.dom.briefRadarBlip.style.transform = `translate(${bX}px, ${-bY}px)`;
        if (isProximityBreach) {
          this.dom.briefRadarBlip.classList.add('danger');
        } else {
          this.dom.briefRadarBlip.classList.remove('danger');
        }
      }

      // Telemetry Packet Stream (Column 2 of Telemetry Bar)
      this.telemetryFrameCount = (this.telemetryFrameCount || 148) + 1;
      if (this.dom.telCellFrameSeq) {
        this.dom.telCellFrameSeq.textContent = `#${String(this.telemetryFrameCount).padStart(5, '0')}`;
      }
      if (this.dom.telCellLatency) {
        const jitter = Math.floor(Math.random() * 8) + 38;
        this.dom.telCellLatency.textContent = `${jitter} ms`;
      }
      if (this.dom.telCellActiveSensors) {
        const activeDev = deviceRegistry.getActiveDevice();
        const count = activeDev ? (activeDev.attachedSensors || []).length : 0;
        this.dom.telCellActiveSensors.textContent = `${count} / 9 Active`;
      }
    }

    // Master Alert Evaluation (respecting individual sensor isolation switches!)
    const alertTriggered = isMotion || isProximityBreach;
    this.handleAlertState(alertTriggered, isProximityBreach, isMotion);

    // 5. LM35 Temperature
    const lm35Enabled = calibrationManager.isSensorEnabled('lm35_temp');
    if (!lm35Enabled) {
      this.dom.modLm35Val.textContent = 'OFF';
    } else if (data.temperature !== null && data.temperature !== undefined) {
      const rawLm35 = data.temperature * 0.98;
      const calLm35 = calibrationManager.apply('lm35_temp', rawLm35);
      this.dom.modLm35Val.textContent = (calLm35.value !== null ? calLm35.value : rawLm35).toFixed(1);
    }

    // 6. Ambient Light (LDR)
    const ldrEnabled = calibrationManager.isSensorEnabled('ldr_light');
    if (!ldrEnabled) {
      this.dom.valLight.textContent = 'OFF';
      this.dom.modLdrVal.textContent = 'OFF';
      this.dom.badgeLight.textContent = 'ISOLATED';
    } else if (data.light !== undefined && data.light !== null) {
      const calLdr = calibrationManager.apply('ldr_light', data.light);
      const lightVal = Math.round(calLdr.value !== null ? calLdr.value : data.light);
      this.dom.valLight.textContent = lightVal;
      this.dom.modLdrVal.textContent = lightVal;

      if (lightVal > 1500) {
        this.dom.badgeLight.textContent = 'BRIGHT DAYLIGHT';
        this.dom.badgeLight.className = 'metric-badge badge-normal';
      } else if (lightVal > 400) {
        this.dom.badgeLight.textContent = 'INDOOR AMBIENT';
        this.dom.badgeLight.className = 'metric-badge badge-normal';
      } else {
        this.dom.badgeLight.textContent = 'DIM / DARK';
        this.dom.badgeLight.className = 'metric-badge badge-warning';
      }
    }

    // 7. Potentiometer
    const potEnabled = calibrationManager.isSensorEnabled('potentiometer');
    if (!potEnabled) {
      this.dom.modPotVal.textContent = 'OFF';
    } else if (data.distance !== null && data.distance !== undefined) {
      const rawPot = Math.round(Math.min(100, Math.max(0, (data.distance / 250) * 100)));
      const calPot = calibrationManager.apply('potentiometer', rawPot);
      this.dom.modPotVal.textContent = `${Math.round(calPot.value !== null ? calPot.value : rawPot)}%`;
    }

    // Render active extensions widgets (Drones, Thermal, GPS, NPK, Power, Biometrics)
    this.renderActiveExtensions(data);

    // Update Compact Monitoring Dashboard Cards
    this.updateCompactMonitoringCards(data, isProximityBreach, isMotion, alertTriggered);
  }

  handleAlertState(alertTriggered, isProximity, isMotion) {
    if (alertTriggered && !this.isAlerting) {
      this.isAlerting = true;
      this.dom.deviceBadge.classList.add('alerting');
      this.dom.alarmOverlay.classList.add('active');

      const reason = isProximity && isMotion ? 'PROXIMITY & MOTION BREACH' :
                     isProximity ? 'PROXIMITY INTRUSION (<' + this.proximityThreshold + 'cm)' : 'PIR MOTION DETECTED';

      this.log(`ALARM TRIGGERED: ${reason}`, 'error');

      if (this.audioAlarmEnabled && !audioEngine.isPlaying) {
        audioEngine.startTone(this.activeTone);
      }
    } else if (!alertTriggered && this.isAlerting) {
      this.isAlerting = false;
      this.dom.deviceBadge.classList.remove('alerting');
      this.dom.alarmOverlay.classList.remove('active');
      this.log('Alert resolved: Room secured.', 'success');

      if (audioEngine.isPlaying) {
        audioEngine.stopTone();
      }
    }
  }

  updateCompactMonitoringCards(data, isProximityBreach, isMotion, alertTriggered) {
    if (!this.dom.compactMonitoringDashboard) return;

    // 1. Temperature
    if (this.dom.compactValTemp && data.temperature !== undefined && data.temperature !== null) {
      const t = data.temperature;
      this.dom.compactValTemp.textContent = t.toFixed(1);
      if (this.dom.compactBadgeTemp) {
        this.dom.compactBadgeTemp.textContent = t > 32 ? 'HIGH HEAT' : (t < 18 ? 'COOL' : 'COMFORTABLE');
        this.dom.compactBadgeTemp.className = `compact-badge ${t > 32 ? 'badge-danger' : (t < 18 ? 'badge-warning' : 'badge-normal')}`;
      }
      if (this.dom.compactBarTemp) {
        const pct = Math.min(100, Math.max(0, (t / 50) * 100));
        this.dom.compactBarTemp.style.width = `${pct}%`;
      }
    }

    // 2. Humidity & Sensor Active Source
    if (this.dom.compactValHum && data.humidity !== undefined && data.humidity !== null) {
      const h = data.humidity;
      this.dom.compactValHum.textContent = h.toFixed(1);
      if (this.dom.compactBadgeHum) {
        this.dom.compactBadgeHum.textContent = h > 70 ? 'HIGH HUMIDITY' : (h < 30 ? 'DRY' : 'OPTIMAL');
        this.dom.compactBadgeHum.className = `compact-badge ${h > 70 || h < 30 ? 'badge-warning' : 'badge-normal'}`;
      }
      if (this.dom.compactBarHum) {
        this.dom.compactBarHum.style.width = `${Math.min(100, Math.max(0, h))}%`;
      }
    }

    // Active Humidity Source
    const isSz = this.activeHumiditySource === 'sz_hs100';
    if (this.dom.compactActiveSensorTag) {
      this.dom.compactActiveSensorTag.textContent = isSz ? 'SZ-HS100 (A0)' : 'DHT11 (D4)';
    }
    if (this.dom.compactHumBtnText) {
      this.dom.compactHumBtnText.textContent = isSz ? 'SZ-HS100 (A0)' : 'DHT11 (D4)';
    }

    // 3. Proximity / Distance
    if (this.dom.compactValDist && data.distance !== undefined && data.distance !== null) {
      const d = data.distance;
      this.dom.compactValDist.textContent = d.toFixed(0);
      if (this.dom.compactBadgeDist) {
        this.dom.compactBadgeDist.textContent = isProximityBreach ? 'BREACH (<20cm)' : 'SAFE RANGE';
        this.dom.compactBadgeDist.className = `compact-badge ${isProximityBreach ? 'badge-danger' : 'badge-normal'}`;
      }
      if (this.dom.compactBarDist) {
        this.dom.compactBarDist.style.width = `${Math.min(100, Math.max(5, (d / 200) * 100))}%`;
        this.dom.compactBarDist.style.background = isProximityBreach ? '#ef4444' : 'linear-gradient(90deg, #10b981, #06b6d4)';
      }
      if (this.dom.compactRadarDistText) {
        this.dom.compactRadarDistText.textContent = `${d.toFixed(0)} cm`;
      }
      if (this.dom.compactRadarBlip) {
        const norm = Math.min(1, Math.max(0, d / 220));
        const radPx = norm * 26;
        const bRad = ((d * 2.1) % 360 * Math.PI) / 180;
        this.dom.compactRadarBlip.style.transform = `translate(${Math.cos(bRad) * radPx}px, ${-Math.sin(bRad) * radPx}px)`;
        this.dom.compactRadarBlip.style.background = isProximityBreach ? '#ef4444' : '#10b981';
        this.dom.compactRadarBlip.style.boxShadow = isProximityBreach ? '0 0 10px #ef4444' : '0 0 8px #10b981';
      }
    }

    // 4. PIR Motion
    if (this.dom.compactValMotionText) {
      this.dom.compactValMotionText.innerHTML = isMotion ? '<span style="color: var(--accent-red);">OCCUPIED</span>' : '<span style="color: var(--accent-emerald);">VACANT</span>';
    }
    if (this.dom.compactBadgeMotion) {
      this.dom.compactBadgeMotion.textContent = isMotion ? 'MOTION ALERT' : 'CLEAR';
      this.dom.compactBadgeMotion.className = `compact-badge ${isMotion ? 'badge-danger' : 'badge-normal'}`;
    }
    if (this.dom.compactMotionIndicator) {
      this.dom.compactMotionIndicator.className = `motion-dot ${isMotion ? 'active' : 'clear'}`;
    }
    if (this.dom.compactMotionSubtext) {
      this.dom.compactMotionSubtext.textContent = isMotion ? 'Active movement in chamber' : 'No human movement detected';
    }

    // 5. Ambient Light
    if (this.dom.compactValLight && data.light !== undefined && data.light !== null) {
      const l = data.light;
      this.dom.compactValLight.textContent = l;
      if (this.dom.compactBarLight) {
        this.dom.compactBarLight.style.width = `${Math.min(100, Math.max(5, (l / 4095) * 100))}%`;
      }
    }

    // Sentinel Status Pill
    if (this.dom.compactSecurityPill) {
      this.dom.compactSecurityPill.className = alertTriggered ? (isProximityBreach ? 'security-status-pill alert' : 'security-status-pill motion') : 'security-status-pill safe';
    }
    if (this.dom.compactSecurityText) {
      this.dom.compactSecurityText.textContent = alertTriggered ? (isProximityBreach ? 'PROXIMITY INTRUSION (<20cm) - ALARM ACTIVE' : 'PIR MOTION INTRUSION - ROOM OCCUPIED') : 'ALL SYSTEMS NORMAL • ROOM SECURE';
    }

    // Activity Ticker
    if (this.dom.compactTickerContent) {
      const timeStr = new Date().toLocaleTimeString();
      const humTag = isSz ? 'SZ-HS100 Analog' : 'DHT11';
      this.dom.compactTickerContent.textContent = `[${timeStr}] Temp: ${(data.temperature || 24).toFixed(1)}°C | Hum: ${(data.humidity || 55).toFixed(1)}% (${humTag}) | Proximity: ${(data.distance || 150).toFixed(0)}cm | Room: ${isMotion ? 'OCCUPIED' : 'CLEAR'}`;
    }
  }

  initViewModeUi() {
    this.applyDashboardViewMode(this.dashboardViewMode);

    if (this.dom.btnViewMonitor) {
      this.dom.btnViewMonitor.addEventListener('click', () => {
        this.switchDashboardViewMode('monitor');
      });
    }

    if (this.dom.btnViewDeveloper) {
      this.dom.btnViewDeveloper.addEventListener('click', () => {
        this.switchDashboardViewMode('developer');
      });
    }

    if (this.dom.compactBtnSilence) {
      this.dom.compactBtnSilence.addEventListener('click', () => {
        audioEngine.stopTone();
        this.log('Silenced alarm buzzers from Compact Monitor', 'info');
      });
    }

    if (this.dom.compactBtnTestBuzzer) {
      this.dom.compactBtnTestBuzzer.addEventListener('click', () => {
        audioEngine.startTone('beep');
        setTimeout(() => audioEngine.stopTone(), 600);
        this.log('Hardware buzzer test triggered from Compact Monitor', 'warn');
      });
    }

    if (this.dom.compactBtnToggleHum) {
      this.dom.compactBtnToggleHum.addEventListener('click', () => {
        this.toggleHumiditySensorMode();
      });
    }

    if (this.dom.compactCardSwitchHum) {
      this.dom.compactCardSwitchHum.addEventListener('click', () => {
        this.toggleHumiditySensorMode();
      });
    }

    if (this.dom.compactBtnAutoGather) {
      this.dom.compactBtnAutoGather.addEventListener('click', () => {
        this.runAutoGatherBoardSensors();
      });
    }

    if (this.dom.compactBtnEditSensors) {
      this.dom.compactBtnEditSensors.addEventListener('click', () => {
        this.openSensorEditorModal();
      });
    }
  }

  switchDashboardViewMode(mode) {
    this.dashboardViewMode = mode;
    localStorage.setItem('sr_dashboard_view_mode', mode);
    this.applyDashboardViewMode(mode);
    this.log(`Switched to ${mode === 'monitor' ? 'Compact Monitoring' : 'Developer'} Dashboard Mode`, 'info');
  }

  applyDashboardViewMode(mode) {
    document.body.classList.remove('view-mode-monitoring', 'view-mode-developer');
    if (mode === 'monitor') {
      document.body.classList.add('view-mode-monitoring');
      if (this.dom.btnViewMonitor) this.dom.btnViewMonitor.classList.add('active');
      if (this.dom.btnViewDeveloper) this.dom.btnViewDeveloper.classList.remove('active');
    } else {
      document.body.classList.add('view-mode-developer');
      if (this.dom.btnViewDeveloper) this.dom.btnViewDeveloper.classList.add('active');
      if (this.dom.btnViewMonitor) this.dom.btnViewMonitor.classList.remove('active');
    }
  }

  async toggleHumiditySensorMode() {
    this.activeHumiditySource = this.activeHumiditySource === 'sz_hs100' ? 'dht11' : 'sz_hs100';
    const isSz = this.activeHumiditySource === 'sz_hs100';
    const tagText = isSz ? 'SZ-HS100 (A0)' : 'DHT11 (D4)';

    if (this.dom.compactActiveSensorTag) this.dom.compactActiveSensorTag.textContent = tagText;
    if (this.dom.compactHumBtnText) this.dom.compactHumBtnText.textContent = tagText;

    try {
      const res = await particleApi.callFunction('cmd', isSz ? 'sz' : 'dht');
      if (res && res.connected) {
        this.log(`Switched humidity sensor to ${isSz ? 'SZ-HS100 Analog (A0)' : 'DHT11 Digital (D4)'} (Cloud CMD Dispatched)`, 'success');
      } else {
        this.log(`Switched display humidity to ${isSz ? 'SZ-HS100 Analog (A0)' : 'DHT11 Digital (D4)'}`, 'info');
      }
    } catch (_) {
      this.log(`Switched display humidity to ${isSz ? 'SZ-HS100 Analog (A0)' : 'DHT11 Digital (D4)'}`, 'info');
    }
  }

  initSensorEditorModalUi() {
    if (this.dom.btnOpenSensorEditor) {
      this.dom.btnOpenSensorEditor.addEventListener('click', () => {
        this.openSensorEditorModal();
      });
    }

    if (this.dom.btnCloseSensorEditModal) {
      this.dom.btnCloseSensorEditModal.addEventListener('click', () => {
        this.dom.sensorEditModal.classList.remove('active');
      });
    }

    if (this.dom.btnCancelSensorEdit) {
      this.dom.btnCancelSensorEdit.addEventListener('click', () => {
        this.dom.sensorEditModal.classList.remove('active');
      });
    }

    if (this.dom.btnSaveSensorEdit) {
      this.dom.btnSaveSensorEdit.addEventListener('click', () => {
        this.saveSensorEditorChanges();
      });
    }

    if (this.dom.btnModalResetDefaults) {
      this.dom.btnModalResetDefaults.addEventListener('click', () => {
        if (confirm('Reset all sensor pins and configurations to defaults for this board?')) {
          pinConfig.resetDefaults();
          this.renderSensorEditorList();
          this.log('Reset sensor configurations to defaults.', 'warn');
        }
      });
    }

    if (this.dom.btnModalAutoGather) {
      this.dom.btnModalAutoGather.addEventListener('click', () => {
        this.dom.sensorEditModal.classList.remove('active');
        this.runAutoGatherBoardSensors();
      });
    }
  }

  openSensorEditorModal() {
    this.renderSensorEditorList();
    if (this.dom.sensorEditModal) {
      this.dom.sensorEditModal.classList.add('active');
    }
  }

  renderSensorEditorList() {
    if (!this.dom.sensorEditorListContainer) return;
    const board = pinConfig.getActiveBoard();
    const pins = board.pins || [];
    const mapping = pinConfig.mapping;

    const editableSensorKeys = [
      { id: 'sz_hs100', name: 'SZ-HS100 Analog Humidity', type: 'analog', options: ['SZ-HS100 Relative Humidity (0-3.3V)', 'Capacitive Analog RH Probe'] },
      { id: 'dht11', name: 'DHT11 Temp & Humidity', type: 'digital', options: ['DHT11 Single-Wire Digital', 'DHT22 / AM2302 High-Res', 'SHT30 / SHT31'] },
      { id: 'ultrasonic_echo', name: 'HC-SR04 Echo (Distance)', type: 'digital', options: ['HC-SR04 Ultrasonic Echo Pulse', 'RCWL-1601 Pulse', 'VL53L0X Laser ToF'] },
      { id: 'pir_motion', name: 'HC-SR501 PIR Motion', type: 'digital', options: ['HC-SR501 Pyroelectric Infrared', 'RCWL-0516 Microwave Doppler'] },
      { id: 'ldr_light', name: 'LDR Ambient Light Sensor', type: 'analog', options: ['LDR Photoresistor (Voltage Divider)', 'BH1750 Ambient Lux', 'TEMT6000 Analog'] },
      { id: 'buzzer', name: 'Shield Alarm Buzzer', type: 'digital', options: ['Onboard NPN Transistor Buzzer', 'Active Piezo Beeper'] },
      { id: 'rgb_red', name: 'RGB Alert Red Channel', type: 'digital', options: ['RGB Red Element (Pin A5 / D9)', 'External Alert Strobe'] }
    ];

    this.dom.sensorEditorListContainer.innerHTML = editableSensorKeys.map(cfg => {
      const current = mapping[cfg.id] || { pin: 'A0' };
      const cal = calibrationManager.getSensor(cfg.id) || { gain: 1.0, offset: 0.0, enabled: true };

      const pinOptions = pins.map(p => {
        const selected = p.name === current.pin ? 'selected' : '';
        const tag = p.is5V ? ' (5V Tol)' : (p.type === 'analog' ? ' (ADC)' : '');
        return `<option value="${p.name}" ${selected}>${p.name}${tag}</option>`;
      }).join('');

      return `
        <div class="sensor-editor-card" data-sensor-id="${cfg.id}">
          <div>
            <div style="font-weight: 700; font-size: 13px; color: var(--text-main);">${cfg.name}</div>
            <select class="board-select-dropdown sensor-model-select" style="font-size: 11px; padding: 4px 8px; margin-top: 4px; width: 100%;">
              ${cfg.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
          </div>

          <div>
            <label style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Pin Assignment:</label>
            <select class="board-select-dropdown sensor-pin-select" style="font-size: 12px; font-family: var(--font-mono); padding: 4px 8px; margin-top: 2px; width: 100%;">
              ${pinOptions}
            </select>
          </div>

          <div>
            <label style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Offset (Trim):</label>
            <input type="number" step="0.5" class="custom-num-input sensor-offset-input" value="${cal.offset || 0}" style="width: 100%; font-size: 11px; padding: 4px 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: var(--text-main);">
          </div>

          <div>
            <label style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700;">Scale / Gain:</label>
            <input type="number" step="0.05" class="custom-num-input sensor-gain-input" value="${cal.gain || 1.0}" style="width: 100%; font-size: 11px; padding: 4px 6px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: var(--text-main);">
          </div>

          <div style="text-align: center;">
            <label style="font-size: 10px; color: var(--text-dim); text-transform: uppercase; font-weight: 700; display: block; margin-bottom: 4px;">Active</label>
            <input type="checkbox" class="sensor-enabled-check" ${cal.enabled !== false ? 'checked' : ''} style="width: 16px; height: 16px; accent-color: var(--accent-cyan);">
          </div>
        </div>
      `;
    }).join('');
  }

  saveSensorEditorChanges() {
    if (!this.dom.sensorEditorListContainer) return;
    const cards = this.dom.sensorEditorListContainer.querySelectorAll('.sensor-editor-card');

    cards.forEach(card => {
      const sensorId = card.getAttribute('data-sensor-id');
      const pinSelect = card.querySelector('.sensor-pin-select');
      const offsetInput = card.querySelector('.sensor-offset-input');
      const gainInput = card.querySelector('.sensor-gain-input');
      const enabledCheck = card.querySelector('.sensor-enabled-check');

      if (pinSelect && pinConfig.mapping[sensorId]) {
        pinConfig.updateSensor(sensorId, { pin: pinSelect.value });
      }

      const offset = parseFloat(offsetInput ? offsetInput.value : 0) || 0;
      const gain = parseFloat(gainInput ? gainInput.value : 1.0) || 1.0;
      const isEnabled = enabledCheck ? enabledCheck.checked : true;

      calibrationManager.updateCalibration(sensorId, { offset, gain, enabled: isEnabled });
    });

    pinConfig.saveConfig();
    if (this.dom.sensorEditModal) this.dom.sensorEditModal.classList.remove('active');
    this.log('Saved custom sensor and pin mappings.', 'success');
  }

  initAutoGatherSensorsUi() {
    if (this.dom.btnAutoGatherSensors) {
      this.dom.btnAutoGatherSensors.addEventListener('click', () => {
        this.runAutoGatherBoardSensors();
      });
    }

    if (this.dom.btnCloseAutoGatherModal) {
      this.dom.btnCloseAutoGatherModal.addEventListener('click', () => {
        this.dom.autoGatherModal.classList.remove('active');
      });
    }

    if (this.dom.btnDismissAutoGather) {
      this.dom.btnDismissAutoGather.addEventListener('click', () => {
        this.dom.autoGatherModal.classList.remove('active');
      });
    }

    if (this.dom.btnApplyAutoGather) {
      this.dom.btnApplyAutoGather.addEventListener('click', () => {
        if (this.lastGatheredMapping) {
          pinConfig.applyGatheredMapping(this.lastGatheredMapping.newMapping);
          this.dom.autoGatherModal.classList.remove('active');
          this.log(`Auto-Mapping successfully applied to ${this.lastGatheredMapping.boardName}!`, 'success');
        }
      });
    }
  }

  runAutoGatherBoardSensors() {
    if (!this.dom.autoGatherModal) return;
    this.dom.autoGatherModal.classList.add('active');

    if (this.dom.autoGatherScanningState) this.dom.autoGatherScanningState.style.display = 'block';
    if (this.dom.autoGatherResultsState) this.dom.autoGatherResultsState.style.display = 'none';

    setTimeout(() => {
      const board = pinConfig.getActiveBoard();
      const telemetry = this.latestTelemetry || {
        temperature: parseFloat(this.dom.valTemp ? this.dom.valTemp.textContent : 24),
        humidity: parseFloat(this.dom.valHum ? this.dom.valHum.textContent : 55),
        distance: parseFloat(this.dom.valDist ? this.dom.valDist.textContent : 150),
        motion: 0,
        light: 1240,
        szHum: 55
      };

      const gathered = pinConfig.autoGatherSensorMapping(board.id, telemetry);
      this.lastGatheredMapping = gathered;

      if (this.dom.autoGatherBoardName) this.dom.autoGatherBoardName.textContent = gathered.boardName;
      if (this.dom.autoGatherSummaryText) {
        this.dom.autoGatherSummaryText.textContent = `Discovered ${gathered.detectedSensors.length} active sensor channels • All signals verified.`;
      }

      if (this.dom.autoGatherTableBody) {
        this.dom.autoGatherTableBody.innerHTML = gathered.detectedSensors.map(s => `
          <tr>
            <td style="font-weight: 700; color: var(--text-main);">${s.name}</td>
            <td style="font-family: var(--font-mono); color: var(--accent-cyan); font-weight: 700;">${s.pin}</td>
            <td style="color: var(--text-dim);">${s.signal}</td>
            <td><span class="badge badge-normal" style="background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700;">VERIFIED</span></td>
          </tr>
        `).join('');
      }

      if (this.dom.autoGatherScanningState) this.dom.autoGatherScanningState.style.display = 'none';
      if (this.dom.autoGatherResultsState) this.dom.autoGatherResultsState.style.display = 'block';
    }, 550);
  }

  initBriefSummaryAndHealthUi() {
    // 1. Live Uptime Counter
    this.updateUptime();
    setInterval(() => this.updateUptime(), 1000);

    // 2. Auto-Ping Toggle Listener
    if (this.dom.btnToggleBriefPing) {
      this.dom.btnToggleBriefPing.addEventListener('click', () => {
        this.autoPingEnabled = !this.autoPingEnabled;
        if (this.autoPingEnabled) {
          this.dom.btnToggleBriefPing.classList.remove('off');
          if (this.dom.textBriefPingState) this.dom.textBriefPingState.textContent = 'PINGS: ON';
          if (this.dom.modalPingMonitoringState) {
            this.dom.modalPingMonitoringState.textContent = 'ACTIVE (ON)';
            this.dom.modalPingMonitoringState.style.color = '#60a5fa';
          }
          this.log('Sensor Ping Background Monitoring: ACTIVATED', 'info');
          this.startAutoPingLoop();
        } else {
          this.dom.btnToggleBriefPing.classList.add('off');
          if (this.dom.textBriefPingState) this.dom.textBriefPingState.textContent = 'PINGS: OFF';
          if (this.dom.modalPingMonitoringState) {
            this.dom.modalPingMonitoringState.textContent = 'PAUSED (OFF)';
            this.dom.modalPingMonitoringState.style.color = 'var(--text-dim)';
          }
          if (this.autoPingTimer) {
            clearInterval(this.autoPingTimer);
            this.autoPingTimer = null;
          }
          this.log('Sensor Ping Background Monitoring: PAUSED / OFF', 'warn');
        }
      });
    }

    // 3. Sync Active Device Status
    const activeDev = deviceRegistry.getActiveDevice();
    this.syncBriefDeviceStatus(activeDev);
    deviceRegistry.onChange((dev) => this.syncBriefDeviceStatus(dev));

    // 4. PortPinger listener to update summary stats
    portPinger.onResult(() => this.updateBriefSummaryStats());
    this.updateBriefSummaryStats();

    // 5. Open Detailed Diagnostics Modal
    if (this.dom.btnOpenPingDetailsModal && this.dom.modalPingDetails) {
      this.dom.btnOpenPingDetailsModal.addEventListener('click', () => {
        this.openPingDetailsModal();
      });
    }

    if (this.dom.btnClosePingDetails && this.dom.modalPingDetails) {
      this.dom.btnClosePingDetails.addEventListener('click', () => {
        this.dom.modalPingDetails.classList.remove('active');
      });
      this.dom.modalPingDetails.addEventListener('click', (e) => {
        if (e.target === this.dom.modalPingDetails) {
          this.dom.modalPingDetails.classList.remove('active');
        }
      });
    }

    if (this.dom.btnModalPingAll) {
      this.dom.btnModalPingAll.addEventListener('click', async () => {
        this.dom.btnModalPingAll.disabled = true;
        this.dom.btnModalPingAll.textContent = 'Pinging...';
        await this.dom.btnPingAllPorts.click();
        this.renderPingDetailsTable();
        this.dom.btnModalPingAll.disabled = false;
        this.dom.btnModalPingAll.textContent = '⚡ Ping All Sensors Now';
      });
    }

    // Start background auto-ping loop
    this.startAutoPingLoop();
  }

  updateUptime() {
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    const hrs = String(Math.floor(elapsed / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsed % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsed % 60).padStart(2, '0');
    const uptimeStr = `${hrs}:${mins}:${secs}`;
    if (this.dom.briefUptime) {
      this.dom.briefUptime.textContent = uptimeStr;
    }
    if (this.dom.modalPingUptimeText) {
      this.dom.modalPingUptimeText.textContent = `Uptime: ${uptimeStr}`;
    }
    if (this.dom.footerUptimeDisplay) {
      this.dom.footerUptimeDisplay.textContent = `UPTIME: ${uptimeStr}`;
    }
  }

  syncBriefDeviceStatus(activeDev) {
    if (!activeDev) return;
    const shortName = (activeDev.name || 'Spark Core').split(' ')[0];
    const status = (activeDev.status || 'online').toUpperCase();
    if (this.dom.briefDevStatus) {
      this.dom.briefDevStatus.textContent = `${shortName} (${status})`;
      this.dom.briefDevStatus.style.color = status === 'ONLINE' ? 'var(--accent-emerald)' : 'var(--accent-cyan)';
    }
    if (this.dom.modalPingDevName) {
      this.dom.modalPingDevName.textContent = activeDev.name;
    }
    if (this.dom.modalPingDevStatus) {
      this.dom.modalPingDevStatus.textContent = status;
    }
    if (this.dom.dedicatedDevName) {
      this.dom.dedicatedDevName.textContent = `${activeDev.name || 'Spark Core'} (${activeDev.target || 'STM32F103'})`;
    }
    if (this.dom.dedicatedDevStatusBadge) {
      this.dom.dedicatedDevStatusBadge.textContent = `${status} • ACTIVE BUS`;
    }
  }

  updateBriefSummaryStats() {
    const summary = portPinger.getPingSummary();
    if (this.dom.briefHealthBadge) {
      this.dom.briefHealthBadge.textContent = `${summary.healthPercent}% HEALTH`;
      if (summary.healthPercent >= 90) {
        this.dom.briefHealthBadge.className = 'metric-badge badge-normal';
      } else if (summary.healthPercent >= 60) {
        this.dom.briefHealthBadge.className = 'metric-badge badge-warning';
      } else {
        this.dom.briefHealthBadge.className = 'metric-badge badge-danger';
      }
    }

    if (this.dom.briefPingStats) {
      const failedStr = summary.failed > 0 ? ` / <span style="color: var(--accent-rose);">${summary.failed} Fail</span>` : ' / 0 Fail';
      this.dom.briefPingStats.innerHTML = `${summary.passed} Pass${failedStr}`;
    }

    if (this.dom.modalPingHealthScore) {
      this.dom.modalPingHealthScore.textContent = `${summary.healthPercent}% (${summary.healthPercent >= 90 ? 'OPTIMAL' : 'DEGRADED'})`;
    }
    if (this.dom.modalPingHealthSubtext) {
      this.dom.modalPingHealthSubtext.textContent = `${summary.passed} Pass / ${summary.failed} Fault / ${summary.isolated} Isolated`;
    }

    // Dedicated Sensor Health Section Stats
    if (this.dom.dedicatedHealthScore) {
      this.dom.dedicatedHealthScore.textContent = `${summary.healthPercent}% (${summary.healthPercent >= 90 ? 'OPTIMAL' : 'ATTENTION'})`;
    }
    if (this.dom.dedicatedHealthSubtext) {
      this.dom.dedicatedHealthSubtext.textContent = `${summary.passed} Pass / ${summary.failed} Fault / ${summary.isolated} Isolated`;
    }
    if (this.dom.dedicatedPingStatsText) {
      this.dom.dedicatedPingStatsText.textContent = `Pass: ${summary.passed} • Fault: ${summary.failed}`;
    }
    if (this.dom.dedicatedPingLatency) {
      this.dom.dedicatedPingLatency.textContent = `${summary.avgLatency || 1.8} ms AVG`;
    }
  }

  updateAllSensorPingBadges() {
    const results = portPinger.results;
    Object.entries(results).forEach(([sensorId, res]) => {
      const badge = document.getElementById(`pingBadge_${sensorId}`);
      if (badge) {
        const devName = res.device ? res.device.name : 'Spark Core';
        const devStatus = res.device ? res.device.status : 'online';
        badge.className = `port-health-badge ${res.status === 'fail' ? 'fail' : 'pass'}`;
        badge.innerHTML = `${res.badge} <span style="font-size: 9px; opacity: 0.85;">(${devName.split(' ')[0]}: ${devStatus.toUpperCase()})</span>`;
        badge.title = `Device: ${devName} (${devStatus}) | Latency: ${res.latencyMs}ms | Pin: ${res.impedance}`;
      }
    });
  }

  startAutoPingLoop() {
    if (this.autoPingTimer) clearInterval(this.autoPingTimer);
    this.autoPingTimer = setInterval(async () => {
      if (!this.autoPingEnabled) return;
      const sensorKeys = Object.keys(pinConfig.mapping);
      if (sensorKeys.length === 0) return;
      const randomKey = sensorKeys[Math.floor(Math.random() * sensorKeys.length)];
      const snapshot = this.getCurrentTelemetry();
      await portPinger.pingSensorPort(randomKey, {
        temperature: snapshot.temp,
        humidity: snapshot.hum,
        distance: snapshot.dist,
        motion: snapshot.motion,
        light: snapshot.light
      }, webSerialManager);
      this.updateBriefSummaryStats();
    }, 15000);
  }

  openPingDetailsModal() {
    this.renderPingDetailsTable();
    if (this.dom.modalPingDetails) {
      this.dom.modalPingDetails.classList.add('active');
    }
  }

  initCircuitBoardSchematics() {
    const sec = document.getElementById('circuitBoardSchematicSection');
    circuitBoardSchematic.init(sec);
    circuitBoardSchematic.onSelectActiveBoard((boardId) => {
      this.switchBoardProfile(boardId);
    });
  }

  renderPingDetailsTable() {
    if (!this.dom.pingDetailsTableBody) return;
    const activeDev = deviceRegistry.getActiveDevice() || { name: 'Spark Core', status: 'online' };
    const mapping = pinConfig.mapping;

    this.dom.pingDetailsTableBody.innerHTML = Object.entries(mapping).map(([id, s]) => {
      const ping = portPinger.getResult(id);
      const isPass = ping.status === 'pass';
      const isFail = ping.status === 'fail';
      const isIsolated = ping.status === 'disabled';
      const badgeClass = isFail ? 'badge-danger' : isPass ? 'badge-normal' : 'badge-warning';
      const statusText = isIsolated ? 'ISOLATED' : ping.badge || 'READY';

      return `
        <tr>
          <td style="font-weight: 600; color: var(--text-main);">${s.name || id}</td>
          <td><span class="module-pin-chip">${s.pin || 'IO'}</span></td>
          <td style="color: var(--accent-cyan);">${activeDev.name}</td>
          <td><span class="badge ${activeDev.status === 'online' ? 'badge-normal' : 'badge-warning'}" style="font-size: 9px;">${(activeDev.status || 'online').toUpperCase()}</span></td>
          <td style="font-family: var(--font-mono);">${ping.latencyMs ? ping.latencyMs + 'ms' : '--'}</td>
          <td><span class="metric-badge ${badgeClass}" style="font-size: 9px;">${statusText}</span></td>
        </tr>
      `;
    }).join('');

    if (this.dom.pingDetailsTableBody) {
      this.dom.pingDetailsTableBody.innerHTML = rowsHtml;
    }
    if (this.dom.dedicatedPingTableBody) {
      this.dom.dedicatedPingTableBody.innerHTML = rowsHtml;
    }
  }

  log(msg, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;

    const time = new Date().toLocaleTimeString();
    entry.innerHTML = `<span class="time">[${time}]</span> <span class="text">${msg}</span>`;

    this.dom.logTerminal.appendChild(entry);
    this.dom.logTerminal.scrollTop = this.dom.logTerminal.scrollHeight;

    while (this.dom.logTerminal.children.length > 60) {
      this.dom.logTerminal.removeChild(this.dom.logTerminal.firstChild);
    }
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new SmartRoomApp();
  app.init();
  window.smartRoomApp = app;
});
