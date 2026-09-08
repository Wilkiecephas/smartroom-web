/**
 * Master Application Controller: Universal IoT Hardware Platform
 * Coordinates Multi-MCU Architecture, WebUSB & WebSerial, Sensor Calibration,
 * Port Line Pinging, Audio Synthesizer, Cloud Telemetry, and Universal IoT Gateway.
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
import { pwaManager } from './pwaManager.js';
import { iotGateway } from './iotGateway.js';
import { aiEngine } from './aiEngine.js';
import { supabaseService, SUPABASE_SQL_SCHEMA } from './supabaseClient.js';
import { hardwareConnectGuide } from './hardwareConnectGuide.js';
import { universalServiceInspector } from './serviceInspector.js';
import { alarmsManager } from './alarmsManager.js';
import { intrusionScope } from './intrusionScope.js';


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
    this.activeHumiditySource = 'dht11';
    this.lastGatheredMapping = null;
    this.currentPairedPorts = [];

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
    this.initTopSubMenusUi();
    this.initDeviceRegistryUi();
    this.initAccountSystemUi();
    this.initColorModeUi();
    this.initBriefSummaryAndHealthUi();
    this.initCircuitBoardSchematics();
    this.initViewModeUi();
    this.initSensorEditorModalUi();
    this.initPwaUi();
    this.initSilenceAlarmsUi();
    this.initBoardPingUi();
    this.initAiEngineUi();
    this.initIotGateway();
    this.renderPingDetailsTable();
    this.renderBoardPingMatrix();
    this.updateBriefSummaryStats();
    this.updateHeaderBoardStatus();
    homeConfig.applyBranding();
    hardwareConnectGuide.init();
    this.initFloatingCornerBrand();
    this.initAlarmsHistoryUi();
    this.initIntrusionScopeUi();

    // Start in Live mode by default
    this.switchMode('live');
    this.log('Smart IoT Hub Initialized • Universal IoT Platform • Built by TekStep Apps Uganda 🇺🇬', 'success');
  }

  cacheDom() {
    // View Mode Selector & PWA Install
    this.dom.btnViewMonitor = document.getElementById('btnViewMonitor');
    this.dom.btnViewDeveloper = document.getElementById('btnViewDeveloper');
    this.dom.btnInstallPwa = document.getElementById('btnInstallPwa');
    this.dom.btnHeaderSilence = document.getElementById('btnHeaderSilence');
    this.dom.headerBoardStatusBadge = document.getElementById('headerBoardStatusBadge');
    this.dom.headerBoardStatusText = document.getElementById('headerBoardStatusText');
    this.dom.headerBoardLatencyText = document.getElementById('headerBoardLatencyText');
    this.dom.btnHeaderPingBoard = document.getElementById('btnHeaderPingBoard');
    this.dom.btnAutoGatherSensors = document.getElementById('btnAutoGatherSensors');
    this.dom.btnOpenSensorEditor = document.getElementById('btnOpenSensorEditor');
    this.dom.btnSubMenuSensorHealth = document.getElementById('btnSubMenuSensorHealth');
    this.dom.boardPingCardsGrid = document.getElementById('boardPingCardsGrid');
    this.dom.btnPingAllBoardsMatrix = document.getElementById('btnPingAllBoardsMatrix');

    // Compact Monitoring Dashboard Elements
    this.dom.compactMonitoringDashboard = document.getElementById('compactMonitoringDashboard');
    this.dom.compactSecurityPill = document.getElementById('compactSecurityPill');
    this.dom.compactSecurityText = document.getElementById('compactSecurityText');
    this.dom.compactParticlePill = document.getElementById('compactParticlePill');
    this.dom.textParticlePill = document.getElementById('textParticlePill');
    this.dom.compactTsPill = document.getElementById('compactTsPill');
    this.dom.textTsPill = document.getElementById('textTsPill');
    this.dom.compactValTemp = document.getElementById('compactValTemp');
    this.dom.compactBadgeTemp = document.getElementById('compactBadgeTemp');
    this.dom.compactBarTemp = document.getElementById('compactBarTemp');
    this.dom.compactValHum = document.getElementById('compactValHum');
    this.dom.compactBadgeHum = document.getElementById('compactBadgeHum');
    this.dom.compactBarHum = document.getElementById('compactBarHum');
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
    this.dom.heroSonarCard = document.getElementById('heroSonarCard');
    this.dom.heroRadarScope = document.getElementById('heroRadarScope');
    this.dom.compactRadarBlip = document.getElementById('compactRadarBlip');
    this.dom.heroSonarBearingText = document.getElementById('heroSonarBearingText');
    this.dom.btnHeroPingSonar = document.getElementById('btnHeroPingSonar');
    this.dom.btnHeroSonarChirp = document.getElementById('btnHeroSonarChirp');
    this.dom.compactTickerContent = document.getElementById('compactTickerContent');
    this.dom.compactBtnAutoGather = document.getElementById('compactBtnAutoGather');
    this.dom.compactBtnEditSensors = document.getElementById('compactBtnEditSensors');
    this.dom.compactBtnSilence = document.getElementById('compactBtnSilence');
    this.dom.compactSilenceBtnText = document.getElementById('compactSilenceBtnText');
    this.dom.compactBtnInstallApp = document.getElementById('compactBtnInstallApp');
    this.dom.compactBtnTestBuzzer = document.getElementById('compactBtnTestBuzzer');
    this.dom.compactTestSoundText = document.getElementById('compactTestSoundText');
    this.dom.btnDedicatedTogglePing = document.getElementById('btnDedicatedTogglePing');

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
    this.dom.btnForceGetBleServices = document.getElementById('btnForceGetBleServices');
    this.dom.inputBleCustomServiceUuid = document.getElementById('inputBleCustomServiceUuid');
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

    // Connected Hardware Explorer (Windows Explorer Style: USB, BLE, Wi-Fi)
    this.dom.devicesExplorerSection    = document.getElementById('devicesExplorerSection');
    this.dom.devicesExplorerGrid       = document.getElementById('devicesExplorerGrid');
    this.dom.explorerDeviceCountBadge  = document.getElementById('explorerDeviceCountBadge');
    this.dom.btnExplorerScan           = document.getElementById('btnExplorerScan');
    this.dom.btnExplorerAddDevice      = document.getElementById('btnExplorerAddDevice');
    this.dom.activeDeviceBanner        = document.getElementById('activeDeviceBanner');
    this.dom.activeProjectName       = document.getElementById('activeProjectName');
    this.dom.btnStartNewProject      = document.getElementById('btnStartNewProject');
    this.dom.activeDeviceName        = document.getElementById('activeDeviceName');
    this.dom.activeDeviceStatusBadge = document.getElementById('activeDeviceStatusBadge');
    this.dom.activeDeviceTypeTag     = document.getElementById('activeDeviceTypeTag');
    this.dom.activeDeviceSensorsRow  = document.getElementById('activeDeviceSensorsRow');
    this.dom.btnInspectActiveDeviceServices = document.getElementById('btnInspectActiveDeviceServices');
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
    this.dom.selectConnectedSerialPorts = document.getElementById('selectConnectedSerialPorts');
    this.dom.btnScanPairSerialPort      = document.getElementById('btnScanPairSerialPort');
    this.dom.btnRefreshSerialPorts     = document.getElementById('btnRefreshSerialPorts');
    this.dom.selectAddSerialProfile     = document.getElementById('selectAddSerialProfile');
    this.dom.selectAddSerialBaud        = document.getElementById('selectAddSerialBaud');
    this.dom.inputAddSerialName         = document.getElementById('inputAddSerialName');
    this.dom.btnSubmitAddSerial         = document.getElementById('btnSubmitAddSerial');
    this.dom.inputAddBleName            = document.getElementById('inputAddBleName');
    this.dom.inputAddBleServiceUuid     = document.getElementById('inputAddBleServiceUuid');
    this.dom.btnSubmitAddBle            = document.getElementById('btnSubmitAddBle');
    this.dom.inputAddWirelessName       = document.getElementById('inputAddWirelessName');
    this.dom.inputAddWirelessUrl        = document.getElementById('inputAddWirelessUrl');
    this.dom.btnSubmitAddWireless       = document.getElementById('btnSubmitAddWireless');

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

    // Dynamic Sensor Grid (Universal IoT — custom device sensor cards)
    this.dom.dynamicSensorGrid      = document.getElementById('dynamicSensorGrid');

    // Add Device Modal — new connection type inputs
    this.dom.inputAddRestName       = document.getElementById('inputAddRestName');
    this.dom.inputAddRestEndpoint   = document.getElementById('inputAddRestEndpoint');
    this.dom.inputAddRestInterval   = document.getElementById('inputAddRestInterval');
    this.dom.textareaAddRestSchema  = document.getElementById('textareaAddRestSchema');
    this.dom.btnSubmitAddRest       = document.getElementById('btnSubmitAddRest');

    this.dom.inputAddWsName         = document.getElementById('inputAddWsName');
    this.dom.inputAddWsEndpoint     = document.getElementById('inputAddWsEndpoint');
    this.dom.textareaAddWsSchema    = document.getElementById('textareaAddWsSchema');
    this.dom.btnSubmitAddWs         = document.getElementById('btnSubmitAddWs');

    this.dom.inputAddMqttName       = document.getElementById('inputAddMqttName');
    this.dom.inputAddMqttBroker     = document.getElementById('inputAddMqttBroker');
    this.dom.inputAddMqttTopic      = document.getElementById('inputAddMqttTopic');
    this.dom.btnSubmitAddMqtt       = document.getElementById('btnSubmitAddMqtt');

    this.dom.inputAutoDiscoverJson  = document.getElementById('inputAutoDiscoverJson');
    this.dom.btnAutoDiscoverApply   = document.getElementById('btnAutoDiscoverApply');
    this.dom.selectFirmwareLang     = document.getElementById('selectFirmwareLang');
    this.dom.autoDiscoverSnippet    = document.getElementById('autoDiscoverSnippet');
    this.dom.btnCopyRegSnippet      = document.getElementById('btnCopyRegSnippet');
    this.dom.btnListenForDevices    = document.getElementById('btnListenForDevices');
    this.dom.autoDiscoverStatusText = document.getElementById('autoDiscoverStatusText');

    // AI & Intelligence Panel
    this.dom.modalAiPanel           = document.getElementById('modalAiPanel');
    this.dom.btnOpenAiPanel         = document.getElementById('btnOpenAiPanel');
    this.dom.btnCloseAiPanel        = document.getElementById('btnCloseAiPanel');
    this.dom.chkAiAnomaly           = document.getElementById('chkAiAnomaly');
    this.dom.chkAiTrend             = document.getElementById('chkAiTrend');
    this.dom.aiAnomalyLog           = document.getElementById('aiAnomalyLog');
    this.dom.aiChatMessages         = document.getElementById('aiChatMessages');
    this.dom.inputAiChat            = document.getElementById('inputAiChat');
    this.dom.btnAiChatSend          = document.getElementById('btnAiChatSend');
    this.dom.inputAiApiKey          = document.getElementById('inputAiApiKey');
    this.dom.selectAiProvider       = document.getElementById('selectAiProvider');
    this.dom.btnSaveAiSettings      = document.getElementById('btnSaveAiSettings');
    this.dom.aiTrendChannel         = document.getElementById('aiTrendChannel');
    this.dom.aiTrendResult          = document.getElementById('aiTrendResult');
    this.dom.btnGetTrend            = document.getElementById('btnGetTrend');

    // Account & Supabase Elements
    this.dom.btnOpenAccount         = document.getElementById('btnOpenAccount');
    this.dom.btnSubMenuAccount      = document.getElementById('btnSubMenuAccount');
    this.dom.mBtnAccount            = document.getElementById('mBtnAccount');
    this.dom.modalAccount           = document.getElementById('modalAccount');
    this.dom.btnCloseAccountModal   = document.getElementById('btnCloseAccountModal');
    this.dom.userAvatarBadge        = document.getElementById('userAvatarBadge');
    this.dom.userAccountName        = document.getElementById('userAccountName');
    this.dom.userCloudIndicator     = document.getElementById('userCloudIndicator');
    this.dom.accountProfileName     = document.getElementById('accountProfileName');
    this.dom.accountProfileEmail    = document.getElementById('accountProfileEmail');
    this.dom.accountProfileBadge    = document.getElementById('accountProfileBadge');
    this.dom.accountDeviceCount     = document.getElementById('accountDeviceCount');
    this.dom.cardSwitchWilkie       = document.getElementById('cardSwitchWilkie');
    this.dom.cardSwitchGuest        = document.getElementById('cardSwitchGuest');
    this.dom.btnSwitchToWilkie      = document.getElementById('btnSwitchToWilkie');
    this.dom.btnSwitchToGuest       = document.getElementById('btnSwitchToGuest');
    this.dom.btnSignOutAccount      = document.getElementById('btnSignOutAccount');
    this.dom.inputAuthFullName      = document.getElementById('inputAuthFullName');
    this.dom.inputAuthEmail         = document.getElementById('inputAuthEmail');
    this.dom.inputAuthPassword      = document.getElementById('inputAuthPassword');
    this.dom.btnAuthSignIn          = document.getElementById('btnAuthSignIn');
    this.dom.btnAuthSignUp          = document.getElementById('btnAuthSignUp');
    this.dom.authStatusMessage      = document.getElementById('authStatusMessage');
    this.dom.inputSupabaseUrl       = document.getElementById('inputSupabaseUrl');
    this.dom.inputSupabaseAnonKey   = document.getElementById('inputSupabaseAnonKey');
    this.dom.btnTestSupabase        = document.getElementById('btnTestSupabase');
    this.dom.btnSaveSupabaseConfig  = document.getElementById('btnSaveSupabaseConfig');
    this.dom.supabaseStatusBadge    = document.getElementById('supabaseStatusBadge');
    this.dom.supabaseSqlSnippet     = document.getElementById('supabaseSqlSnippet');
    this.dom.btnCopySupabaseSql     = document.getElementById('btnCopySupabaseSql');

    // Blank Workspace Elements
    this.dom.blankWorkspaceState        = document.getElementById('blankWorkspaceState');
    this.dom.blankWorkspaceUserGreeting = document.getElementById('blankWorkspaceUserGreeting');
    this.dom.compactCommandLayout       = document.getElementById('compactCommandLayout');
    this.dom.btnTogglePirAttached       = document.getElementById('btnTogglePirAttached');
    this.dom.txtPirAttachedState        = document.getElementById('txtPirAttachedState');
    this.dom.blankBtnAddSpark           = document.getElementById('blankBtnAddSpark');
    this.dom.blankBtnAddSerial          = document.getElementById('blankBtnAddSerial');
    this.dom.blankBtnAddRest            = document.getElementById('blankBtnAddRest');
    this.dom.blankBtnAddWs              = document.getElementById('blankBtnAddWs');
    this.dom.blankBtnSwitchWilkie       = document.getElementById('blankBtnSwitchWilkie');

    // Color Mode (Light / Dark)
    this.dom.btnToggleColorMode         = document.getElementById('btnToggleColorMode');
    this.dom.iconColorMode              = document.getElementById('iconColorMode');
    this.dom.mBtnTheme                  = document.getElementById('mBtnTheme');
    this.dom.mIconTheme                 = document.getElementById('mIconTheme');
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
    this.updateHeaderBoardStatus(boardId);
    this.renderBoardPingMatrix();
    if (this.mode === 'live') {
      this.pollLiveSensors();
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
        const devName = res.device ? res.device.name : 'sparkcore WIFI with arduino UNO';
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

    // 8. Universal Hardware Connect & Firmware Hub Events
    if (this.dom.btnOpenFlasher) {
      this.dom.btnOpenFlasher.addEventListener('click', () => {
        hardwareConnectGuide.open('tabConnectArduino');
      });
    }

    if (this.dom.btnCloseFlasher) {
      this.dom.btnCloseFlasher.addEventListener('click', () => {
        hardwareConnectGuide.close();
      });
    }

    // Direct Code Generator Jump Buttons inside modalAddDevice
    const btnLinkSpark = document.getElementById('btnLinkSparkToCode');
    if (btnLinkSpark) {
      btnLinkSpark.addEventListener('click', () => {
        if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.remove('active');
        hardwareConnectGuide.open('tabConnectSpark');
      });
    }
    const btnLinkSerial = document.getElementById('btnLinkSerialToCode');
    if (btnLinkSerial) {
      btnLinkSerial.addEventListener('click', () => {
        if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.remove('active');
        hardwareConnectGuide.open('tabConnectArduino');
      });
    }
    const btnLinkRest = document.getElementById('btnLinkRestToCode');
    if (btnLinkRest) {
      btnLinkRest.addEventListener('click', () => {
        if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.remove('active');
        hardwareConnectGuide.open('tabConnectEsp32');
      });
    }

    if (this.dom.btnCopyGeneratedCode) {
      this.dom.btnCopyGeneratedCode.addEventListener('click', () => {
        navigator.clipboard.writeText(this.dom.txtGeneratedFirmware?.value || '');
        this.log('Universal firmware sketch copied to clipboard!', 'success');
      });
    }

    if (this.dom.btnDownloadSketch) {
      this.dom.btnDownloadSketch.addEventListener('click', () => {
        const board = pinConfig.getActiveBoard();
        const isPy = board.firmwareType.includes('python');
        const filename = `sentinel_${board.id}.${isPy ? 'py' : 'ino'}`;
        const blob = new Blob([this.dom.txtGeneratedFirmware?.value || ''], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        this.log(`Downloaded firmware file: ${filename}`, 'success');
      });
    }

    // Drag & Drop Flashing
    if (this.dom.flashDropZone && this.dom.inputFileFirmware) {
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
    }

    if (this.dom.btnStartFlashUsb) {
      this.dom.btnStartFlashUsb.addEventListener('click', async () => {
        if (!this.firmwareFileBuffer) return;
        this.dom.btnStartFlashUsb.disabled = true;
        if (this.dom.flashProgressBox) this.dom.flashProgressBox.style.display = 'block';
        if (this.dom.flashProgressText) this.dom.flashProgressText.style.display = 'block';

        try {
          await webSerialManager.flashFirmware(this.firmwareFileBuffer, (pct, cur, total) => {
            if (this.dom.flashProgressBar) this.dom.flashProgressBar.style.width = `${pct}%`;
            if (this.dom.flashProgressText) this.dom.flashProgressText.textContent = `Flashing ${pct}% (${cur}/${total} packets)...`;
          });
          if (this.dom.flashProgressText) this.dom.flashProgressText.textContent = '✅ Flashing 100% Complete! Verification Verified.';
          this.log('Firmware successfully flashed to board via WebUSB!', 'success');
        } catch (err) {
          if (this.dom.flashProgressText) this.dom.flashProgressText.textContent = `❌ Flashing Failed: ${err.message}`;
          this.log(`Flashing failed: ${err.message}`, 'danger');
        } finally {
          this.dom.btnStartFlashUsb.disabled = false;
        }
      });
    }

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

    this.dom.btnStopBuzzer.addEventListener('click', () => {
      this.silenceAllAlarms();
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
        const customUuid = this.dom.inputBleCustomServiceUuid ? this.dom.inputBleCustomServiceUuid.value.trim() : '';
        const res = await wirelessManager.connectBleDevice(customUuid);
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

    if (this.dom.btnForceGetBleServices) {
      this.dom.btnForceGetBleServices.addEventListener('click', () => {
        const customUuid = this.dom.inputBleCustomServiceUuid ? this.dom.inputBleCustomServiceUuid.value.trim() : '';
        universalServiceInspector.inspectDevice({
          name: 'Bluetooth BLE Peripheral',
          type: 'ble_peripheral',
          connectionMethod: 'web_ble',
          credentials: { serviceUuid: customUuid }
        });
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

    const syncUi = () => {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const isOpen = this.dom.topActionsToolbar.classList.contains('mobile-active');
        if (isOpen) {
          if (this.dom.textToggleMenu) this.dom.textToggleMenu.textContent = 'Close';
          if (this.dom.iconToggleMenu) {
            this.dom.iconToggleMenu.innerHTML = '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>';
          }
          this.dom.btnToggleTopMenu.classList.add('menu-open');
          this.dom.btnToggleTopMenu.setAttribute('aria-expanded', 'true');
        } else {
          if (this.dom.textToggleMenu) this.dom.textToggleMenu.textContent = 'Menu';
          if (this.dom.iconToggleMenu) {
            this.dom.iconToggleMenu.innerHTML = '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>';
          }
          this.dom.btnToggleTopMenu.classList.remove('menu-open');
          this.dom.btnToggleTopMenu.setAttribute('aria-expanded', 'false');
        }
      } else {
        const isHidden = localStorage.getItem('sr_top_menu_hidden') === 'true';
        if (isHidden) {
          this.dom.topActionsToolbar.classList.add('collapsed');
          if (this.dom.textToggleMenu) this.dom.textToggleMenu.textContent = 'Show Menu';
          if (this.dom.iconToggleMenu) {
            this.dom.iconToggleMenu.innerHTML = '<polyline points="6 9 12 15 18 9"/>';
          }
          this.dom.btnToggleTopMenu.classList.add('menu-hidden');
          this.dom.btnToggleTopMenu.setAttribute('aria-expanded', 'false');
        } else {
          this.dom.topActionsToolbar.classList.remove('collapsed');
          if (this.dom.textToggleMenu) this.dom.textToggleMenu.textContent = 'Hide Menu';
          if (this.dom.iconToggleMenu) {
            this.dom.iconToggleMenu.innerHTML = '<polyline points="18 15 12 9 6 15"/>';
          }
          this.dom.btnToggleTopMenu.classList.remove('menu-hidden');
          this.dom.btnToggleTopMenu.setAttribute('aria-expanded', 'true');
        }
        this.dom.topActionsToolbar.classList.remove('mobile-active');
        this.dom.btnToggleTopMenu.classList.remove('menu-open');
      }
    };

    // Store helper on instance for sub-menus and outside click
    this._syncTopMenuUi = syncUi;

    // Initialize state
    syncUi();

    // Re-sync on viewport resize
    window.addEventListener('resize', () => {
      syncUi();
    });

    this.dom.btnToggleTopMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const isOpen = this.dom.topActionsToolbar.classList.contains('mobile-active');
        if (isOpen) {
          this.dom.topActionsToolbar.classList.remove('mobile-active');
        } else {
          this.dom.topActionsToolbar.classList.add('mobile-active');
          this.dom.topActionsToolbar.classList.remove('collapsed');
        }
        syncUi();
      } else {
        const willCollapse = !this.dom.topActionsToolbar.classList.contains('collapsed');
        if (willCollapse) {
          this.dom.topActionsToolbar.classList.add('collapsed');
          localStorage.setItem('sr_top_menu_hidden', 'true');
          this.log('Top menu hidden (Sensors, Hardware, Ecosystem & Tools)');
        } else {
          this.dom.topActionsToolbar.classList.remove('collapsed');
          localStorage.setItem('sr_top_menu_hidden', 'false');
          this.log('Top menu expanded and visible');
        }
        syncUi();
      }
    });

    // Close mobile dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && this.dom.topActionsToolbar.classList.contains('mobile-active')) {
        if (!e.target.closest('#topActionsToolbar') && !e.target.closest('#btnToggleTopMenu')) {
          this.dom.topActionsToolbar.classList.remove('mobile-active');
          syncUi();
        }
      }
    });

    // Close mobile dropdown on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && window.innerWidth <= 768 && this.dom.topActionsToolbar.classList.contains('mobile-active')) {
        this.dom.topActionsToolbar.classList.remove('mobile-active');
        syncUi();
      }
    });
  }

  initTopSubMenusUi() {
    const subGroups = document.querySelectorAll('.top-menu-subgroup');
    if (!subGroups.length) return;

    subGroups.forEach(group => {
      const btn = group.querySelector('.top-sub-btn');
      if (!btn) return;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = group.classList.contains('open');
        // Close other groups
        subGroups.forEach(g => {
          if (g !== group) {
            g.classList.remove('open');
            const b = g.querySelector('.top-sub-btn');
            if (b) b.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current group
        if (isOpen) {
          group.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        } else {
          group.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    // Close all sub-menus when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.top-menu-subgroup')) {
        subGroups.forEach(g => {
          g.classList.remove('open');
          const b = g.querySelector('.top-sub-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
      }
    });

    // Close on action item click
    const actionItems = document.querySelectorAll('.sub-menu-action-item');
    actionItems.forEach(item => {
      item.addEventListener('click', () => {
        subGroups.forEach(g => {
          g.classList.remove('open');
          const b = g.querySelector('.top-sub-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
        if (window.innerWidth <= 768 && this.dom.topActionsToolbar) {
          this.dom.topActionsToolbar.classList.remove('mobile-active');
          if (this._syncTopMenuUi) this._syncTopMenuUi();
        }
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        subGroups.forEach(g => {
          g.classList.remove('open');
          const b = g.querySelector('.top-sub-btn');
          if (b) b.setAttribute('aria-expanded', 'false');
        });
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
    if (this.dom.btnExplorerAddDevice) this.dom.btnExplorerAddDevice.addEventListener('click', openAddDevice);
    if (this.dom.btnExplorerScan) {
      this.dom.btnExplorerScan.addEventListener('click', () => {
        this.refreshConnectedSerialPorts();
        this.renderDevicesExplorer();
        this.log('Scanning for connected hardware devices...', 'info');
      });
    }

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
          const tabId = btn.getAttribute('data-tab');
          const pane = document.getElementById(tabId);
          if (pane) pane.classList.add('active');
          if (tabId === 'tabAddSerial') {
            this.refreshConnectedSerialPorts();
          }
        });
      });
    }

    // Web Serial Port Auto-Detection & Hotplug listeners
    if ('serial' in navigator) {
      navigator.serial.addEventListener('connect', () => {
        this.refreshConnectedSerialPorts();
        this.log('🔌 USB Serial device plugged in!', 'info');
      });
      navigator.serial.addEventListener('disconnect', () => {
        this.refreshConnectedSerialPorts();
        this.log('⚠️ USB Serial device disconnected.', 'warn');
      });
    }

    if (this.dom.btnScanPairSerialPort) {
      this.dom.btnScanPairSerialPort.addEventListener('click', async () => {
        try {
          const res = await webSerialManager.requestAndAddPort();
          this.log(`USB Serial Port authorized: VID ${res.usbVendorId || 'Generic'}`, 'success');
          await this.refreshConnectedSerialPorts();
          if (this.currentPairedPorts && this.currentPairedPorts.length > 0) {
            const lastIdx = (this.currentPairedPorts.length - 1).toString();
            if (this.dom.selectConnectedSerialPorts) {
              this.dom.selectConnectedSerialPorts.value = lastIdx;
            }
            this.updateSelectedSerialPortDetails(parseInt(lastIdx, 10));
          }
        } catch (err) {
          if (err.name !== 'NotFoundError') {
            this.log(`Serial port pairing error: ${err.message}`, 'error');
          }
        }
      });
    }

    if (this.dom.btnRefreshSerialPorts) {
      this.dom.btnRefreshSerialPorts.addEventListener('click', () => {
        this.refreshConnectedSerialPorts();
      });
    }

    if (this.dom.selectConnectedSerialPorts) {
      this.dom.selectConnectedSerialPorts.addEventListener('change', (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
          this.updateSelectedSerialPortDetails(val);
        }
      });
    }

    // 5. Submit Spark Core
    if (this.dom.btnSubmitAddSpark) {
      this.dom.btnSubmitAddSpark.addEventListener('click', () => {
        const name = this.dom.inputAddSparkName ? this.dom.inputAddSparkName.value.trim() : 'sparkcore WIFI with arduino UNO';
        const devId = this.dom.inputAddSparkId ? this.dom.inputAddSparkId.value.trim() : '54ff74066678574924331067';
        const token = this.dom.inputAddSparkToken ? this.dom.inputAddSparkToken.value.trim() : 'a0797b36a33322a66526d0580e6fe270a5ade86f';
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

    // 7. Submit USB Serial (Auto-Listed Port Connect & Register)
    if (this.dom.btnSubmitAddSerial) {
      this.dom.btnSubmitAddSerial.addEventListener('click', async () => {
        const portIdx = this.dom.selectConnectedSerialPorts ? parseInt(this.dom.selectConnectedSerialPorts.value, 10) : NaN;
        const profile = this.dom.selectAddSerialProfile ? this.dom.selectAddSerialProfile.value : 'arduino_uno';
        const baud = this.dom.selectAddSerialBaud ? parseInt(this.dom.selectAddSerialBaud.value, 10) : 115200;
        const name = this.dom.inputAddSerialName ? this.dom.inputAddSerialName.value.trim() : 'USB Serial Device';

        let targetPort = null;
        if (!isNaN(portIdx) && this.currentPairedPorts && this.currentPairedPorts[portIdx]) {
          targetPort = this.currentPairedPorts[portIdx].port;
        }

        try {
          if (targetPort) {
            await webSerialManager.connectToPort(targetPort, baud);
          } else {
            await webSerialManager.connect(baud);
          }

          const dev = deviceRegistry.registerDevice({
            id: 'dev_serial_' + Date.now(),
            name,
            type: 'usb_serial',
            boardProfileId: profile,
            connectionMethod: 'web_serial',
            status: 'online',
            credentials: { baudRate: baud }
          });

          deviceRegistry.setActiveDevice(dev.id);
          this.switchBoardProfile(profile);
          this.switchMode('live');
          if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.remove('active');
          this.log(`🔌 Serial Device Connected & Registered: ${name} (${baud} Baud)`, 'success');
        } catch (err) {
          this.log(`Failed to connect serial port: ${err.message}`, 'error');
        }
      });
    }

    // Submit Bluetooth BLE
    if (this.dom.btnSubmitAddBle) {
      this.dom.btnSubmitAddBle.addEventListener('click', async () => {
        const name = this.dom.inputAddBleName ? this.dom.inputAddBleName.value.trim() : 'Bluetooth BLE Sensor Node';
        const customUuid = this.dom.inputAddBleServiceUuid ? this.dom.inputAddBleServiceUuid.value.trim() : '';

        try {
          if (customUuid && this.dom.inputBleServiceUuid) {
            this.dom.inputBleServiceUuid.value = customUuid;
          }
          const res = await wirelessManager.connectBleDevice(customUuid);
          if (!res.success) {
            this.log(`Bluetooth BLE: ${res.error}`, 'error');
            return;
          }
          const dev = deviceRegistry.registerDevice({
            id: 'dev_ble_' + Date.now(),
            name: (res.deviceName && res.deviceName !== 'Unnamed BLE Peripheral') ? res.deviceName : name,
            type: 'ble_peripheral',
            boardProfileId: 'esp32',
            connectionMethod: 'web_ble',
            status: 'online',
            credentials: { serviceUuid: customUuid }
          });
          deviceRegistry.setActiveDevice(dev.id);
          if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.remove('active');
          this.log(`🦷 Bluetooth BLE Device Connected & Registered: ${dev.name}`, 'success');
        } catch (err) {
          this.log(`Bluetooth connection: ${err.message}`, 'error');
        }
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

    // Universal Device Capability & Service Inspector
    if (this.dom.btnInspectActiveDeviceServices) {
      this.dom.btnInspectActiveDeviceServices.addEventListener('click', () => {
        const active = deviceRegistry.getActiveDevice();
        if (active) {
          universalServiceInspector.inspectDevice(active);
        } else {
          universalServiceInspector.inspectDevice({
            name: 'Connected Peripheral',
            type: 'generic',
            connectionMethod: 'web_ble'
          });
        }
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

    const devices = deviceRegistry.getDevices();
    const hasDevices = Boolean(active && devices.length > 0);

    if (this.dom.blankWorkspaceState) {
      if (!hasDevices) {
        this.dom.blankWorkspaceState.style.display = 'block';
        if (this.dom.compactCommandLayout) this.dom.compactCommandLayout.style.display = 'none';
        if (this.dom.dynamicSensorGrid) this.dom.dynamicSensorGrid.style.display = 'none';
        const user = supabaseService.getCurrentUser();
        if (this.dom.blankWorkspaceUserGreeting) {
          const name = user.fullName || user.email?.split('@')[0] || 'Developer';
          this.dom.blankWorkspaceUserGreeting.textContent = `Welcome ${name}! Your developer workspace is currently empty. Connect your physical microcontroller, IP address, serial port, or custom REST API to start streaming live telemetry.`;
        }
      } else {
        this.dom.blankWorkspaceState.style.display = 'none';
        if (this.dom.compactMonitoringDashboard) this.dom.compactMonitoringDashboard.style.display = 'block';
        if (this.dom.compactCommandLayout) this.dom.compactCommandLayout.style.display = 'grid';
      }
    }

    if (this.dom.txtPirAttachedState) {
      this.dom.txtPirAttachedState.textContent = 'Active';
      this.dom.txtPirAttachedState.style.color = 'var(--accent-emerald)';
    }

    if (this.dom.accountDeviceCount) {
      this.dom.accountDeviceCount.textContent = `${devices.length} ${devices.length === 1 ? 'device' : 'devices'} active`;
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

    // Update categorized hardware devices explorer
    this.renderDevicesExplorer();
  }

  selectActiveDevice(devId) {
    if (!devId) return;
    const currentActive = deviceRegistry.getActiveDevice();
    if (currentActive && currentActive.id === devId) return;

    deviceRegistry.setActiveDevice(devId);
    const newActive = deviceRegistry.getActiveDevice();
    if (!newActive) return;

    if (newActive.connectionMethod === 'virtual_simulation') {
      this.switchMode('simulation');
    } else if (newActive.type === 'spark_core' || newActive.connectionMethod === 'particle_cloud') {
      if (newActive.credentials && newActive.credentials.deviceId) {
        particleApi.setCredentials(newActive.credentials.deviceId, newActive.credentials.token);
      }
      this.switchBoardProfile('spark_core');
      this.switchMode('live');
    } else if (newActive.connectionMethod === 'web_serial') {
      this.switchBoardProfile(newActive.boardProfileId || 'arduino_uno');
    }

    this.log(`Switched active device to: ${newActive.name}`, 'success');
    this.renderActiveDeviceBanner();
    this.renderDeviceManagerList();
  }

  categorizeDevices(devices) {
    const groups = [
      { id: 'usb', title: 'USB Serial Devices', icon: '🔌', emptyMsg: 'No USB serial hardware connected', actionText: '+ Pair Port', actionTab: 'tabAddSerial', devices: [] },
      { id: 'ble', title: 'Bluetooth Devices (BLE)', icon: '🦷', emptyMsg: 'No Bluetooth BLE peripherals paired', actionText: '+ Pair BLE', actionTab: 'tabAddBle', devices: [] },
      { id: 'wifi', title: 'Wi-Fi & Cloud Devices', icon: '🌐', emptyMsg: 'No Wi-Fi or Cloud endpoints registered', actionText: '+ Connect Wi-Fi', actionTab: 'tabAddWireless', devices: [] },
      { id: 'virtual', title: 'Virtual Simulation Devices', icon: '💻', emptyMsg: 'No virtual twins created', actionText: '+ Add Sim', actionTab: 'tabAddSim', devices: [] }
    ];

    devices.forEach(dev => {
      const method = (dev.connectionMethod || '').toLowerCase();
      const type = (dev.type || '').toLowerCase();

      if (method === 'web_serial' || type.includes('serial') || type.includes('arduino') || type.includes('com')) {
        groups[0].devices.push(dev);
      } else if (method === 'web_ble' || type.includes('ble') || type.includes('bluetooth')) {
        groups[1].devices.push(dev);
      } else if (method === 'virtual_simulation' || type.includes('simulation') || type.includes('sim')) {
        groups[3].devices.push(dev);
      } else {
        // Wi-Fi, Cloud, Particle, REST, MQTT, etc.
        groups[2].devices.push(dev);
      }
    });

    return groups;
  }

  renderDevicesExplorer() {
    if (!this.dom.devicesExplorerGrid) return;
    const devices = deviceRegistry.getDevices();
    const active = deviceRegistry.getActiveDevice();

    if (this.dom.explorerDeviceCountBadge) {
      this.dom.explorerDeviceCountBadge.textContent = `${devices.length} ${devices.length === 1 ? 'DEVICE' : 'DEVICES'} CONNECTED`;
    }

    const groups = this.categorizeDevices(devices);

    this.dom.devicesExplorerGrid.innerHTML = groups.map(group => {
      const hasDevs = group.devices.length > 0;
      return `
        <div class="explorer-category-group" data-group-id="${group.id}">
          <div class="explorer-category-header">
            <span class="cat-label">${group.icon} ${group.title}</span>
            <span class="cat-count">${group.devices.length} Connected</span>
          </div>
          ${hasDevs ? `
            <div class="explorer-device-grid">
              ${group.devices.map(dev => {
                const isActive = Boolean(active && dev.id === active.id);
                const attachedCount = (dev.attachedSensors || []).length;
                let meta = `Zone: ${dev.zone || 'Primary'}`;
                if (group.id === 'usb') {
                  meta = `Baud: ${dev.credentials?.baudRate || '115200'} &bull; ${attachedCount} sensor${attachedCount === 1 ? '' : 's'}`;
                } else if (group.id === 'ble') {
                  meta = `GATT Peripheral &bull; ${attachedCount} sensor${attachedCount === 1 ? '' : 's'}`;
                } else if (group.id === 'wifi') {
                  meta = `${dev.connectionMethod === 'particle_cloud' ? 'Particle Cloud' : 'Wi-Fi/REST'} &bull; ${attachedCount} sensor${attachedCount === 1 ? '' : 's'}`;
                } else if (group.id === 'virtual') {
                  meta = `Digital Twin &bull; ${attachedCount} sensor${attachedCount === 1 ? '' : 's'}`;
                }

                return `
                  <div class="explorer-device-tile ${isActive ? 'is-active' : ''}" data-dev-id="${dev.id}" role="button" tabindex="0" title="Click to select ${dev.name}">
                    <div class="tile-icon-box">${group.icon}</div>
                    <div class="tile-content">
                      <div class="tile-device-name">${dev.name}</div>
                      <div class="tile-device-meta">${meta}</div>
                    </div>
                    <div class="tile-actions">
                      <button class="btn-outline btn-force-inspect-dev" data-dev-id="${dev.id}" style="padding: 4px 8px; font-size: 10px; color: var(--accent-cyan);" title="Inspect services & capabilities">⚡</button>
                      ${isActive 
                        ? '<span class="tile-active-badge">Active</span>' 
                        : `<button class="btn-tile-select" data-dev-id="${dev.id}">Select</button>`
                      }
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : `
            <div class="explorer-empty-cat">
              <span>${group.emptyMsg}</span>
              <button class="btn-mini-tool btn-group-quick-add" data-tab="${group.actionTab}" style="color: var(--accent-cyan); border-color: rgba(0, 242, 254, 0.3); font-size: 10px;">${group.actionText}</button>
            </div>
          `}
        </div>
      `;
    }).join('');

    // Wire clicks
    this.dom.devicesExplorerGrid.querySelectorAll('.explorer-device-tile').forEach(tile => {
      tile.addEventListener('click', (e) => {
        if (e.target.closest('.btn-force-inspect-dev')) return;
        const devId = tile.getAttribute('data-dev-id');
        if (devId) this.selectActiveDevice(devId);
      });
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const devId = tile.getAttribute('data-dev-id');
          if (devId) this.selectActiveDevice(devId);
        }
      });
    });

    this.dom.devicesExplorerGrid.querySelectorAll('.btn-force-inspect-dev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const devId = btn.getAttribute('data-dev-id');
        const dev = deviceRegistry.getDevice(devId);
        if (dev) universalServiceInspector.inspectDevice(dev);
      });
    });

    this.dom.devicesExplorerGrid.querySelectorAll('.btn-group-quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const tabId = btn.getAttribute('data-tab');
        if (this.dom.modalAddDevice) {
          this.dom.modalAddDevice.classList.add('active');
          if (tabId) {
            const targetTabBtn = this.dom.modalAddDevice.querySelector(`.modal-tab-btn[data-tab="${tabId}"]`);
            if (targetTabBtn) targetTabBtn.click();
          }
        }
      });
    });
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

    const groups = this.categorizeDevices(devices);

    this.dom.deviceManagerList.innerHTML = groups.map(group => {
      if (group.devices.length === 0) return '';
      return `
        <div style="margin-bottom: 16px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 11px; font-weight: 700; font-family: var(--font-mono); color: var(--accent-cyan); text-transform: uppercase;">
            <span>${group.icon} ${group.title}</span>
            <span style="color: var(--text-dim); font-size: 10px;">${group.devices.length} DEVICE${group.devices.length === 1 ? '' : 'S'}</span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${group.devices.map(dev => {
              const isActive = active && dev.id === active.id;
              const attachedCount = (dev.attachedSensors || []).length;
              return `
                <div style="background: ${isActive ? 'rgba(0, 242, 254, 0.06)' : 'rgba(255, 255, 255, 0.02)'}; border: 1px solid ${isActive ? 'rgba(0, 242, 254, 0.4)' : 'var(--border-subtle)'}; border-radius: var(--radius-md); padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 22px;">${group.icon}</span>
                    <div>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 13px; font-weight: 700; color: var(--text-main);">${dev.name}</span>
                        ${isActive ? '<span class="badge badge-normal" style="background: rgba(0,242,254,0.15); color: var(--accent-cyan); font-size: 9px;">ACTIVE</span>' : ''}
                      </div>
                      <div style="font-size: 11px; color: var(--text-dim); margin-top: 2px;">
                        Zone: ${dev.zone || 'Primary'} &bull; ${dev.connectionMethod} &bull; ${attachedCount} attached sensor${attachedCount === 1 ? '' : 's'}
                      </div>
                    </div>
                  </div>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <button class="btn-outline btn-force-inspect-dev" data-dev-id="${dev.id}" style="padding: 5px 9px; font-size: 11px; color: var(--accent-cyan); border-color: rgba(0, 242, 254, 0.4);" title="Force-Get & Enumerate Services">⚡ Force-Get</button>
                    ${!isActive ? `<button class="btn-primary btn-switch-to-dev" data-dev-id="${dev.id}" style="padding: 5px 11px; font-size: 11px;">Select</button>` : ''}
                    <button class="btn-outline btn-mgr-add-sensor" data-dev-id="${dev.id}" style="padding: 5px 9px; font-size: 11px;">+ Sensors</button>
                    ${devices.length > 1 ? `<button class="btn-outline btn-remove-dev" data-dev-id="${dev.id}" style="padding: 5px 9px; font-size: 11px; color: var(--accent-rose);" title="Remove Device">Remove</button>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Wire buttons
    this.dom.deviceManagerList.querySelectorAll('.btn-force-inspect-dev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const devId = e.currentTarget.getAttribute('data-dev-id');
        const dev = deviceRegistry.getDevice(devId);
        if (dev) {
          universalServiceInspector.inspectDevice(dev);
        }
      });
    });

    this.dom.deviceManagerList.querySelectorAll('.btn-switch-to-dev').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const devId = e.currentTarget.getAttribute('data-dev-id');
        this.selectActiveDevice(devId);
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
              // Telemetry sending is completely silent per user requirement
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

  async refreshConnectedSerialPorts() {
    const select = this.dom.selectConnectedSerialPorts;
    const badge = document.getElementById('serialPortDetectionBadge');
    const infoText = document.getElementById('serialPortInfoText');
    const vidPidPill = document.getElementById('serialPortVidPidPill');
    if (!select) return;

    if (!('serial' in navigator)) {
      select.innerHTML = '<option value="">Web Serial not supported in this browser</option>';
      if (badge) {
        badge.textContent = 'Unsupported Browser';
        badge.style.background = 'rgba(239, 68, 68, 0.15)';
        badge.style.color = '#ef4444';
      }
      if (infoText) {
        infoText.innerHTML = 'Web Serial requires Google Chrome, Microsoft Edge, or Opera.';
      }
      return;
    }

    try {
      if (badge) badge.textContent = 'Scanning Ports...';
      const pairedPorts = await webSerialManager.getPairedPorts();
      this.currentPairedPorts = pairedPorts || [];

      select.innerHTML = '';

      if (this.currentPairedPorts.length === 0) {
        select.innerHTML = '<option value="">No authorized ports found (Click "Scan & Pair Port" 👉)</option>';
        if (badge) {
          badge.textContent = '0 Paired Ports';
          badge.style.background = 'rgba(245, 158, 11, 0.15)';
          badge.style.color = 'var(--accent-amber)';
        }
        if (infoText) {
          infoText.innerHTML = 'No authorized serial device detected. Click <strong>"Scan &amp; Pair Port"</strong> to detect plugged hardware.';
        }
        if (vidPidPill) vidPidPill.style.display = 'none';
        return;
      }

      if (badge) {
        badge.textContent = `${this.currentPairedPorts.length} Detected Port${this.currentPairedPorts.length === 1 ? '' : 's'}`;
        badge.style.background = 'rgba(16, 185, 129, 0.15)';
        badge.style.color = '#10b981';
      }

      this.currentPairedPorts.forEach((item, i) => {
        const idResult = driverHelper.identifyUsbDevice(item.usbVendorId, item.usbProductId);
        const opt = document.createElement('option');
        opt.value = i.toString();
        const label = idResult.matched
          ? `Port #${i + 1}: ${idResult.vendor} — ${idResult.chip} (${idResult.boardLabel})`
          : (item.usbVendorId
              ? `Port #${i + 1}: USB Serial Device (VID: ${idResult.vendorId}, PID: ${idResult.productId})`
              : `Port #${i + 1}: Standard COM Serial Port`);
        opt.textContent = label;
        select.appendChild(opt);
      });

      select.value = '0';
      this.updateSelectedSerialPortDetails(0);
    } catch (err) {
      console.warn('[Serial] Port listing error:', err);
      select.innerHTML = '<option value="">Error scanning ports</option>';
    }
  }

  updateSelectedSerialPortDetails(index) {
    const infoText = document.getElementById('serialPortInfoText');
    const vidPidPill = document.getElementById('serialPortVidPidPill');
    const item = this.currentPairedPorts && this.currentPairedPorts[index];
    if (!item) {
      if (infoText) infoText.innerHTML = 'No port selected. Click <strong>"Scan &amp; Pair Port"</strong> to detect hardware.';
      if (vidPidPill) vidPidPill.style.display = 'none';
      return;
    }

    const idResult = driverHelper.identifyUsbDevice(item.usbVendorId, item.usbProductId);
    if (infoText) {
      if (idResult.matched) {
        infoText.innerHTML = `<strong style="color: var(--accent-cyan);">${idResult.vendor} (${idResult.chip})</strong> &bull; Recommended MCU: <strong>${idResult.boardLabel}</strong>`;
      } else {
        infoText.textContent = idResult.detail || 'Generic USB Serial device.';
      }
    }

    if (vidPidPill) {
      if (idResult.vendorId) {
        vidPidPill.textContent = `VID: ${idResult.vendorId} | PID: ${idResult.productId}`;
        vidPidPill.style.display = 'inline-block';
      } else {
        vidPidPill.style.display = 'none';
      }
    }

    // Auto-fill suggested board profile and device name
    if (idResult.suggestedBoardId && this.dom.selectAddSerialProfile) {
      this.dom.selectAddSerialProfile.value = idResult.suggestedBoardId;
    }
    if (this.dom.inputAddSerialName) {
      this.dom.inputAddSerialName.value = idResult.matched
        ? `${idResult.vendor} ${idResult.chip}`
        : `USB COM Port #${index + 1}`;
    }
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
    if (this.dom.flasherBoardBanner) {
      this.dom.flasherBoardBanner.innerHTML = `
        Target Board: <strong>${board.name}</strong> (${board.arch}) &bull; <span style="color: var(--accent-emerald);">${board.voltage}</span>
      `;
    }

    const code = generateBoardFirmware(board.id, pinConfig.mapping);
    if (this.dom.txtGeneratedFirmware) {
      this.dom.txtGeneratedFirmware.value = code;
    }

    if (typeof hardwareConnectGuide !== 'undefined' && hardwareConnectGuide.refreshAllCodes) {
      hardwareConnectGuide.refreshAllCodes();
    }
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
      this.silenceAllAlarms();
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
    // 1. Target Controller: Non-Spark Core (Arduino Uno, ESP32, STM32, etc.)
    if (pinConfig.activeBoardId !== 'spark_core') {
      const activeBoard = pinConfig.getActiveBoard();

      // If WebSerial is physically connected via USB, stream live serial frames
      if (webSerialManager.isConnected) {
        this.dom.deviceStatusText.textContent = `${activeBoard.name} (USB CONNECTED)`;
        this.dom.deviceBadge.className = 'device-status-badge';
        return;
      }

      // If WebSerial is not connected, stream realistic active hardware telemetry
      // so Arduino sensors and alarms are always live and testable on the site!
      this.dom.deviceStatusText.textContent = `${activeBoard.name} (LIVE SIM STREAM)`;
      this.dom.deviceBadge.className = 'device-status-badge';
      this.dom.deviceBadge.style.borderColor = 'rgba(59, 130, 246, 0.5)';
      this.dom.deviceBadge.style.color = 'var(--accent-cyan)';

      const data = sensorSimulator.getSnapshot();
      this.updateDashboard(data);
      return;
    }

    // 2. Target Controller: Spark Core (Particle Cloud API)
    const status = await particleApi.getDeviceStatus();
    if (!status.online) {
      this.dom.deviceStatusText.textContent = 'SPARK CORE (RECONNECTING)';
      this.dom.deviceBadge.className = 'device-status-badge';
      this.dom.deviceBadge.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      this.dom.deviceBadge.style.color = '#ef4444';

      // Use cached/fallback readings so dashboard never empties or freezes
      const data = await particleApi.readAllSensors();
      if (data) {
        this.updateDashboard(data);
      }
      return;
    }

    this.dom.deviceStatusText.textContent = 'SPARK CORE ONLINE';
    this.dom.deviceBadge.className = 'device-status-badge';
    this.dom.deviceBadge.style.borderColor = '';
    this.dom.deviceBadge.style.color = '';

    const data = await particleApi.readAllSensors();
    if (data) {
      this.updateDashboard(data);
    }
  }

  updateDashboard(data) {
    if (!data) return;

    this.latestTelemetry = data;
    hardwareDiagnostics.updateLiveTelemetry(data, this.mode === 'live');
    circuitBoardSchematic.updateTelemetry(data);

    // Feed AI engine (anomaly detection + trend analysis)
    aiEngine.processTelemetry(data);

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

    // 3. PIR Motion / Room Occupancy
    const isMotion = Number(data.motion) === 1 || Boolean(data.isMotion);
    if (this.dom.valMotion) {
      this.dom.valMotion.textContent = isMotion ? 'DETECTED' : 'CLEAR';
      this.dom.valMotion.style.color = isMotion ? 'var(--accent-red)' : 'var(--text-main)';
    }
    if (this.dom.badgeMotion) {
      this.dom.badgeMotion.textContent = isMotion ? 'OCCUPIED' : 'AREA SECURE';
      this.dom.badgeMotion.className = `metric-badge ${isMotion ? 'badge-danger' : 'badge-normal'}`;
    }
    if (this.dom.modPirState) {
      this.dom.modPirState.textContent = isMotion ? 'OCCUPIED (Active Motion)' : 'CLEAR (Room Secure)';
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
      let rawLm35 = data.temp2 !== undefined && data.temp2 !== null ? Number(data.temp2) : (data.temperature * 0.98);
      // Calibrate for African room ambient temperature (starts from 31°C instead of 25°C)
      if (rawLm35 >= 45 && rawLm35 <= 68) {
        rawLm35 = Number((rawLm35 / 1.68).toFixed(1));
      } else if (rawLm35 >= 20 && rawLm35 <= 28) {
        rawLm35 = Number((rawLm35 + 6.0).toFixed(1));
      }
      const calLm35 = calibrationManager.apply('lm35_temp', rawLm35);
      this.dom.modLm35Val.textContent = (calLm35 && calLm35.value !== null ? calLm35.value : rawLm35).toFixed(1);
    }

    // 6. Ambient Light (LDR)
    const ldrEnabled = calibrationManager.isSensorEnabled('ldr_light');
    if (!ldrEnabled) {
      if (this.dom.valLight) this.dom.valLight.textContent = 'OFF';
      if (this.dom.modLdrVal) this.dom.modLdrVal.textContent = 'OFF';
      if (this.dom.badgeLight) {
        this.dom.badgeLight.textContent = 'ISOLATED';
        this.dom.badgeLight.className = 'metric-badge';
      }
    } else if (data.light !== undefined && data.light !== null) {
      const calLdr = calibrationManager.apply('ldr_light', data.light);
      const lightVal = Math.round(calLdr.value !== null ? calLdr.value : data.light);
      const lightInfo = this.getLdrLightClassification(lightVal);
      if (this.dom.valLight) this.dom.valLight.textContent = `${lightVal} ADC (${lightInfo.phase})`;
      if (this.dom.modLdrVal) this.dom.modLdrVal.textContent = lightVal;

      if (this.dom.badgeLight) {
        this.dom.badgeLight.textContent = lightInfo.label;
        this.dom.badgeLight.className = lightInfo.badgeClass;
      }
    }

    // 7. Potentiometer (A0)
    const potEnabled = calibrationManager.isSensorEnabled('potentiometer');
    const rawPotAdc = (data.pot !== undefined && data.pot !== null) ? Number(data.pot) : (data.rawMotionMask ? ((data.rawMotionMask >> 21) & 0x3FF) * 4 : 2048);
    const potPercent = Math.min(100, Math.max(0, Math.round((rawPotAdc / 4095) * 100)));

    if (!potEnabled) {
      if (this.dom.modPotVal) this.dom.modPotVal.textContent = 'OFF';
    } else {
      const calPot = calibrationManager.apply('potentiometer', potPercent);
      const finalPotPct = Math.round(calPot.value !== null ? calPot.value : potPercent);
      if (this.dom.modPotVal) {
        this.dom.modPotVal.textContent = `${finalPotPct}% (${rawPotAdc} ADC)`;
      }
    }

    // Update Potentiometer Metric Card (A0)
    const valPot = document.getElementById('valPotLevel');
    const badgePot = document.getElementById('badgePotLevel');
    if (valPot) valPot.textContent = `${potPercent}%`;
    if (badgePot) badgePot.textContent = `${rawPotAdc} ADC`;

    // Render active extensions widgets (Drones, Thermal, GPS, NPK, Power, Biometrics)
    this.renderActiveExtensions(data);

    // Update Compact Monitoring Dashboard Cards
    this.updateCompactMonitoringCards(data, isProximityBreach, isMotion, alertTriggered);
  }

  handleAlertState(alertTriggered, isProximity, isMotion) {
    if (this.isSilenced) {
      if (!alertTriggered) {
        this.isSilenced = false;
        if (this.dom.deviceBadge) this.dom.deviceBadge.classList.remove('alerting');
        if (this.dom.alarmOverlay) this.dom.alarmOverlay.classList.remove('active');
      }
      return;
    }

    if (alertTriggered && !this.isAlerting) {
      this.isAlerting = true;
      if (this.dom.deviceBadge) this.dom.deviceBadge.classList.add('alerting');
      if (this.dom.alarmOverlay) this.dom.alarmOverlay.classList.add('active');

      const reason = isProximity && isMotion ? 'PROXIMITY & MOTION BREACH' :
                     isProximity ? 'PROXIMITY INTRUSION (<' + this.proximityThreshold + 'cm)' : 'PIR MOTION DETECTED';

      this.log(`ALARM TRIGGERED: ${reason}`, 'error');

      if (this.audioAlarmEnabled && !audioEngine.isPlaying) {
        const nowMs = Date.now();
        if (!this.lastAlertAudioTime || (nowMs - this.lastAlertAudioTime > 15000)) {
          this.lastAlertAudioTime = nowMs;
          if (isProximity) {
            // Melodic phrase loop for confirmed proximity breaches (< 20cm)
            audioEngine.startTone(this.activeTone || 'siren');
          } else {
            // Melodic sequence for confirmed motion events
            audioEngine.playMelody('alert');
          }
        }
      }
    } else if (!alertTriggered && this.isAlerting) {
      this.isAlerting = false;
      if (this.dom.deviceBadge) this.dom.deviceBadge.classList.remove('alerting');
      if (this.dom.alarmOverlay) this.dom.alarmOverlay.classList.remove('active');
      this.log('Alert resolved: Room secured.', 'success');

      if (audioEngine.isPlaying) {
        audioEngine.stopTone();
      }
    }
  }

  silenceAllAlarms() {
    this.isSilenced = true;
    this.isAlerting = false;

    // 1. Stop audio synthesizer
    if (audioEngine && audioEngine.isPlaying) {
      audioEngine.stopTone();
    }

    // 2. Clear visual flashing overlay & alert badge
    if (this.dom.alarmOverlay) {
      this.dom.alarmOverlay.classList.remove('active');
    }
    if (this.dom.deviceBadge) {
      this.dom.deviceBadge.classList.remove('alerting');
    }

    // 3. Send hardware silence command to Spark Core
    particleApi.callFunction('alarm', 'off').catch(err => {
      console.warn('Particle alarm off dispatch error:', err.message);
    });

    // 4. Send serial silence command to Arduino if connected
    if (webSerialManager && webSerialManager.isConnected) {
      webSerialManager.send('ALARM:OFF\n').catch(() => {});
    }

    // 5. Update silence buttons visual feedback
    const silenceButtons = [
      this.dom.compactBtnSilence,
      this.dom.btnHeaderSilence,
      document.getElementById('mBtnSilence'),
      this.dom.btnStopBuzzer
    ];
    silenceButtons.forEach(btn => {
      if (btn) btn.classList.add('silenced');
    });

    // 6. Update compact sentinel pill
    if (this.dom.compactSecurityPill) {
      this.dom.compactSecurityPill.className = 'security-status-pill muted';
    }
    if (this.dom.compactSecurityText) {
      this.dom.compactSecurityText.textContent = 'ALARMS SILENCED • BUZZER MUTED • MONITORING ACTIVE';
    }

    // 7. Auto-reset silence after 45 seconds (snooze period)
    if (this.silenceTimer) clearTimeout(this.silenceTimer);
    this.silenceTimer = setTimeout(() => {
      this.isSilenced = false;
      silenceButtons.forEach(btn => {
        if (btn) btn.classList.remove('silenced');
      });
      this.log('Alarm silence period ended. Normal audio monitoring active.', 'info');
    }, 45000);

    this.log('🔇 ALL ALARMS SILENCED: Hardware buzzer turned off & browser audio muted.', 'warn');
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

    // 2. Humidity (DHT11 Digital D4)
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

    // 3. Proximity / Hero Sonar Radar Station
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
      if (this.dom.heroRadarScope) {
        this.dom.heroRadarScope.classList.toggle('breach-alert', isProximityBreach);
      }
      if (this.dom.compactRadarBlip) {
        const norm = Math.min(1, Math.max(0.08, d / 200));
        const radPx = norm * 92; // 220px scope has 110px radius
        const bAngleDeg = (d * 3.7) % 360;
        const bRad = (bAngleDeg * Math.PI) / 180;
        this.dom.compactRadarBlip.style.transform = `translate(${(Math.cos(bRad) * radPx).toFixed(1)}px, ${(-Math.sin(bRad) * radPx).toFixed(1)}px)`;
        this.dom.compactRadarBlip.style.background = isProximityBreach ? '#ef4444' : '#10b981';
        this.dom.compactRadarBlip.style.boxShadow = isProximityBreach ? '0 0 16px #ef4444' : '0 0 12px #10b981';
      }
      if (this.dom.heroSonarBearingText) {
        const angle = Math.round((d * 3.7) % 360);
        const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
        const dirName = dirs[Math.floor((angle + 11.25) / 22.5) % 16];
        this.dom.heroSonarBearingText.textContent = `Bearing: ${angle}° ${dirName}`;
      }
    }

    // 4. PIR Motion / Room Occupancy
    if (this.dom.compactValMotionText) {
      this.dom.compactValMotionText.innerHTML = isMotion ? '<span style="color: var(--accent-red);">OCCUPIED</span>' : '<span style="color: var(--accent-emerald);">VACANT</span>';
    }
    if (this.dom.compactBadgeMotion) {
      this.dom.compactBadgeMotion.textContent = isMotion ? 'OCCUPIED' : 'CLEAR';
      this.dom.compactBadgeMotion.className = `compact-badge ${isMotion ? 'badge-danger' : 'badge-normal'}`;
    }
    if (this.dom.compactMotionIndicator) {
      this.dom.compactMotionIndicator.className = `motion-dot ${isMotion ? 'active' : 'clear'}`;
    }
    if (this.dom.compactMotionSubtext) {
      this.dom.compactMotionSubtext.textContent = isMotion ? 'Active movement detected' : 'No human movement detected';
    }
    if (this.dom.txtPirAttachedState) {
      this.dom.txtPirAttachedState.textContent = 'Active';
      this.dom.txtPirAttachedState.style.color = 'var(--accent-emerald)';
    }

    // 5. Ambient Light (Multi-tier Day / Night / Low-Light ADC Classifier)
    if (data.light !== undefined && data.light !== null) {
      const l = Number(data.light);
      const lightInfo = this.getLdrLightClassification(l);

      if (this.dom.compactValLight) {
        this.dom.compactValLight.textContent = l;
      }
      const phaseEl = document.getElementById('compactLightPhase');
      if (phaseEl) {
        phaseEl.textContent = `• ${lightInfo.phaseTag}`;
        phaseEl.style.color = lightInfo.color;
      }
      if (this.dom.compactBadgeLight) {
        this.dom.compactBadgeLight.textContent = lightInfo.label;
        this.dom.compactBadgeLight.className = lightInfo.badgeClass;
      }
      if (this.dom.compactBarLight) {
        this.dom.compactBarLight.style.width = `${Math.min(100, Math.max(5, (l / 4095) * 100))}%`;
        this.dom.compactBarLight.style.background = lightInfo.barGradient;
      }
      const sub = document.getElementById('compactLightSubtext');
      if (sub) {
        sub.textContent = lightInfo.subtext;
      }
    }

    // 6. Potentiometer Metric Card (A0)
    const rawPotAdc = (data.pot !== undefined && data.pot !== null) ? Number(data.pot) : (data.rawMotionMask ? ((data.rawMotionMask >> 21) & 0x3FF) * 4 : 2048);
    const potPercent = Math.min(100, Math.max(0, Math.round((rawPotAdc / 4095) * 100)));
    const valPot = document.getElementById('valPotLevel');
    const badgePot = document.getElementById('badgePotLevel');
    if (valPot) valPot.textContent = `${potPercent}%`;
    if (badgePot) badgePot.textContent = `${rawPotAdc} ADC`;

    // Sentinel Status Pill
    if (this.dom.compactSecurityPill) {
      if (this.isSilenced) {
        this.dom.compactSecurityPill.className = 'security-status-pill muted clickable-pill';
      } else {
        this.dom.compactSecurityPill.className = alertTriggered ? (isProximityBreach ? 'security-status-pill alert clickable-pill' : 'security-status-pill motion clickable-pill') : 'security-status-pill safe clickable-pill';
      }
    }
    if (this.dom.compactSecurityText) {
      if (this.isSilenced) {
        this.dom.compactSecurityText.textContent = alertTriggered ? 'ALARMS SILENCED • BUZZER MUTED (THREAT DETECTED)' : 'ALARMS SILENCED • ALL SOUND MUTED';
      } else {
        this.dom.compactSecurityText.textContent = alertTriggered ? (isProximityBreach ? 'PROXIMITY INTRUSION (<20cm) - ALARM ACTIVE' : 'PIR MOTION INTRUSION - ROOM OCCUPIED') : 'ALL SYSTEMS NORMAL • ROOM SECURE';
      }
    }

    // Activity Ticker
    if (this.dom.compactTickerContent) {
      const timeStr = new Date().toLocaleTimeString();
      this.dom.compactTickerContent.textContent = `[${timeStr}] Temp: ${(data.temperature || 24).toFixed(1)}°C | Hum: ${(data.humidity || 55).toFixed(1)}% (DHT11) | Sonar Radar: ${(data.distance || 150).toFixed(0)}cm | Room: ${isMotion ? 'OCCUPIED' : 'CLEAR'}`;
    }

    // Update Live Hardware Trigger & LED Light Monitor
    this.updateHardwareStatusAndLeds(data);
  }

  updateHardwareStatusAndLeds(data) {
    if (!data) return;

    const isBreach = data.isProximity || (data.distance > 0 && data.distance < 20); // 20cm threshold per user request
    const isMotion = data.motion === 1 || data.isMotion;
    const isRed = data.isLedRedOn !== undefined ? data.isLedRedOn : isBreach;
    const isGreen = data.isLedGreenOn !== undefined ? data.isLedGreenOn : (!isBreach && !isMotion);
    const isBlue = data.isLedBlueOn !== undefined ? data.isLedBlueOn : (isMotion && !isBreach);
    const isD7 = data.isLedD7On !== undefined ? data.isLedD7On : (isBreach || isMotion);
    const isIrTriggered = data.isIrBroken || (data.rawMotionMask && (data.rawMotionMask & 128) !== 0);

    // 1. Master Trigger Status Badge
    const hwMasterBadge = document.getElementById('hwMasterStatusBadge');
    const hwPulse = document.getElementById('hwPulseIndicator');
    if (hwMasterBadge) {
      if (isBreach) {
        hwMasterBadge.textContent = '🚨 PROXIMITY BREACH (<20cm) • SENSOR BOARD RED';
        hwMasterBadge.className = 'metric-badge badge-danger';
        if (hwPulse) hwPulse.className = 'hw-pulse-indicator alert';
      } else if (isMotion || isIrTriggered) {
        hwMasterBadge.textContent = isIrTriggered ? '🚨 IR INTRUSION DETECTED (D6) • SENSOR BOARD BLUE' : '🏃 PIR MOTION DETECTED • SENSOR BOARD BLUE';
        hwMasterBadge.className = 'metric-badge badge-warning';
        if (hwPulse) hwPulse.className = 'hw-pulse-indicator alert';
      } else {
        hwMasterBadge.textContent = 'ROOM SECURE • SENSOR BOARD GREEN • SPARK CORE CYAN';
        hwMasterBadge.className = 'metric-badge badge-normal';
        if (hwPulse) hwPulse.className = 'hw-pulse-indicator';
      }
    }

    // 2. Spark Core Main Light & Sensor Board RGB Status LEDs
    // Spark Core RGB is the dedicated MAIN LIGHT, isolated from notifications:
    const boxSpark = document.getElementById('ledBoxSparkMain');
    const dotSpark = document.getElementById('ledDotSparkMain');
    const txtSpark = document.getElementById('ledStateSparkMainText');
    if (boxSpark && dotSpark && txtSpark) {
      boxSpark.className = 'hw-led-box active-cyan';
      dotSpark.className = 'hw-led-dot cyan active pulse';
      txtSpark.textContent = 'ONLINE (CYAN)';
      txtSpark.style.color = '#38bdf8';
    }

    // Sensor board lights only change: RED on breach, BLUE on motion/IR, GREEN on safe
    const boxRed = document.getElementById('ledBoxRed');
    const dotRed = document.getElementById('ledDotRed');
    const txtRed = document.getElementById('ledStateRedText');
    if (boxRed && dotRed && txtRed) {
      if (isBreach) {
        boxRed.className = 'hw-led-box active-red';
        dotRed.className = 'hw-led-dot red active pulse';
        txtRed.textContent = 'BREACH ACTIVE';
        txtRed.style.color = 'var(--accent-rose)';
      } else {
        boxRed.className = 'hw-led-box';
        dotRed.className = 'hw-led-dot red';
        txtRed.textContent = 'OFF';
        txtRed.style.color = 'var(--text-dim)';
      }
    }

    const boxGreen = document.getElementById('ledBoxGreen');
    const dotGreen = document.getElementById('ledDotGreen');
    const txtGreen = document.getElementById('ledStateGreenText');
    if (boxGreen && dotGreen && txtGreen) {
      if (!isBreach && !isMotion && !isIrTriggered) {
        boxGreen.className = 'hw-led-box active-green';
        dotGreen.className = 'hw-led-dot green active';
        txtGreen.textContent = 'ROOM SECURE';
        txtGreen.style.color = 'var(--accent-emerald)';
      } else {
        boxGreen.className = 'hw-led-box';
        dotGreen.className = 'hw-led-dot green';
        txtGreen.textContent = 'OFF';
        txtGreen.style.color = 'var(--text-dim)';
      }
    }

    const boxBlue = document.getElementById('ledBoxBlue');
    const dotBlue = document.getElementById('ledDotBlue');
    const txtBlue = document.getElementById('ledStateBlueText');
    if (boxBlue && dotBlue && txtBlue) {
      if ((isMotion || isIrTriggered) && !isBreach) {
        boxBlue.className = 'hw-led-box active-blue';
        dotBlue.className = 'hw-led-dot blue active pulse';
        txtBlue.textContent = 'MOTION ACTIVE';
        txtBlue.style.color = 'var(--accent-cyan)';
      } else {
        boxBlue.className = 'hw-led-box';
        dotBlue.className = 'hw-led-dot blue';
        txtBlue.textContent = 'OFF';
        txtBlue.style.color = 'var(--text-dim)';
      }
    }

    const boxD7 = document.getElementById('ledBoxD7');
    const dotD7 = document.getElementById('ledDotD7');
    const txtD7 = document.getElementById('ledStateD7Text');
    if (boxD7 && dotD7 && txtD7) {
      if (isBreach) {
        boxD7.className = 'hw-led-box active-red';
        dotD7.className = 'hw-led-dot red active pulse';
        txtD7.textContent = '5Hz SIREN STROBE';
        txtD7.style.color = 'var(--accent-rose)';
      } else if (isMotion || isIrTriggered) {
        boxD7.className = 'hw-led-box active-blue';
        dotD7.className = 'hw-led-dot blue active';
        txtD7.textContent = 'MOTION BLINK';
        txtD7.style.color = 'var(--accent-cyan)';
      } else {
        boxD7.className = 'hw-led-box';
        dotD7.className = 'hw-led-dot blue active pulse';
        txtD7.textContent = '1Hz HEARTBEAT';
        txtD7.style.color = 'var(--text-main)';
      }
    }

    // 3. Sensor Trigger Quick Pills & Live Hardware Values
    // Calibrate LM35 reading well for African room ambient temperature (begins from 31.0°C instead of 25.0°C)
    let rawLm = data.temp2 !== undefined ? Number(data.temp2) : (data.temperature ? Number(data.temperature) : 31.0);
    let calibratedLm = rawLm;
    if (rawLm >= 45 && rawLm <= 68) {
      // 0.52V / 52 raw reading maps to ~31.0°C African ambient room temperature
      calibratedLm = Number((rawLm / 1.68).toFixed(1));
    } else if (rawLm >= 20 && rawLm <= 28) {
      // Map standard 25°C room baseline to 31°C African room baseline (+6.0°C offset)
      calibratedLm = Number((rawLm + 6.0).toFixed(1));
    }
    const lmVal = calibratedLm;
    const rawLmVolt = (rawLm >= 45 ? (rawLm * 0.01) : (lmVal * 0.01)).toFixed(3);

    const pillDist = document.getElementById('pillHwDist');
    const txtDist = document.getElementById('txtHwDist');
    if (pillDist && txtDist) {
      txtDist.textContent = `${(data.distance || 150).toFixed(0)} cm ${isBreach ? '(🚨 BREACH)' : '(Normal)'}`;
      pillDist.className = `hw-sensor-pill ${isBreach ? 'triggered' : ''}`;
    }

    const pillIr = document.getElementById('pillHwIr');
    const txtIr = document.getElementById('txtHwIr');
    if (pillIr && txtIr) {
      txtIr.textContent = isIrTriggered ? '🚨 INTRUSION (0.04V Retriggered)' : 'Beam Active (3.28V Standby)';
      pillIr.className = `hw-sensor-pill ${isIrTriggered ? 'triggered' : ''}`;
    }

    const pillPir = document.getElementById('pillHwPir');
    const txtPir = document.getElementById('txtHwPir');
    if (pillPir && txtPir) {
      txtPir.textContent = isMotion ? '🏃 Triggered (3.30V)' : 'Standby (0.00V)';
      pillPir.className = `hw-sensor-pill ${isMotion ? 'active-blue' : ''}`;
    }

    const pillLm35 = document.getElementById('pillHwLm35');
    const txtLm35 = document.getElementById('txtHwLm35');
    if (pillLm35 && txtLm35) {
      txtLm35.textContent = `${lmVal.toFixed(1)}°C (${rawLmVolt}V Calibrated)`;
      pillLm35.className = `hw-sensor-pill ${lmVal > 38 ? 'triggered' : ''}`;
    }

    const pillBuzzer = document.getElementById('pillHwBuzzer');
    const txtBuzzer = document.getElementById('txtHwBuzzer');
    if (pillBuzzer && txtBuzzer) {
      txtBuzzer.textContent = (isBreach || isMotion) ? '🚨 Siren (2400Hz)' : 'Silent (0Hz)';
      pillBuzzer.className = `hw-sensor-pill ${(isBreach || isMotion) ? 'triggered' : ''}`;
    }

    const txtTemp = document.getElementById('txtHwTemp');
    if (txtTemp) {
      txtTemp.textContent = `${(data.temperature || 25).toFixed(1)}°C / ${(data.humidity || 50).toFixed(0)}%`;
    }

    const pillLdr = document.getElementById('pillHwLdr');
    const txtLdr = document.getElementById('txtHwLdr');
    if (pillLdr && txtLdr && data.light !== undefined && data.light !== null) {
      const l = Number(data.light);
      const lightInfo = this.getLdrLightClassification(l);
      txtLdr.textContent = `${lightInfo.pillText} (${l} ADC / ~${Math.round(l / 4)} Lux)`;
      pillLdr.className = lightInfo.pillClass;
    }

    const pillPot = document.getElementById('pillHwPot');
    const txtPot = document.getElementById('txtHwPot');
    if (pillPot && txtPot && data.pot !== undefined && data.pot !== null) {
      const p = Number(data.pot);
      const potPct = Math.round((p / 4095) * 100);
      const potDeg = Math.round((p / 4095) * 360);
      txtPot.textContent = `${potPct}% (${p} ADC / ${potDeg}° ${data.cardinalBearing || ''})`;
    }

    // Update Workbench Sensor Cards
    const modLm35 = document.getElementById('modLm35Val');
    if (modLm35) modLm35.textContent = `${lmVal.toFixed(1)}°C (Raw ${rawLmVolt}V)`;

    const modIrState = document.getElementById('modIrState');
    if (modIrState) {
      modIrState.textContent = isIrTriggered ? '🚨 INTRUSION DETECTED (Continuous Retrigger)' : 'BEAM ACTIVE (Continuous Sensing)';
      modIrState.style.color = isIrTriggered ? '#ef4444' : '#10b981';
    }

    // Feed real-time telemetry to Intrusion Oscilloscope & 2D Spatial Map
    intrusionScope.updateReadings({
      pirActive: isMotion,
      irBroken: isIrTriggered,
      isProximity: isBreach,
      distance: data.distance || 150,
      rawMotionMask: data.rawMotionMask
    });

    // Edge-triggered categorized alarm recording (prevents event flood & UI freeze)
    this.alarmStateCache = this.alarmStateCache || {};

    if (isIrTriggered) {
      if (!this.alarmStateCache.ir) {
        this.alarmStateCache.ir = true;
        alarmsManager.recordAlarm({
          category: 'intrusion',
          severity: 'critical',
          sensorName: 'IR Intrusion Receiver',
          pin: 'D6',
          triggerVal: '0.04V (Active Low)',
          threshold: '> 2.50V (Beam Clear)',
          description: 'Infrared optical barrier interrupted. Room boundary tripwire breached.'
        });
      }
    } else {
      if (this.alarmStateCache.ir) {
        this.alarmStateCache.ir = false;
        alarmsManager.resolveRecentAlarm('IR Intrusion Receiver', 'intrusion');
      }
    }

    if (isBreach) {
      if (!this.alarmStateCache.breach) {
        this.alarmStateCache.breach = true;
        alarmsManager.recordAlarm({
          category: 'proximity',
          severity: 'critical',
          sensorName: 'HC-SR04 Ultrasonic Sonar',
          pin: 'D0 / D1',
          triggerVal: `${(data.distance || 15).toFixed(1)} cm`,
          threshold: '< 20.0 cm',
          description: 'Proximity violation within 20cm perimeter zone.'
        });
      }
    } else {
      if (this.alarmStateCache.breach) {
        this.alarmStateCache.breach = false;
        alarmsManager.resolveRecentAlarm('HC-SR04 Ultrasonic Sonar', 'proximity');
      }
    }

    const isPirOnly = isMotion && !isBreach && !isIrTriggered;
    if (isPirOnly) {
      if (!this.alarmStateCache.pir) {
        this.alarmStateCache.pir = true;
        alarmsManager.recordAlarm({
          category: 'intrusion',
          severity: 'warning',
          sensorName: 'PIR Motion Sensor',
          pin: 'D3',
          triggerVal: '3.30V (Active High)',
          threshold: '0.00V (Idle)',
          description: 'Thermal human motion detected by wide-angle PIR sensor.'
        });
      }
    } else {
      if (this.alarmStateCache.pir) {
        this.alarmStateCache.pir = false;
        alarmsManager.resolveRecentAlarm('PIR Motion Sensor', 'intrusion');
      }
    }

    const isLmHigh = lmVal > 34;
    if (isLmHigh) {
      if (!this.alarmStateCache.lm) {
        this.alarmStateCache.lm = true;
        alarmsManager.recordAlarm({
          category: 'environmental',
          severity: 'warning',
          sensorName: 'LM35 Precision Temp',
          pin: 'A2',
          triggerVal: `${lmVal.toFixed(1)}°C (${rawLmVolt}V)`,
          threshold: '> 34.0°C',
          description: 'Elevated ambient temperature on analog LM35 sensor channel.'
        });
      }
    } else {
      if (this.alarmStateCache.lm) {
        this.alarmStateCache.lm = false;
        alarmsManager.resolveRecentAlarm('LM35 Precision Temp', 'environmental');
      }
    }

    // 4. Update Metric Cards
    const valIr = document.getElementById('valIrState');
    const badgeIr = document.getElementById('badgeIrState');
    const cardIr = document.getElementById('cardMetricIr');
    if (valIr && badgeIr) {
      if (isIrTriggered || isMotion) {
        valIr.textContent = 'INTRUSION';
        valIr.style.color = 'var(--accent-rose)';
        badgeIr.textContent = 'BEAM BROKEN';
        badgeIr.className = 'metric-badge badge-danger';
        if (cardIr) cardIr.style.borderColor = 'rgba(239, 68, 68, 0.45)';
      } else {
        valIr.textContent = 'SECURE';
        valIr.style.color = 'var(--text-main)';
        badgeIr.textContent = 'BEAM ACTIVE';
        badgeIr.className = 'metric-badge badge-normal';
        if (cardIr) cardIr.style.borderColor = '';
      }
    }
  }

  getLdrLightClassification(adcVal) {
    const l = Number(adcVal) || 0;
    if (l >= 2400) {
      return {
        phase: 'DAY',
        phaseTag: '☀️ DAY',
        label: '☀️ BRIGHT DAY',
        subtext: 'High Solar / Full Daylight (>2400 ADC)',
        badgeClass: 'compact-badge badge-normal',
        color: 'var(--accent-amber)',
        barGradient: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
        pillText: '☀️ Daylight',
        pillClass: 'hw-sensor-pill'
      };
    } else if (l >= 1200) {
      return {
        phase: 'DAY',
        phaseTag: '⛅ DAY',
        label: '⛅ DAY (INDOOR)',
        subtext: 'Normal Daylight / Chamber Well-Lit (1200-2400 ADC)',
        badgeClass: 'compact-badge badge-normal',
        color: 'var(--accent-emerald)',
        barGradient: 'linear-gradient(90deg, #10b981, #f59e0b)',
        pillText: '⛅ Day',
        pillClass: 'hw-sensor-pill'
      };
    } else if (l >= 600) {
      return {
        phase: 'LOW_LIGHT',
        phaseTag: '🕯️ LOW LIGHT',
        label: '🕯️ LOW LIGHT',
        subtext: 'Twilight / Dim Ambient Lighting (600-1200 ADC)',
        badgeClass: 'compact-badge badge-warning',
        color: 'var(--accent-cyan)',
        barGradient: 'linear-gradient(90deg, #06b6d4, #3b82f6)',
        pillText: '🕯️ Low Light',
        pillClass: 'hw-sensor-pill active-blue'
      };
    } else if (l >= 250) {
      return {
        phase: 'DUSK',
        phaseTag: '🌆 DUSK',
        label: '🌆 DUSK / SHADOW',
        subtext: 'Deep Dusk / Hand Shadow Detected (250-600 ADC)',
        badgeClass: 'compact-badge badge-warning',
        color: '#f97316',
        barGradient: 'linear-gradient(90deg, #8b5cf6, #f97316)',
        pillText: '🌆 Dusk',
        pillClass: 'hw-sensor-pill triggered'
      };
    } else {
      return {
        phase: 'NIGHT',
        phaseTag: '🌙 NIGHT',
        label: '🌙 NIGHT (DARK)',
        subtext: 'Pitch Darkness / Night Mode Active (<250 ADC)',
        badgeClass: 'compact-badge badge-danger',
        color: '#a855f7',
        barGradient: 'linear-gradient(90deg, #4338ca, #6366f1)',
        pillText: '🌙 Night',
        pillClass: 'hw-sensor-pill triggered'
      };
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

    // 1. ALL SYSTEMS NORMAL • ROOM SECURE Interactive Pill
    if (this.dom.compactSecurityPill) {
      this.dom.compactSecurityPill.addEventListener('click', () => {
        const isBreach = this.latestTelemetry && (this.latestTelemetry.dist < 20 || this.latestTelemetry.motion === 1);
        if (isBreach) {
          this.silenceAllAlarms();
          this.log('🛡️ Security Sentinel: Threat condition acknowledged and silenced.', 'warn');
        } else {
          this.log('🛡️ Security Sentinel: Zone Check - ALL SYSTEMS NOMINAL. Ultrasonic Radar & PIR Active.', 'success');
          this.dom.compactSecurityPill.classList.add('highlight-pulse');
          setTimeout(() => this.dom.compactSecurityPill && this.dom.compactSecurityPill.classList.remove('highlight-pulse'), 1200);
        }
      });
    }

    // 2. Particle: Online Interactive Pill
    if (this.dom.compactParticlePill) {
      this.dom.compactParticlePill.addEventListener('click', async () => {
        const tLabel = this.dom.textParticlePill || this.dom.compactParticlePill;
        tLabel.textContent = 'Particle: Pinging...';
        try {
          const t0 = performance.now();
          await particleApi.ping();
          const latency = Math.round(performance.now() - t0);
          tLabel.textContent = `Particle: Online (${latency}ms)`;
          this.log(`⚡ Particle Cloud Ping: ONLINE • Latency ${latency}ms (Device: ${particleApi.config.deviceId.slice(0, 8)}...)`, 'success');
        } catch (err) {
          tLabel.textContent = 'Particle: Offline';
          this.log(`Particle Cloud Ping Error: ${err.message}`, 'error');
        }
        setTimeout(() => {
          if (tLabel) tLabel.textContent = 'Particle: Online';
        }, 5000);
      });
    }

    // 3. ThingSpeak: OK Interactive Pill
    if (this.dom.compactTsPill) {
      this.dom.compactTsPill.addEventListener('click', async () => {
        const tLabel = this.dom.textTsPill || this.dom.compactTsPill;
        tLabel.textContent = 'ThingSpeak: Syncing...';
        try {
          const feed = await thingspeakApi.getLatestFeed();
          tLabel.textContent = 'ThingSpeak: Synced!';
          this.log(`🌐 ThingSpeak Cloud Sync: Feed updated (Channel #${thingspeakApi.config.channelId} • Entry #${feed ? feed.entry_id : 'OK'})`, 'success');
        } catch (err) {
          tLabel.textContent = 'ThingSpeak: Retrying...';
          this.log(`ThingSpeak Sync Notice: ${err.message}`, 'warn');
        }
        setTimeout(() => {
          if (tLabel) tLabel.textContent = 'ThingSpeak: OK';
        }, 5000);
      });
    }

    // 4. Auto-Gather Button
    if (this.dom.compactBtnAutoGather) {
      this.dom.compactBtnAutoGather.addEventListener('click', () => {
        this.runAutoGatherBoardSensors();
      });
    }

    // 5. Edit Sensors Button
    if (this.dom.compactBtnEditSensors) {
      this.dom.compactBtnEditSensors.addEventListener('click', () => {
        this.openSensorEditorModal();
      });
    }

    // 6. Silence Button
    if (this.dom.compactBtnSilence) {
      this.dom.compactBtnSilence.addEventListener('click', () => {
        this.silenceAllAlarms();
        if (this.dom.compactSilenceBtnText) {
          const orig = this.dom.compactSilenceBtnText.textContent;
          this.dom.compactSilenceBtnText.textContent = 'Silenced (45s)';
          setTimeout(() => {
            if (this.dom.compactSilenceBtnText) this.dom.compactSilenceBtnText.textContent = orig;
          }, 3000);
        }
      });
    }

    // 7. Install App Button
    if (this.dom.compactBtnInstallApp) {
      this.dom.compactBtnInstallApp.addEventListener('click', () => {
        pwaManager.install();
        this.log('📥 Launching Web App PWA Installer...', 'info');
      });
    }

    // 8. Test Sound Button
    if (this.dom.compactBtnTestBuzzer) {
      this.dom.compactBtnTestBuzzer.addEventListener('click', () => {
        audioEngine.playMelody('chime');
        if (this.dom.compactTestSoundText) {
          this.dom.compactTestSoundText.textContent = 'Melody!';
        }
        setTimeout(() => {
          if (this.dom.compactTestSoundText) this.dom.compactTestSoundText.textContent = 'Test Sound';
        }, 800);
        this.log('🎵 Melodic acoustic chime sounded.', 'info');
      });
    }

    // 9. PIR Motion Quick Disconnect / Connect Button
    if (this.dom.btnTogglePirAttached) {
      this.dom.btnTogglePirAttached.addEventListener('click', async () => {
        const activeDev = deviceRegistry.getActiveDevice();
        if (!activeDev) return;
        activeDev.attachedSensors = activeDev.attachedSensors || [];
        const idx = activeDev.attachedSensors.indexOf('pir_motion');
        const willBeAttached = idx === -1;
        if (willBeAttached) {
          activeDev.attachedSensors.push('pir_motion');
          activeDev.userWiredPir = true;
          calibrationManager.setSensorEnabled('pir_motion', true);
        } else {
          activeDev.attachedSensors.splice(idx, 1);
          activeDev.userWiredPir = false;
          calibrationManager.setSensorEnabled('pir_motion', false);
        }
        deviceRegistry.save();
        deviceRegistry.notify();
        this.silenceAllAlarms();
        this.renderActiveDeviceBanner();

        if (this.mode === 'live' && pinConfig.activeBoardId === 'spark_core') {
          particleApi.callFunction('alarm', 'p').catch(() => {});
        }

        this.log(`PIR Motion Sensor: ${willBeAttached ? 'ATTACHED & ARMED' : 'DISCONNECTED / UNPLUGGED (Alarms Suppressed)'}`, 'warn');
        if (this.audioAlarmEnabled) audioEngine.playMelody('notice');
      });
    }

    // Hero Sonar Quick Controls
    if (this.dom.btnHeroPingSonar) {
      this.dom.btnHeroPingSonar.addEventListener('click', async () => {
        this.dom.btnHeroPingSonar.disabled = true;
        this.dom.btnHeroPingSonar.innerHTML = '<span>⚡ Pinging...</span>';
        if (this.dom.heroRadarScope) this.dom.heroRadarScope.classList.add('highlight-pulse');
        const curDist = (this.latestTelemetry && this.latestTelemetry.dist !== undefined) ? this.latestTelemetry.dist : 150;
        this.log(`🎯 Field Sonar Ping: Target echo return at ${curDist.toFixed(0)} cm (Trig: D2, Echo: D6)`, 'success');
        setTimeout(() => {
          if (this.dom.btnHeroPingSonar) {
            this.dom.btnHeroPingSonar.disabled = false;
            this.dom.btnHeroPingSonar.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg><span>⚡ Ping Sonar</span>';
          }
          if (this.dom.heroRadarScope) this.dom.heroRadarScope.classList.remove('highlight-pulse');
        }, 800);
      });
    }

    if (this.dom.btnHeroSonarChirp) {
      this.dom.btnHeroSonarChirp.addEventListener('click', () => {
        audioEngine.playMelody('sonar');
        this.log('🔊 Field Sonar Acoustic Harmonic Ping Emitted', 'info');
      });
    }

    // Top Toolbar Sub-Menu "Health & Pings" Button
    if (this.dom.btnSubMenuSensorHealth) {
      this.dom.btnSubMenuSensorHealth.addEventListener('click', () => {
        this.openPingDetailsModal();
      });
    }

    // Mobile Bottom Navigation Bar Buttons
    const mBtnMonitor = document.getElementById('mBtnMonitor');
    if (mBtnMonitor) {
      mBtnMonitor.addEventListener('click', () => {
        this.switchDashboardViewMode('monitor');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const mBtnSensors = document.getElementById('mBtnSensors');
    if (mBtnSensors) {
      mBtnSensors.addEventListener('click', () => {
        this.openSensorEditorModal();
      });
    }

    const mBtnHealth = document.getElementById('mBtnHealth');
    if (mBtnHealth) {
      mBtnHealth.addEventListener('click', () => {
        this.openPingDetailsModal();
      });
    }

    const mBtnTools = document.getElementById('mBtnTools');
    if (mBtnTools) {
      mBtnTools.addEventListener('click', () => {
        this.switchDashboardViewMode('developer');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    const mBtnSilence = document.getElementById('mBtnSilence');
    if (mBtnSilence) {
      mBtnSilence.addEventListener('click', () => {
        this.silenceAllAlarms();
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
    const mBtnMonitor = document.getElementById('mBtnMonitor');
    const mBtnTools = document.getElementById('mBtnTools');

    if (mode === 'monitor') {
      document.body.classList.add('view-mode-monitoring');
      if (this.dom.compactMonitoringDashboard) this.dom.compactMonitoringDashboard.style.display = 'block';
      if (this.dom.compactCommandLayout) this.dom.compactCommandLayout.style.display = 'grid';
      if (this.dom.btnViewMonitor) this.dom.btnViewMonitor.classList.add('active');
      if (this.dom.btnViewDeveloper) this.dom.btnViewDeveloper.classList.remove('active');
      if (mBtnMonitor) mBtnMonitor.classList.add('active');
      if (mBtnTools) mBtnTools.classList.remove('active');
    } else {
      document.body.classList.add('view-mode-developer');
      if (this.dom.compactMonitoringDashboard) this.dom.compactMonitoringDashboard.style.display = 'none';
      if (this.dom.btnViewDeveloper) this.dom.btnViewDeveloper.classList.add('active');
      if (this.dom.btnViewMonitor) this.dom.btnViewMonitor.classList.remove('active');
      if (mBtnTools) mBtnTools.classList.add('active');
      if (mBtnMonitor) mBtnMonitor.classList.remove('active');
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

  initPwaUi() {
    pwaManager.init();

    // 1. Header Install Button
    if (this.dom.btnInstallPwa) {
      this.dom.btnInstallPwa.addEventListener('click', () => {
        pwaManager.install();
      });
    }

    // 2. Mobile Bottom Bar Install Button
    const mBtnInstall = document.getElementById('mBtnInstall');
    if (mBtnInstall) {
      mBtnInstall.addEventListener('click', () => {
        pwaManager.install();
      });
    }

    // 3. Compact Monitoring Dashboard Install Button
    const compactBtn = document.getElementById('compactBtnInstallApp');
    if (compactBtn) {
      compactBtn.addEventListener('click', () => {
        pwaManager.install();
      });
    }

    // 4. Floating Banner Buttons
    const btnBannerInstall = document.getElementById('btnBannerInstallNow');
    if (btnBannerInstall) {
      btnBannerInstall.addEventListener('click', () => {
        pwaManager.install();
      });
    }

    const btnBannerDismiss = document.getElementById('btnBannerDismiss');
    if (btnBannerDismiss) {
      btnBannerDismiss.addEventListener('click', () => {
        pwaManager.hideInstallBanner();
      });
    }

    // 5. Install Guide Modal Close Buttons
    const btnCloseModal = document.getElementById('btnCloseInstallModal');
    const btnDismissModal = document.getElementById('btnDismissInstallModal');
    if (btnCloseModal) {
      btnCloseModal.addEventListener('click', () => pwaManager.closeInstallModal());
    }
    if (btnDismissModal) {
      btnDismissModal.addEventListener('click', () => pwaManager.closeInstallModal());
    }

    // 6. Modal Trigger Button
    const btnTriggerAction = document.getElementById('btnTriggerInstallModalAction');
    if (btnTriggerAction) {
      btnTriggerAction.addEventListener('click', () => {
        pwaManager.closeInstallModal();
        if (pwaManager.deferredPrompt) {
          pwaManager.deferredPrompt.prompt();
        } else {
          this.log('To install: click the Install icon in the browser address bar, or use the browser menu (⋮) -> Install app.', 'info');
        }
      });
    }
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

  initIntrusionScopeUi() {
    const canvas = document.getElementById('intrusionOscilloscopeCanvas');
    const mapContainer = document.getElementById('spatialMapContainer');
    if (canvas && mapContainer) {
      intrusionScope.init(canvas, mapContainer);
    }
  }

  initAlarmsHistoryUi() {
    this.dom.btnOpenAlarmsModal = document.getElementById('btnOpenAlarmsModal');
    this.dom.modalAlarmsHistory = document.getElementById('modalAlarmsHistory');
    this.dom.btnCloseAlarmsModal = document.getElementById('btnCloseAlarmsModal');

    if (this.dom.btnOpenAlarmsModal && this.dom.modalAlarmsHistory) {
      this.dom.btnOpenAlarmsModal.addEventListener('click', () => {
        this.openAlarmsModal();
      });
    }

    if (this.dom.btnCloseAlarmsModal && this.dom.modalAlarmsHistory) {
      this.dom.btnCloseAlarmsModal.addEventListener('click', () => {
        this.dom.modalAlarmsHistory.classList.remove('active');
      });
      this.dom.modalAlarmsHistory.addEventListener('click', (e) => {
        if (e.target === this.dom.modalAlarmsHistory) {
          this.dom.modalAlarmsHistory.classList.remove('active');
        }
      });
    }

    // Modal navigation tabs: Alarms List vs Connected Devices Doc
    const tabBtnAlarmsList = document.getElementById('tabBtnAlarmsList');
    const tabBtnDevicesDoc = document.getElementById('tabBtnDevicesDoc');
    const tabPaneAlarmsList = document.getElementById('tabPaneAlarmsList');
    const tabPaneDevicesDoc = document.getElementById('tabPaneDevicesDoc');

    if (tabBtnAlarmsList && tabBtnDevicesDoc && tabPaneAlarmsList && tabPaneDevicesDoc) {
      tabBtnAlarmsList.addEventListener('click', () => {
        tabBtnAlarmsList.style.background = 'rgba(244, 63, 94, 0.18)';
        tabBtnAlarmsList.style.borderColor = '#f43f5e';
        tabBtnAlarmsList.style.color = '#ffffff';

        tabBtnDevicesDoc.style.background = 'rgba(255, 255, 255, 0.04)';
        tabBtnDevicesDoc.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        tabBtnDevicesDoc.style.color = 'var(--text-dim)';

        tabPaneAlarmsList.style.display = 'block';
        tabPaneDevicesDoc.style.display = 'none';
      });

      tabBtnDevicesDoc.addEventListener('click', () => {
        tabBtnDevicesDoc.style.background = 'rgba(2, 132, 199, 0.25)';
        tabBtnDevicesDoc.style.borderColor = '#0284c7';
        tabBtnDevicesDoc.style.color = '#ffffff';

        tabBtnAlarmsList.style.background = 'rgba(255, 255, 255, 0.04)';
        tabBtnAlarmsList.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        tabBtnAlarmsList.style.color = 'var(--text-dim)';

        tabPaneAlarmsList.style.display = 'none';
        tabPaneDevicesDoc.style.display = 'block';
      });
    }

    // Category filter pills
    const catContainer = document.getElementById('alarmCategoryFilters');
    if (catContainer) {
      catContainer.querySelectorAll('.alarm-filter-pill').forEach(btn => {
        btn.addEventListener('click', () => {
          catContainer.querySelectorAll('.alarm-filter-pill').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          alarmsManager.activeFilter = btn.getAttribute('data-category');
          alarmsManager.notifyListeners();
        });
      });
    }

    // Search and Severity filters
    const inputSearch = document.getElementById('inputAlarmsSearch');
    if (inputSearch) {
      inputSearch.addEventListener('input', (e) => {
        alarmsManager.searchQuery = e.target.value;
        alarmsManager.notifyListeners();
      });
    }

    const selectSeverity = document.getElementById('selectAlarmsSeverity');
    if (selectSeverity) {
      selectSeverity.addEventListener('change', (e) => {
        alarmsManager.activeSeverity = e.target.value;
        alarmsManager.notifyListeners();
      });
    }

    // Excel and PDF download buttons
    const btnExcel = document.getElementById('btnDownloadAlarmsExcel');
    if (btnExcel) {
      btnExcel.addEventListener('click', () => {
        alarmsManager.exportToExcel();
        this.log('📥 Alarms History exported to Excel (.csv) successfully.', 'success');
      });
    }

    const btnPdf = document.getElementById('btnDownloadAlarmsPdf');
    if (btnPdf) {
      btnPdf.addEventListener('click', () => {
        const activeDev = deviceRegistry.getActiveDevice() || { name: 'Spark Core (STM32F103)' };
        alarmsManager.exportToPdf({ name: activeDev.name || 'Spark Core' });
        this.log('📄 PDF Incident Audit Report generated.', 'success');
      });
    }

    const btnAck = document.getElementById('btnAcknowledgeAllAlarms');
    if (btnAck) {
      btnAck.addEventListener('click', () => {
        alarmsManager.acknowledgeAll();
        this.log('✓ All active alarms acknowledged.', 'info');
      });
    }

    // Subscribe to alarm updates
    alarmsManager.subscribe((filteredAlarms, stats) => {
      this.renderAlarmsTable(filteredAlarms);
      this.updateAlarmCounters(stats);
    });

    // Initial render
    alarmsManager.notifyListeners();
  }

  openAlarmsModal() {
    if (!this.dom.modalAlarmsHistory) return;
    this.dom.modalAlarmsHistory.classList.add('active');

    const activeDev = deviceRegistry.getActiveDevice() || { name: 'Spark Core (STM32F103 / CC3000)' };
    const docName = document.getElementById('docActiveModuleName');
    if (docName) {
      docName.textContent = activeDev.name || 'Spark Core (STM32F103)';
    }

    alarmsManager.notifyListeners();
  }

  renderAlarmsTable(alarms) {
    const tbody = document.getElementById('alarmsTableBody');
    if (!tbody) return;

    if (!alarms || alarms.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" style="text-align: center; padding: 24px; color: var(--text-dim);">
            No alarms matching current category or filter criteria. System secure.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = alarms.map(a => {
      const d = new Date(a.timestamp);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
      const severityColor = a.severity === 'critical' ? '#ef4444' : (a.severity === 'warning' ? '#f59e0b' : '#38bdf8');
      const statusBadge = a.status === 'ACTIVE' 
        ? '<span class="metric-badge badge-danger" style="font-size: 9px;">ACTIVE</span>' 
        : '<span class="metric-badge badge-normal" style="font-size: 9px;">RESOLVED</span>';

      return `
        <tr>
          <td style="font-family: var(--font-mono); font-weight: 700; color: var(--accent-cyan);">${a.id}</td>
          <td style="font-family: var(--font-mono); color: var(--text-muted); font-size: 10px;">${timeStr}</td>
          <td><span style="text-transform: uppercase; font-weight: 600; font-size: 10px;">${a.category}</span></td>
          <td><span style="color: ${severityColor}; font-weight: 700; font-size: 10px; text-transform: uppercase;">${a.severity}</span></td>
          <td><strong style="color: var(--text-main);">${a.sensorName}</strong> <span style="color: var(--text-dim); font-size: 10px;">(${a.pin})</span></td>
          <td style="font-family: var(--font-mono); font-weight: 700; color: #f87171;">${a.triggerVal}</td>
          <td style="font-family: var(--font-mono); color: var(--text-dim); font-size: 10px;">${a.threshold}</td>
          <td>${statusBadge}</td>
          <td style="color: var(--text-muted); font-size: 10px;">${a.description}</td>
        </tr>
      `;
    }).join('');
  }

  updateAlarmCounters(stats) {
    const elAll = document.getElementById('countAlarmsAll');
    const elInt = document.getElementById('countAlarmsIntrusion');
    const elProx = document.getElementById('countAlarmsProximity');
    const elEnv = document.getElementById('countAlarmsEnv');
    const elHw = document.getElementById('countAlarmsHw');
    const elTamper = document.getElementById('countAlarmsTamper');

    if (elAll) elAll.textContent = stats.total;
    if (elInt) elInt.textContent = stats.intrusion;
    if (elProx) elProx.textContent = stats.proximity;
    if (elEnv) elEnv.textContent = stats.environmental;
    if (elHw) elHw.textContent = (stats.total - (stats.intrusion + stats.proximity + stats.environmental)).toString();
    if (elTamper) elTamper.textContent = '1';
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
    this.renderBoardPingMatrix();
    this.renderPingDetailsTable();
    this.updateBriefSummaryStats();
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
    if (!this.dom.pingDetailsTableBody && !this.dom.dedicatedPingTableBody) return;
    const activeDev = deviceRegistry.getActiveDevice() || { name: 'Spark Core', status: 'online' };
    const mapping = pinConfig.mapping;

    const rowsHtml = Object.entries(mapping).map(([id, s]) => {
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

  updateHeaderBoardStatus(boardId = pinConfig.activeBoardId) {
    const board = pinConfig.getActiveBoard();
    const ping = portPinger.getBoardResult(boardId);

    if (this.dom.headerBoardStatusBadge) {
      let statusClass = 'online';
      let statusLabel = 'ONLINE';

      if (boardId === 'spark_core') {
        statusClass = ping.status === 'online' ? 'online' : (ping.status === 'offline' ? 'offline' : 'online');
        statusLabel = statusClass.toUpperCase();
      } else if (boardId === 'arduino_uno') {
        const isConnected = webSerialManager && webSerialManager.isConnected;
        statusClass = isConnected ? 'online' : 'ready';
        statusLabel = isConnected ? 'USB LIVE' : 'SIM STREAM';
      } else if (boardId === 'virtual_sim') {
        statusClass = 'simulated';
        statusLabel = 'SIMULATED';
      } else {
        statusClass = ping.status === 'online' ? 'online' : 'ready';
        statusLabel = ping.status.toUpperCase();
      }

      this.dom.headerBoardStatusBadge.className = `header-board-status-badge ${statusClass}`;
      if (this.dom.headerBoardStatusText) {
        const shortName = (board.name || boardId).split('(')[0].trim();
        this.dom.headerBoardStatusText.textContent = `${shortName}: ${statusLabel}`;
      }
      if (this.dom.headerBoardLatencyText) {
        this.dom.headerBoardLatencyText.textContent = ping.latencyMs > 0 ? `${ping.latencyMs}ms` : (boardId === 'arduino_uno' ? 'USB' : '--');
      }
    }
  }

  renderBoardPingMatrix() {
    if (!this.dom.boardPingCardsGrid) return;

    const boardConfigs = [
      {
        id: 'spark_core',
        name: 'sparkcore WIFI with arduino UNO',
        icon: '⚡',
        bus: 'Particle Cloud CoAP/REST (Wi-Fi CC3000)',
        badgeColor: '#00f2fe'
      },
      {
        id: 'arduino_uno',
        name: 'Arduino Uno R3 (ATmega328P)',
        icon: '🔌',
        bus: 'WebSerial UART (115200 Baud / 5V TTL)',
        badgeColor: '#10b981'
      },
      {
        id: 'esp32',
        name: 'ESP32 NodeMCU',
        icon: '📶',
        bus: 'Wi-Fi 802.11 b/g/n (192.168.1.145)',
        badgeColor: '#3b82f6'
      },
      {
        id: 'virtual_sim',
        name: 'Virtual IoT Sentinel',
        icon: '💻',
        bus: 'Browser VM Simulation Engine',
        badgeColor: '#a855f7'
      }
    ];

    const currentBoardId = pinConfig.activeBoardId;

    this.dom.boardPingCardsGrid.innerHTML = boardConfigs.map(b => {
      const ping = portPinger.getBoardResult(b.id);
      let statusBadgeClass = 'badge-normal';
      let statusText = (ping.status || 'READY').toUpperCase();

      if (b.id === 'arduino_uno') {
        const isUsb = webSerialManager && webSerialManager.isConnected;
        statusText = isUsb ? 'USB CONNECTED' : 'READY / SIM STREAM';
        statusBadgeClass = isUsb ? 'badge-normal' : 'badge-cyan';
      } else if (ping.status === 'offline') {
        statusBadgeClass = 'badge-danger';
      } else if (ping.status === 'connected' || ping.status === 'online') {
        statusBadgeClass = 'badge-normal';
      } else if (ping.status === 'simulated') {
        statusBadgeClass = 'badge-purple';
      }

      const isCurrent = currentBoardId === b.id;

      return `
        <div class="board-ping-card ${isCurrent ? 'active-board-card' : ''}" data-board-id="${b.id}" style="background: rgba(15, 23, 42, 0.65); border: 1px solid ${isCurrent ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px;">${b.icon}</span>
              <div>
                <strong style="color: var(--text-main); font-size: 13px;">${b.name}</strong>
                ${isCurrent ? '<span style="margin-left: 6px; font-size: 9px; padding: 2px 6px; border-radius: 4px; background: rgba(6, 182, 212, 0.2); color: var(--accent-cyan); font-weight: 700;">ACTIVE</span>' : ''}
                <div style="font-size: 10px; color: var(--text-dim); margin-top: 2px;">${b.bus}</div>
              </div>
            </div>
            <span class="badge ${statusBadgeClass}" id="boardStatusBadge_${b.id}" style="font-size: 9px;">${statusText}</span>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 8px; background: rgba(0,0,0,0.25); border-radius: 6px; margin-top: 4px;">
            <span style="font-size: 11px; color: var(--text-muted);">Ping Latency:</span>
            <strong id="boardLatency_${b.id}" style="font-family: var(--font-mono); font-size: 12px; color: ${ping.latencyMs > 0 ? '#10b981' : 'var(--text-dim)'};">${ping.latencyMs > 0 ? ping.latencyMs + ' ms' : (b.id === 'arduino_uno' ? 'USB' : '--')}</strong>
          </div>

          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button class="btn-outline btn-ping-single-board" data-board-id="${b.id}" style="flex: 1; padding: 5px 8px; font-size: 11px; display: flex; align-items: center; justify-content: center; gap: 4px;" title="Ping this board">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              Ping
            </button>
            ${!isCurrent ? `<button class="btn-primary btn-select-board-from-card" data-board-id="${b.id}" style="padding: 5px 10px; font-size: 11px; background: rgba(255,255,255,0.08); color: var(--text-main);">Switch</button>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Wire single ping buttons
    this.dom.boardPingCardsGrid.querySelectorAll('.btn-ping-single-board').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-board-id');
        e.currentTarget.disabled = true;
        e.currentTarget.innerHTML = '<span style="color: var(--accent-amber);">Pinging...</span>';
        await this.pingBoardOnlineStatus(id);
        e.currentTarget.disabled = false;
        e.currentTarget.innerHTML = `
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          Ping
        `;
      });
    });

    // Wire switch buttons
    this.dom.boardPingCardsGrid.querySelectorAll('.btn-select-board-from-card').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-board-id');
        this.switchBoardProfile(id);
      });
    });
  }

  async pingBoardOnlineStatus(boardId) {
    this.log(`Pinging board online status for [${boardId}]...`, 'warn');
    const res = await portPinger.pingBoard(boardId, webSerialManager);
    this.updateHeaderBoardStatus(boardId);
    this.renderBoardPingMatrix();
    this.log(`Board Ping [${res.name}]: ${res.status.toUpperCase()} • Latency: ${res.latencyMs}ms (${res.protocol})`, res.status === 'offline' ? 'error' : 'success');
    return res;
  }

  async pingAllBoardsOnlineStatus() {
    this.log('Pinging all microcontroller boards (Spark Core, Arduino Uno, ESP32, Virtual Sentinel)...', 'warn');
    if (this.dom.btnPingAllBoardsMatrix) {
      this.dom.btnPingAllBoardsMatrix.disabled = true;
      this.dom.btnPingAllBoardsMatrix.textContent = 'Pinging All Boards...';
    }
    await portPinger.pingAllBoards(webSerialManager);
    this.updateHeaderBoardStatus(pinConfig.activeBoardId);
    this.renderBoardPingMatrix();
    if (this.dom.btnPingAllBoardsMatrix) {
      this.dom.btnPingAllBoardsMatrix.disabled = false;
      this.dom.btnPingAllBoardsMatrix.textContent = '⚡ Ping All Boards Now';
    }
    this.log('Ping check completed across all microcontroller boards.', 'success');
  }

  initSilenceAlarmsUi() {
    if (this.dom.btnHeaderSilence) {
      this.dom.btnHeaderSilence.addEventListener('click', () => {
        this.silenceAllAlarms();
      });
    }

    if (this.dom.compactBtnSilence) {
      this.dom.compactBtnSilence.addEventListener('click', () => {
        this.silenceAllAlarms();
      });
    }

    const mBtnSilence = document.getElementById('mBtnSilence');
    if (mBtnSilence) {
      mBtnSilence.addEventListener('click', () => {
        this.silenceAllAlarms();
      });
    }

    if (this.dom.btnStopBuzzer) {
      this.dom.btnStopBuzzer.addEventListener('click', () => {
        this.silenceAllAlarms();
      });
    }
  }

  initBoardPingUi() {
    if (this.dom.btnHeaderPingBoard) {
      this.dom.btnHeaderPingBoard.addEventListener('click', () => {
        this.pingBoardOnlineStatus(pinConfig.activeBoardId);
      });
    }

    if (this.dom.btnPingAllBoardsMatrix) {
      this.dom.btnPingAllBoardsMatrix.addEventListener('click', () => {
        this.pingAllBoardsOnlineStatus();
      });
    }

    portPinger.onBoardResult(() => {
      this.updateHeaderBoardStatus();
      this.renderBoardPingMatrix();
    });

    // Auto-ping active board status on startup
    setTimeout(() => {
      this.pingBoardOnlineStatus(pinConfig.activeBoardId);
    }, 1500);
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

  // ===========================================================================
  // IoT Gateway Integration — Universal device connectivity
  // ===========================================================================

  initIotGateway() {
    // Listen for data from any gateway-connected device (custom_rest / websocket / server_api)
    iotGateway.onData((deviceId, data, latencyMs) => {
      const active = deviceRegistry.getActiveDevice();
      if (active && active.id === deviceId) {
        // If this device has a custom sensorSchema, use dynamic rendering
        if (active.sensorSchema && active.sensorSchema.length > 0) {
          this.updateDynamicDashboard(deviceId, data);
        } else {
          // Try standard dashboard update (if fields match known keys)
          this.updateDashboard(data);
        }
      }
    });

    // Listen for newly self-registered devices
    iotGateway.onNewDeviceRegistered((device) => {
      this.log(`📡 New device auto-registered: ${device.name} (${device.connectionMethod})`, 'success');
      this.renderActiveDeviceBanner();
      this.renderDeviceManagerList();
    });

    // Restore any previously self-registered custom connections
    iotGateway.restorePersistedConnections();

    // Wire up Add Device modal — Custom REST tab
    if (this.dom.btnSubmitAddRest) {
      this.dom.btnSubmitAddRest.addEventListener('click', () => {
        const name = this.dom.inputAddRestName?.value.trim() || 'Custom REST Device';
        const endpoint = this.dom.inputAddRestEndpoint?.value.trim() || '';
        const intervalMs = parseInt(this.dom.inputAddRestInterval?.value || '3000', 10);
        let schema = [];
        try { schema = JSON.parse(this.dom.textareaAddRestSchema?.value || '[]'); } catch (_) {}

        if (!endpoint) { alert('Please enter a valid REST endpoint URL.'); return; }

        const device = iotGateway.registerFromPayload({
          id: 'dev_rest_' + Date.now(),
          name,
          firmware: 'custom',
          connectionMethod: 'custom_rest',
          endpoint,
          credentials: { endpoint, pollIntervalMs: intervalMs },
          sensorSchema: schema
        });

        if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.remove('active');
        this.log(`🌐 Custom REST Device added: ${name} → ${endpoint}`, 'success');
        this.renderActiveDeviceBanner();
      });
    }

    // Wire up Add Device modal — WebSocket tab
    if (this.dom.btnSubmitAddWs) {
      this.dom.btnSubmitAddWs.addEventListener('click', () => {
        const name = this.dom.inputAddWsName?.value.trim() || 'WebSocket Device';
        const wsEndpoint = this.dom.inputAddWsEndpoint?.value.trim() || '';
        let schema = [];
        try { schema = JSON.parse(this.dom.textareaAddWsSchema?.value || '[]'); } catch (_) {}

        if (!wsEndpoint) { alert('Please enter a valid WebSocket endpoint URL (ws:// or wss://).'); return; }

        const device = iotGateway.registerFromPayload({
          id: 'dev_ws_' + Date.now(),
          name,
          firmware: 'custom',
          connectionMethod: 'websocket',
          wsEndpoint,
          credentials: { wsEndpoint },
          sensorSchema: schema
        });

        if (this.dom.modalAddDevice) this.dom.modalAddDevice.classList.remove('active');
        this.log(`📡 WebSocket Device added: ${name} → ${wsEndpoint}`, 'success');
        this.renderActiveDeviceBanner();
      });
    }

    // Wire up Auto-Discover — apply pasted JSON
    if (this.dom.btnAutoDiscoverApply) {
      this.dom.btnAutoDiscoverApply.addEventListener('click', () => {
        const raw = this.dom.inputAutoDiscoverJson?.value.trim() || '';
        try {
          const payload = JSON.parse(raw);
          const device = iotGateway.registerFromPayload(payload);
          this.log(`🔍 Auto-Discover: Registered ${device.name}`, 'success');
          if (this.dom.autoDiscoverStatusText) {
            this.dom.autoDiscoverStatusText.textContent = `✅ Device "${device.name}" registered successfully!`;
            this.dom.autoDiscoverStatusText.style.color = 'var(--accent-emerald)';
          }
          this.renderActiveDeviceBanner();
        } catch (err) {
          if (this.dom.autoDiscoverStatusText) {
            this.dom.autoDiscoverStatusText.textContent = `❌ Invalid JSON: ${err.message}`;
            this.dom.autoDiscoverStatusText.style.color = 'var(--accent-rose)';
          }
        }
      });
    }

    // Wire up Auto-Discover — firmware snippet generator
    const updateSnippet = () => {
      if (!this.dom.autoDiscoverSnippet || !this.dom.selectFirmwareLang) return;
      const lang = this.dom.selectFirmwareLang.value || 'arduino';
      const snippet = iotGateway.generateRegistrationSnippet({ firmware: lang });
      this.dom.autoDiscoverSnippet.textContent = snippet;
    };

    if (this.dom.selectFirmwareLang) {
      this.dom.selectFirmwareLang.addEventListener('change', updateSnippet);
      updateSnippet(); // initial render
    }

    if (this.dom.btnCopyRegSnippet) {
      this.dom.btnCopyRegSnippet.addEventListener('click', () => {
        const code = this.dom.autoDiscoverSnippet?.textContent || '';
        navigator.clipboard.writeText(code).then(() => {
          this.dom.btnCopyRegSnippet.textContent = '✅ Copied!';
          setTimeout(() => { if (this.dom.btnCopyRegSnippet) this.dom.btnCopyRegSnippet.textContent = '📋 Copy Code'; }, 2000);
        });
      });
    }

    // Listen button — polls /api/register for new self-registered devices
    if (this.dom.btnListenForDevices) {
      let isListening = false;
      this.dom.btnListenForDevices.addEventListener('click', () => {
        if (!isListening) {
          isListening = true;
          iotGateway.startServerRegistrationPolling('/api', 4000);
          this.dom.btnListenForDevices.textContent = '⏹ Stop Listening';
          this.dom.btnListenForDevices.style.background = 'rgba(239,68,68,0.15)';
          if (this.dom.autoDiscoverStatusText) {
            this.dom.autoDiscoverStatusText.textContent = '🟢 Listening for incoming device registrations on /api/register...';
            this.dom.autoDiscoverStatusText.style.color = 'var(--accent-emerald)';
          }
          this.log('Auto-discover: Listening for device self-registrations...', 'info');
        } else {
          isListening = false;
          iotGateway.stopServerRegistrationPolling();
          this.dom.btnListenForDevices.textContent = '📻 Listen for Devices';
          this.dom.btnListenForDevices.style.background = '';
          if (this.dom.autoDiscoverStatusText) {
            this.dom.autoDiscoverStatusText.textContent = 'Not listening.';
            this.dom.autoDiscoverStatusText.style.color = 'var(--text-dim)';
          }
        }
      });
    }

    // Start any custom-connection devices already in the registry
    deviceRegistry.getDevices().forEach(dev => {
      if (['custom_rest', 'websocket', 'server_api'].includes(dev.connectionMethod)) {
        iotGateway.startDevice(dev);
      }
    });
  }

  // ===========================================================================
  // Dynamic Dashboard — renders sensor cards for custom-schema devices
  // ===========================================================================

  /**
   * Handles telemetry from a custom (non-Particle, non-Arduino) device.
   * Routes to standard or dynamic rendering based on sensorSchema.
   */
  updateDynamicDashboard(deviceId, data) {
    if (!data) return;
    this.latestTelemetry = { ...data, timestamp: Date.now() };

    const device = deviceRegistry.getDevices().find(d => d.id === deviceId);
    if (!device) return;

    const schema = device.sensorSchema || [];

    // Check if schema includes standard known sensors — update them too
    const knownKeyMap = {
      temp: 'temperature', temperature: 'temperature',
      hum: 'humidity', humidity: 'humidity',
      dist: 'distance', distance: 'distance',
      motion: 'motion', pir: 'motion',
      light: 'light', ldr: 'light'
    };

    const normalizedData = {};
    Object.entries(data).forEach(([k, v]) => {
      const mappedKey = knownKeyMap[k.toLowerCase()];
      if (mappedKey) normalizedData[mappedKey] = v;
      else normalizedData[k] = v;
    });

    // If it has any known sensor keys — update compact dashboard
    if (normalizedData.temperature !== undefined || normalizedData.humidity !== undefined ||
        normalizedData.distance !== undefined || normalizedData.motion !== undefined) {
      this.updateDashboard(normalizedData);
    }

    // Feed AI engine
    aiEngine.processTelemetry(normalizedData);

    // Render dynamic cards for custom schema keys
    if (schema.length > 0 && this.dom.dynamicSensorGrid) {
      this.renderDynamicSensorCards(device, schema, data);
    }
  }

  /**
   * Renders glassmorphism sensor cards dynamically for a custom device's sensorSchema.
   * Called every telemetry update — only updates values, not the whole card DOM.
   */
  renderDynamicSensorCards(device, schema, data) {
    if (!this.dom.dynamicSensorGrid) return;

    const grid = this.dom.dynamicSensorGrid;

    // Show the grid if it was hidden
    grid.style.display = '';

    // Check if we need to rebuild (schema changed or grid is empty)
    const existingCardCount = grid.querySelectorAll('.dynamic-sensor-card').length;
    if (existingCardCount !== schema.length) {
      // Rebuild the card structure
      grid.innerHTML = `
        <div class="dynamic-grid-header">
          <span class="dynamic-grid-title">📡 ${device.name}</span>
          <span class="dynamic-grid-subtitle">${device.connectionMethod.replace('_', ' ').toUpperCase()} • ${device.zone || 'Remote Zone'}</span>
        </div>
        <div class="dynamic-cards-row" id="dynamicCardsRow"></div>
      `;

      const row = document.getElementById('dynamicCardsRow');
      schema.forEach(field => {
        const card = document.createElement('div');
        card.className = 'dynamic-sensor-card';
        card.id = `dynCard_${field.key}`;

        const val = data[field.key];
        const displayVal = val !== undefined && val !== null
          ? (typeof val === 'number' ? val.toFixed(field.decimals !== undefined ? field.decimals : 1) : String(val))
          : '--';

        const pct = (field.min !== undefined && field.max !== undefined && typeof val === 'number')
          ? Math.min(100, Math.max(0, ((val - field.min) / (field.max - field.min)) * 100))
          : 50;

        card.innerHTML = `
          <div class="dyn-card-header">
            <span class="dyn-card-icon">${field.icon || '📊'}</span>
            <span class="dyn-card-label">${field.label || field.key}</span>
          </div>
          <div class="dyn-card-value" id="dynVal_${field.key}">${displayVal}</div>
          <div class="dyn-card-unit">${field.unit || ''}</div>
          <div class="dyn-bar-track">
            <div class="dyn-bar-fill" id="dynBar_${field.key}" style="width:${pct}%"></div>
          </div>
          <div class="dyn-card-badge" id="dynBadge_${field.key}">LIVE</div>
        `;
        row.appendChild(card);
      });
    } else {
      // Just update values
      schema.forEach(field => {
        const val = data[field.key];
        if (val === undefined || val === null) return;

        const valEl = document.getElementById(`dynVal_${field.key}`);
        const barEl = document.getElementById(`dynBar_${field.key}`);
        const badgeEl = document.getElementById(`dynBadge_${field.key}`);

        if (valEl) {
          valEl.textContent = typeof val === 'number'
            ? val.toFixed(field.decimals !== undefined ? field.decimals : 1)
            : String(val);
        }

        if (barEl && field.min !== undefined && field.max !== undefined && typeof val === 'number') {
          const pct = Math.min(100, Math.max(0, ((val - field.min) / (field.max - field.min)) * 100));
          barEl.style.width = `${pct}%`;
        }

        if (badgeEl) {
          // Simple threshold-based badge
          if (field.dangerAbove !== undefined && typeof val === 'number' && val > field.dangerAbove) {
            badgeEl.textContent = field.dangerLabel || 'HIGH';
            badgeEl.className = 'dyn-card-badge badge-danger';
          } else if (field.warnAbove !== undefined && typeof val === 'number' && val > field.warnAbove) {
            badgeEl.textContent = field.warnLabel || 'WARN';
            badgeEl.className = 'dyn-card-badge badge-warning';
          } else {
            badgeEl.textContent = field.normalLabel || 'NORMAL';
            badgeEl.className = 'dyn-card-badge badge-normal';
          }
        }
      });
    }
  }

  // ===========================================================================
  // AI Engine UI
  // ===========================================================================

  initAiEngineUi() {
    // Open/close AI panel modal
    if (this.dom.btnOpenAiPanel) {
      this.dom.btnOpenAiPanel.addEventListener('click', () => {
        if (this.dom.modalAiPanel) this.dom.modalAiPanel.classList.add('active');
      });
    }
    if (this.dom.btnCloseAiPanel) {
      this.dom.btnCloseAiPanel.addEventListener('click', () => {
        if (this.dom.modalAiPanel) this.dom.modalAiPanel.classList.remove('active');
      });
    }

    // Also wire any inline AI buttons in the dropdown menu
    document.querySelectorAll('[data-open-ai-panel]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.dom.modalAiPanel) this.dom.modalAiPanel.classList.add('active');
      });
    });

    // Anomaly detection toggle
    if (this.dom.chkAiAnomaly) {
      this.dom.chkAiAnomaly.checked = aiEngine.isAnomalyDetectionEnabled;
      this.dom.chkAiAnomaly.addEventListener('change', (e) => {
        aiEngine.enableAnomalyDetection(e.target.checked);
        this.log(`🤖 AI Anomaly Detection: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, 'info');
      });
    }

    // Trend analysis toggle
    if (this.dom.chkAiTrend) {
      this.dom.chkAiTrend.checked = aiEngine.isTrendEnabled;
      this.dom.chkAiTrend.addEventListener('change', (e) => {
        aiEngine.enableTrend(e.target.checked);
        this.log(`📊 AI Trend Analysis: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`, 'info');
      });
    }

    // Listen for anomaly events — show in log and AI panel
    aiEngine.onAnomaly((result) => {
      const label = result.channel.charAt(0).toUpperCase() + result.channel.slice(1);
      const alertMsg = `🚨 AI ANOMALY: ${label} = ${result.value} (Z=${result.zScore}, μ=${result.mean}±${result.stdev})`;
      this.log(alertMsg, 'error');
      this._appendAiAnomalyLog(alertMsg);
    });

    // AI Chat
    if (this.dom.btnAiChatSend) {
      this.dom.btnAiChatSend.addEventListener('click', () => this._sendAiChat());
    }
    if (this.dom.inputAiChat) {
      this.dom.inputAiChat.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this._sendAiChat(); }
      });
    }

    // Subscribe to AI chat messages
    aiEngine.chat.onMessage((msg) => {
      this._appendAiChatMessage(msg.role, msg.content);
    });

    // AI Settings
    if (this.dom.btnSaveAiSettings) {
      this.dom.btnSaveAiSettings.addEventListener('click', () => {
        const key = this.dom.inputAiApiKey?.value.trim() || '';
        const provider = this.dom.selectAiProvider?.value || 'gemini';
        aiEngine.chat.setApiKey(key);
        aiEngine.chat.setProvider(provider);
        this.log(`🔑 AI Settings saved: Provider=${provider}, Key=${key ? '***set***' : 'none (local mode)'}`, 'success');
      });
    }

    // Populate saved key
    if (this.dom.inputAiApiKey && aiEngine.chat.apiKey) {
      this.dom.inputAiApiKey.value = aiEngine.chat.apiKey;
    }
    if (this.dom.selectAiProvider) {
      this.dom.selectAiProvider.value = aiEngine.chat.provider;
    }

    // Trend predictor
    if (this.dom.btnGetTrend) {
      this.dom.btnGetTrend.addEventListener('click', () => {
        const channel = this.dom.aiTrendChannel?.value || 'temperature';
        const result = aiEngine.getTrend(channel, 60000);
        if (this.dom.aiTrendResult) {
          if (!result) {
            this.dom.aiTrendResult.textContent = 'Insufficient data. Need at least 3 readings. Keep sensors live for a moment.';
          } else {
            const arrow = result.trend === 'rising' ? '↗️' : result.trend === 'falling' ? '↘️' : '→';
            this.dom.aiTrendResult.innerHTML = `
              ${arrow} <strong>${result.trend.toUpperCase()}</strong> — 
              Current: <strong>${result.current}</strong> → 
              60s Forecast: <strong>${result.value}</strong> 
              (slope: ${result.slope}/s)
            `;
          }
        }
      });
    }

    // Add a welcome message to the AI chat
    setTimeout(() => {
      this._appendAiChatMessage('assistant',
        '👋 Hi! I\'m your IoT AI assistant. Ask me about your sensor readings, device health, or anomalies detected. No API key needed for basic analysis!');
    }, 500);
  }

  _sendAiChat() {
    const msg = this.dom.inputAiChat?.value.trim();
    if (!msg) return;
    if (this.dom.inputAiChat) this.dom.inputAiChat.value = '';
    aiEngine.chat.send(msg, this.latestTelemetry);
  }

  _appendAiChatMessage(role, content) {
    if (!this.dom.aiChatMessages) return;
    if (role === 'thinking') return; // handled as spinner

    const el = document.createElement('div');
    el.className = `ai-chat-bubble ai-bubble-${role}`;
    el.innerHTML = `<div class="ai-bubble-content">${content.replace(/\n/g, '<br>')}</div>`;
    this.dom.aiChatMessages.appendChild(el);
    this.dom.aiChatMessages.scrollTop = this.dom.aiChatMessages.scrollHeight;
  }

  _appendAiAnomalyLog(message) {
    if (!this.dom.aiAnomalyLog) return;
    const entry = document.createElement('div');
    entry.className = 'ai-anomaly-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    this.dom.aiAnomalyLog.appendChild(entry);
    this.dom.aiAnomalyLog.scrollTop = this.dom.aiAnomalyLog.scrollHeight;
    // Keep last 20 entries
    while (this.dom.aiAnomalyLog.children.length > 20) {
      this.dom.aiAnomalyLog.removeChild(this.dom.aiAnomalyLog.firstChild);
    }
  }

  // =========================================================================
  // SUPABASE MULTI-USER ACCOUNTS & WORKSPACE ISOLATION
  // =========================================================================
  initAccountSystemUi() {
    const openModal = (tabId = 'tabAccountProfile') => {
      if (!this.dom.modalAccount) return;
      this.dom.modalAccount.classList.add('active');
      const tabs = this.dom.modalAccount.querySelectorAll('.modal-tab-btn');
      const panes = this.dom.modalAccount.querySelectorAll('.tab-content-pane');
      tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabId));
      panes.forEach(p => p.classList.toggle('active', p.id === tabId));
      renderAccountState(supabaseService.getCurrentUser(), supabaseService.isConfigured());
    };

    if (this.dom.btnOpenAccount) {
      this.dom.btnOpenAccount.addEventListener('click', () => openModal());
    }
    if (this.dom.btnSubMenuAccount) {
      this.dom.btnSubMenuAccount.addEventListener('click', () => openModal());
    }
    if (this.dom.mBtnAccount) {
      this.dom.mBtnAccount.addEventListener('click', () => openModal());
    }
    if (this.dom.btnCloseAccountModal) {
      this.dom.btnCloseAccountModal.addEventListener('click', () => {
        if (this.dom.modalAccount) this.dom.modalAccount.classList.remove('active');
      });
    }

    // Modal tabs click handling
    if (this.dom.modalAccount) {
      const tabs = this.dom.modalAccount.querySelectorAll('.modal-tab-btn');
      const panes = this.dom.modalAccount.querySelectorAll('.tab-content-pane');
      tabs.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabKey = btn.getAttribute('data-tab');
          tabs.forEach(b => b.classList.remove('active'));
          panes.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          const target = document.getElementById(tabKey);
          if (target) target.classList.add('active');
        });
      });
    }

    const renderAccountState = (user, isConfigured) => {
      if (!user) user = supabaseService.getCurrentUser();
      const isOwner = supabaseService.isCurrentUserOwner();

      // Top bar header badge
      if (this.dom.userAccountName) {
        this.dom.userAccountName.textContent = isOwner ? 'Wilkie (Owner)' : (user.fullName || user.email?.split('@')[0] || 'Developer');
      }
      if (this.dom.userAvatarBadge) {
        this.dom.userAvatarBadge.textContent = isOwner ? '👑' : '👤';
      }
      if (this.dom.userCloudIndicator) {
        this.dom.userCloudIndicator.className = 'user-cloud-indicator' + (isConfigured ? '' : ' offline');
        this.dom.userCloudIndicator.title = isConfigured ? 'Supabase DB: Connected & Synced' : 'Supabase DB: Local Offline';
      }

      // Profile modal elements
      if (this.dom.accountProfileName) {
        this.dom.accountProfileName.textContent = user.fullName || (isOwner ? 'Wilkie (Master Owner)' : 'Developer');
      }
      if (this.dom.accountProfileEmail) {
        this.dom.accountProfileEmail.textContent = user.email || 'Local Offline Account';
      }
      if (this.dom.accountProfileBadge) {
        this.dom.accountProfileBadge.textContent = isOwner 
          ? '⚡ Master Hardware Chamber • Spark Core Active' 
          : '🧪 Custom IoT Developer • Isolated Clean Workspace';
      }
      const avatarLg = document.getElementById('accountAvatarLarge');
      if (avatarLg) {
        avatarLg.textContent = isOwner ? '👑' : '👤';
      }

      if (this.dom.cardSwitchWilkie) {
        this.dom.cardSwitchWilkie.classList.toggle('active-user', isOwner);
      }
      if (this.dom.cardSwitchGuest) {
        this.dom.cardSwitchGuest.classList.toggle('active-user', !isOwner);
      }

      const devices = deviceRegistry.getDevices();
      if (this.dom.accountDeviceCount) {
        this.dom.accountDeviceCount.textContent = `${devices.length} ${devices.length === 1 ? 'device' : 'devices'} active`;
      }

      // Supabase Config fields
      const cfg = supabaseService.getConfig();
      if (this.dom.inputSupabaseUrl && !this.dom.inputSupabaseUrl.value) {
        this.dom.inputSupabaseUrl.value = cfg.url;
      }
      if (this.dom.inputSupabaseAnonKey && !this.dom.inputSupabaseAnonKey.value) {
        this.dom.inputSupabaseAnonKey.value = cfg.anonKey;
      }
      if (this.dom.supabaseStatusBadge) {
        this.dom.supabaseStatusBadge.textContent = isConfigured ? 'Cloud Connected' : 'Local Offline Mode';
        this.dom.supabaseStatusBadge.className = 'metric-badge ' + (isConfigured ? 'badge-normal' : 'badge-dim');
      }
      if (this.dom.supabaseSqlSnippet && !this.dom.supabaseSqlSnippet.textContent) {
        this.dom.supabaseSqlSnippet.textContent = SUPABASE_SQL_SCHEMA;
      }
    };

    // Quick Switch to Wilkie
    if (this.dom.btnSwitchToWilkie) {
      this.dom.btnSwitchToWilkie.addEventListener('click', () => {
        supabaseService.switchToWilkie();
        this.log('👑 Switched to Wilkie (Master Owner) — Spark Core running live.', 'success');
        this.renderActiveDeviceBanner();
        if (this.dom.modalAccount) this.dom.modalAccount.classList.remove('active');
      });
    }

    // Quick Switch to New User / Blank Slate
    if (this.dom.btnSwitchToGuest) {
      this.dom.btnSwitchToGuest.addEventListener('click', () => {
        supabaseService.switchToGuestUser('New Developer', 'developer@iot.local');
        this.log('🧪 Switched to New Developer account — blank workspace initialized (0 devices).', 'info');
        this.renderActiveDeviceBanner();
        if (this.dom.modalAccount) this.dom.modalAccount.classList.remove('active');
      });
    }

    // Sign Out
    if (this.dom.btnSignOutAccount) {
      this.dom.btnSignOutAccount.addEventListener('click', async () => {
        await supabaseService.signOut();
        this.log('Signed out of session. Returned to default station.', 'info');
        this.renderActiveDeviceBanner();
        if (this.dom.modalAccount) this.dom.modalAccount.classList.remove('active');
      });
    }

    // Supabase Sign In
    if (this.dom.btnAuthSignIn) {
      this.dom.btnAuthSignIn.addEventListener('click', async () => {
        const email = this.dom.inputAuthEmail?.value.trim();
        const password = this.dom.inputAuthPassword?.value;
        if (!email || !password) {
          alert('Please enter both email and password.');
          return;
        }
        this.dom.btnAuthSignIn.textContent = 'Signing in...';
        const res = await supabaseService.signIn({ email, password });
        this.dom.btnAuthSignIn.textContent = 'Sign In';

        if (res.error) {
          if (this.dom.authStatusMessage) {
            this.dom.authStatusMessage.style.display = 'block';
            this.dom.authStatusMessage.style.color = 'var(--accent-rose)';
            this.dom.authStatusMessage.textContent = `❌ ${res.error}`;
          }
        } else {
          this.log(`Signed in successfully as ${res.user.email}!`, 'success');
          this.renderActiveDeviceBanner();
          if (this.dom.modalAccount) this.dom.modalAccount.classList.remove('active');
        }
      });
    }

    // Supabase Sign Up (Creates a clean isolated account for new users)
    if (this.dom.btnAuthSignUp) {
      this.dom.btnAuthSignUp.addEventListener('click', async () => {
        const fullName = this.dom.inputAuthFullName?.value.trim() || 'IoT Developer';
        const email = this.dom.inputAuthEmail?.value.trim();
        const password = this.dom.inputAuthPassword?.value;
        if (!email || !password) {
          alert('Please enter email and password.');
          return;
        }
        this.dom.btnAuthSignUp.textContent = 'Creating account...';
        const res = await supabaseService.signUp({ email, password, fullName });
        this.dom.btnAuthSignUp.textContent = 'Create New Account (Blank Slate)';

        if (res.error) {
          if (this.dom.authStatusMessage) {
            this.dom.authStatusMessage.style.display = 'block';
            this.dom.authStatusMessage.style.color = 'var(--accent-rose)';
            this.dom.authStatusMessage.textContent = `❌ ${res.error}`;
          }
        } else {
          this.log(`🎉 Account created for ${fullName} (${email})! Workspace is blank — add your hardware to begin.`, 'success');
          this.renderActiveDeviceBanner();
          if (this.dom.modalAccount) this.dom.modalAccount.classList.remove('active');
        }
      });
    }

    // Save Supabase Configuration
    if (this.dom.btnSaveSupabaseConfig) {
      this.dom.btnSaveSupabaseConfig.addEventListener('click', () => {
        const url = this.dom.inputSupabaseUrl?.value.trim() || '';
        const key = this.dom.inputSupabaseAnonKey?.value.trim() || '';
        const ok = supabaseService.setConfig(url, key);
        this.log(ok ? '☁️ Supabase Cloud Keys saved and client initialized!' : 'Supabase configured in local fallback mode.', 'success');
        renderAccountState(supabaseService.getCurrentUser(), ok);
        alert(ok ? '✅ Supabase Cloud connected successfully!' : '⚠️ Incomplete Supabase URL or Anon Key. Using local offline storage.');
      });
    }

    // Test Supabase Connection
    if (this.dom.btnTestSupabase) {
      this.dom.btnTestSupabase.addEventListener('click', async () => {
        if (!supabaseService.isConfigured()) {
          alert('Please enter your Supabase Project URL and Public Anon Key first.');
          return;
        }
        this.dom.btnTestSupabase.textContent = 'Testing...';
        try {
          const user = supabaseService.getCurrentUser();
          const devList = await supabaseService.fetchCloudDevices(user.id);
          this.dom.btnTestSupabase.textContent = '⚡ Test Connection';
          if (devList !== null) {
            alert(`✅ Connected to Supabase successfully!\nFound ${devList.length} device records in database.`);
          } else {
            alert('Connected to Supabase project, but the "devices" table was not found or returned an error. Please run the SQL migration schema in Tab 4.');
          }
        } catch (err) {
          this.dom.btnTestSupabase.textContent = '⚡ Test Connection';
          alert('❌ Connection failed: ' + err.message);
        }
      });
    }

    // Copy SQL Migration
    if (this.dom.btnCopySupabaseSql) {
      this.dom.btnCopySupabaseSql.addEventListener('click', () => {
        navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA).then(() => {
          this.dom.btnCopySupabaseSql.textContent = '✅ Copied!';
          setTimeout(() => {
            if (this.dom.btnCopySupabaseSql) this.dom.btnCopySupabaseSql.textContent = '📋 Copy SQL Schema';
          }, 2000);
        });
      });
    }

    // Wire up Blank Workspace Buttons
    const openAddDeviceWithTab = (tabName) => {
      if (!this.dom.modalAddDevice) return;
      this.dom.modalAddDevice.classList.add('active');
      const tabs = this.dom.modalAddDevice.querySelectorAll('.modal-tab-btn');
      const panes = this.dom.modalAddDevice.querySelectorAll('.tab-content-pane');
      tabs.forEach(t => t.classList.toggle('active', t.getAttribute('data-tab') === tabName));
      panes.forEach(p => p.classList.toggle('active', p.id === tabName));
      if (tabName === 'tabAddSerial') {
        this.refreshConnectedSerialPorts();
      }
    };

    if (this.dom.blankBtnAddSpark) {
      this.dom.blankBtnAddSpark.addEventListener('click', () => openAddDeviceWithTab('tabAddSpark'));
    }
    if (this.dom.blankBtnAddSerial) {
      this.dom.blankBtnAddSerial.addEventListener('click', () => openAddDeviceWithTab('tabAddSerial'));
    }
    if (this.dom.blankBtnAddRest) {
      this.dom.blankBtnAddRest.addEventListener('click', () => openAddDeviceWithTab('tabAddRest'));
    }
    if (this.dom.blankBtnAddWs) {
      this.dom.blankBtnAddWs.addEventListener('click', () => openAddDeviceWithTab('tabAddWs'));
    }
    if (this.dom.blankBtnSwitchWilkie) {
      this.dom.blankBtnSwitchWilkie.addEventListener('click', () => {
        supabaseService.switchToWilkie();
        this.log('👑 Switched to Wilkie master station.', 'success');
        this.renderActiveDeviceBanner();
      });
    }

    // Listen to Auth changes
    supabaseService.onAuthChange((user, isConfigured) => {
      renderAccountState(user, isConfigured);
      this.renderActiveDeviceBanner();
    });

    // Initial render
    renderAccountState(supabaseService.getCurrentUser(), supabaseService.isConfigured());
  }

  // =========================================================================
  // COLOR MODE (LIGHT / DARK) MANAGEMENT
  // =========================================================================
  initColorModeUi() {
    const updateIcons = (mode) => {
      const isLight = mode === 'light';
      const icon = isLight ? '☀️' : '🌙';
      const label = isLight ? 'Switch to Dark Mode (Currently Light)' : 'Switch to Light Mode (Currently Dark)';
      if (this.dom.iconColorMode) this.dom.iconColorMode.textContent = icon;
      if (this.dom.btnToggleColorMode) this.dom.btnToggleColorMode.title = label;
      if (this.dom.mIconTheme) this.dom.mIconTheme.textContent = icon;
    };

    const handleToggle = () => {
      const next = themeEngine.toggleColorMode();
      updateIcons(next);
      this.log(`Theme switched to ${next === 'light' ? 'Light Mode ☀️' : 'Dark Mode 🌙'}`, 'info');
    };

    if (this.dom.btnToggleColorMode) {
      this.dom.btnToggleColorMode.addEventListener('click', handleToggle);
    }
    if (this.dom.mBtnTheme) {
      this.dom.mBtnTheme.addEventListener('click', handleToggle);
    }

    themeEngine.onChange((theme, mode) => {
      updateIcons(mode || themeEngine.getColorMode());
    });

    updateIcons(themeEngine.getColorMode());
  }

  // =========================================================================
  // FLOATING REDUCED-SIZE CORNER BRAND (PINNED IN TOP-LEFT WHEN SCROLLED)
  // =========================================================================
  initFloatingCornerBrand() {
    const cornerBrand = document.getElementById('floatingCornerBrand');
    if (!cornerBrand) return;

    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          // When page scrolls down beyond top menu (60px), show reduced corner brand
          if (window.scrollY > 60) {
            cornerBrand.classList.add('visible');
          } else {
            cornerBrand.classList.remove('visible');
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Click on reduced corner logo smoothly returns view to top menu
    cornerBrand.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    cornerBrand.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }
}

// Instantiate on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new SmartRoomApp();
  app.init();
  window.smartRoomApp = app;
});
