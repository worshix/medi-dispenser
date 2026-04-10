#include <LiquidCrystal_I2C.h>
#include <DHT.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <time.h>

// ─── WiFi ────────────────────────────────────────────────────────────────────
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ─── API ─────────────────────────────────────────────────────────────────────
const char* PATIENT_ID = "cmm0s4fjc0000vdn38d2mf32i";
const char* SERVER_URL = "http://10.18.120.85:3000/api";

// ─── Timezone offset (adjust for your timezone, e.g. UTC+2 = 7200) ──────────
const long  GMT_OFFSET_SEC  = 7200;

// ─── LCD ─────────────────────────────────────────────────────────────────────
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ─── DHT11 ───────────────────────────────────────────────────────────────────
#define DHTPIN  5
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

// ─── Buzzer ──────────────────────────────────────────────────────────────────
#define BUZZER_PIN 15

// Pattern player – alternating ON / OFF durations (ms), starts ON
#define MAX_PATTERN 12
unsigned long buzzerPattern[MAX_PATTERN];
int  buzzerPatternLen  = 0;
int  buzzerPatternStep = 0;
unsigned long buzzerPatternStart = 0;
bool buzzerActive = false;   // true while playing
bool buzzerDone   = false;   // pulses true for one loop after pattern ends

// Pre-dispense: 3 escalating beeps (100 / 160 / 260 ms) – attention signal
unsigned long PRE_PATTERN[]  = {100, 80, 160, 80, 260};
int PRE_PATTERN_LEN          = 5;

// Post-dispense: 2 long solid beeps – completion signal
unsigned long POST_PATTERN[] = {500, 200, 500};
int POST_PATTERN_LEN         = 3;

// ─── Motors ──────────────────────────────────────────────────────────────────
#define MOTOR1_IN1 4
#define MOTOR1_EN  2
#define MOTOR2_IN1 19
#define MOTOR2_EN  18
#define MOTOR3_IN1 25
#define MOTOR3_EN  33

unsigned long motor1StartTime   = 0;
unsigned long motor2StartTime   = 0;
unsigned long motor3StartTime   = 0;
unsigned long motor1RevDuration = 1000;
unsigned long motor2RevDuration = 1000;
unsigned long motor3RevDuration = 1000;

bool motor1Running = false;
bool motor2Running = false;
bool motor3Running = false;

int motor1Speed = 140;
int motor2Speed = 140;
int motor3Speed = 140;

const int pwmFrequency = 5000;
const int pwmResolution = 8;

// ─── Display ─────────────────────────────────────────────────────────────────
// Idle modes: 0 = next dose + time, 1 = motor status, 2 = temp/humid
int  displayMode            = 0;
unsigned long lastDisplayModeChange = 0;
unsigned long lastDisplayUpdate     = 0;
const unsigned long DISPLAY_UPDATE_INTERVAL = 300;
String previousLine0 = "";
String previousLine1 = "";

// ─── DHT11 ───────────────────────────────────────────────────────────────────
float temperature = 0;
float humidity    = 0;
unsigned long lastDHTReadTime = 0;
const unsigned long DHT_READ_INTERVAL = 2000;

// ─── Schedule ────────────────────────────────────────────────────────────────
#define MAX_TIMES 10
String scheduledTimes[MAX_TIMES];
int    scheduleCount = 0;
int    pillQty[3]    = {0, 0, 0};   // dose quantities for motors 1-3
bool   scheduleLoaded = false;

// ─── Dispense state machine ───────────────────────────────────────────────────
//   DS_IDLE → DS_PRE_BEEP → DS_MOTOR1 → DS_MOTOR2 → DS_MOTOR3
//           → DS_CONFIRM → DS_POST_BEEP → DS_IDLE
enum DispenseState {
  DS_IDLE,
  DS_PRE_BEEP,
  DS_MOTOR1,
  DS_MOTOR2,
  DS_MOTOR3,
  DS_CONFIRM,
  DS_POST_BEEP
};
DispenseState dispenseState = DS_IDLE;

int  dispenseRemaining[3] = {0, 0, 0};  // revolutions still to fire per motor
int  dispenseTotal[3]     = {0, 0, 0};  // original quantities (for display)
int  currentPill          = 0;          // 1, 2, or 3 – which pill is running now

String lastDispensedMinute = "";

unsigned long lastTimeCheck = 0;
const unsigned long TIME_CHECK_INTERVAL = 10000;

// ─────────────────────────────────────────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  Serial.println("MediDispenser starting...");

  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);

  dht.begin();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcdForce("MediDispenser", "Starting...");

  ledcAttach(MOTOR1_IN1, pwmFrequency, pwmResolution);
  ledcAttach(MOTOR1_EN,  pwmFrequency, pwmResolution);
  ledcAttach(MOTOR2_IN1, pwmFrequency, pwmResolution);
  ledcAttach(MOTOR2_EN,  pwmFrequency, pwmResolution);
  ledcAttach(MOTOR3_IN1, pwmFrequency, pwmResolution);
  ledcAttach(MOTOR3_EN,  pwmFrequency, pwmResolution);
  stopAllMotors();

  connectWiFi();

  fetchSchedule(); // time is set inside parseSchedule() from serverTime field

  updateRevDurations();
  forceDisplayRefresh();
  updateDisplay();
  Serial.println("Setup complete.");
}

// ─────────────────────────────────────────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────────────────────────────────────────
void loop() {
  unsigned long now = millis();

  handleBuzzer();

  // DHT read
  if (now - lastDHTReadTime >= DHT_READ_INTERVAL) {
    readDHTSensor();
    lastDHTReadTime = now;
  }

  // Motor completion checks
  if (motor1Running && (now - motor1StartTime >= motor1RevDuration)) {
    stopMotor1();
    motor1Running = false;
    Serial.println("Motor 1 revolution done");
  }
  if (motor2Running && (now - motor2StartTime >= motor2RevDuration)) {
    stopMotor2();
    motor2Running = false;
    Serial.println("Motor 2 revolution done");
  }
  if (motor3Running && (now - motor3StartTime >= motor3RevDuration)) {
    stopMotor3();
    motor3Running = false;
    Serial.println("Motor 3 revolution done");
  }

  // Advance dispense state machine every loop
  advanceDispenseState();

  // Periodic schedule time check (only when idle)
  if (scheduleLoaded && dispenseState == DS_IDLE &&
      (now - lastTimeCheck >= TIME_CHECK_INTERVAL)) {
    checkScheduledTime();
    lastTimeCheck = now;
  }

  // Display update
  if (now - lastDisplayUpdate >= DISPLAY_UPDATE_INTERVAL) {
    updateDisplay();
    lastDisplayUpdate = now;
  }

  // Rotate idle display modes every 5 s (not during dispensing)
  if (dispenseState == DS_IDLE && (now - lastDisplayModeChange >= 5000)) {
    displayMode = (displayMode + 1) % 3;  // 3 idle modes
    lastDisplayModeChange = now;
    forceDisplayRefresh();
    updateDisplay();
  }

  handleSerialCommands();
}

// ─────────────────────────────────────────────────────────────────────────────
//  BUZZER PATTERN PLAYER
// ─────────────────────────────────────────────────────────────────────────────
void playBuzzerPattern(unsigned long* pattern, int len) {
  memcpy(buzzerPattern, pattern, len * sizeof(unsigned long));
  buzzerPatternLen   = len;
  buzzerPatternStep  = 0;
  buzzerPatternStart = millis();
  buzzerActive       = true;
  buzzerDone         = false;
  digitalWrite(BUZZER_PIN, HIGH);  // step 0 is always ON
}

void handleBuzzer() {
  buzzerDone = false;
  if (!buzzerActive) return;

  unsigned long elapsed    = millis() - buzzerPatternStart;
  unsigned long cumulative = 0;
  int step = 0;

  for (step = 0; step < buzzerPatternLen; step++) {
    cumulative += buzzerPattern[step];
    if (elapsed < cumulative) break;
  }

  if (step >= buzzerPatternLen) {
    // Pattern finished
    digitalWrite(BUZZER_PIN, LOW);
    buzzerActive = false;
    buzzerDone   = true;
    return;
  }

  // Even step = ON, odd step = OFF
  digitalWrite(BUZZER_PIN, (step % 2 == 0) ? HIGH : LOW);
}

// ─────────────────────────────────────────────────────────────────────────────
//  DISPENSE STATE MACHINE
// ─────────────────────────────────────────────────────────────────────────────
void startDispensingSequence() {
  dispenseTotal[0]     = pillQty[0];
  dispenseTotal[1]     = pillQty[1];
  dispenseTotal[2]     = pillQty[2];
  dispenseRemaining[0] = pillQty[0];
  dispenseRemaining[1] = pillQty[1];
  dispenseRemaining[2] = pillQty[2];
  currentPill          = 0;

  Serial.printf("Dispense triggered: P1×%d P2×%d P3×%d\n",
                pillQty[0], pillQty[1], pillQty[2]);

  dispenseState = DS_PRE_BEEP;
  playBuzzerPattern(PRE_PATTERN, PRE_PATTERN_LEN);
  forceDisplayRefresh();
}

void advanceDispenseState() {
  switch (dispenseState) {

    case DS_IDLE:
      break;

    // ── Wait for pre-beep to finish, then start dispensing ──────────────────
    case DS_PRE_BEEP:
      if (buzzerDone) {
        dispenseState = DS_MOTOR1;
        advanceDispenseState();  // immediately try motor 1
      }
      break;

    // ── Motor 1 ─────────────────────────────────────────────────────────────
    case DS_MOTOR1:
      if (motor1Running) return;
      if (dispenseRemaining[0] > 0) {
        dispenseRemaining[0]--;
        currentPill = 1;
        startMotor1Once();
      } else {
        dispenseState = DS_MOTOR2;
        advanceDispenseState();
      }
      break;

    // ── Motor 2 ─────────────────────────────────────────────────────────────
    case DS_MOTOR2:
      if (motor2Running) return;
      if (dispenseRemaining[1] > 0) {
        dispenseRemaining[1]--;
        currentPill = 2;
        startMotor2Once();
      } else {
        dispenseState = DS_MOTOR3;
        advanceDispenseState();
      }
      break;

    // ── Motor 3 ─────────────────────────────────────────────────────────────
    case DS_MOTOR3:
      if (motor3Running) return;
      if (dispenseRemaining[2] > 0) {
        dispenseRemaining[2]--;
        currentPill = 3;
        startMotor3Once();
      } else {
        dispenseState = DS_CONFIRM;
        advanceDispenseState();
      }
      break;

    // ── Confirm with server ──────────────────────────────────────────────────
    case DS_CONFIRM:
      currentPill   = 0;
      confirmDispensing();
      dispenseState = DS_POST_BEEP;
      playBuzzerPattern(POST_PATTERN, POST_PATTERN_LEN);
      forceDisplayRefresh();
      break;

    // ── Wait for post-beep, then go idle ────────────────────────────────────
    case DS_POST_BEEP:
      if (buzzerDone) {
        Serial.println("Dispensing complete.");
        dispenseState = DS_IDLE;
        forceDisplayRefresh();
        updateDisplay();
      }
      break;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  SCHEDULE CHECK
// ─────────────────────────────────────────────────────────────────────────────
void checkScheduledTime() {
  struct tm t;
  if (!getLocalTime(&t)) return;

  char buf[6];
  snprintf(buf, sizeof(buf), "%02d:%02d", t.tm_hour, t.tm_min);
  String currentMinute = String(buf);

  if (currentMinute == lastDispensedMinute) return;

  for (int i = 0; i < scheduleCount; i++) {
    if (scheduledTimes[i] == currentMinute) {
      Serial.println("Time matched: " + currentMinute + " – starting dispense");
      lastDispensedMinute = currentMinute;
      startDispensingSequence();
      return;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  WiFi
// ─────────────────────────────────────────────────────────────────────────────
void connectWiFi() {
  lcdForce("Connecting WiFi", String(WIFI_SSID).substring(0, 16));
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi: " + WiFi.localIP().toString());
    lcdForce("WiFi OK", WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi failed – offline");
    lcdForce("WiFi FAILED", "Offline mode");
  }
  delay(1500);
}

// ─────────────────────────────────────────────────────────────────────────────
//  FETCH SCHEDULE
// ─────────────────────────────────────────────────────────────────────────────
void fetchSchedule() {
  if (WiFi.status() != WL_CONNECTED) {
    lcdForce("No WiFi", "No schedule");
    return;
  }
  lcdForce("Fetching", "schedule...");

  HTTPClient http;
  String url = String(SERVER_URL) + "/controller/schedule?key=" + String(PATIENT_ID);
  http.begin(url);
  int code = http.GET();

  if (code == 200) {
    parseSchedule(http.getString());
  } else {
    Serial.println("Schedule fetch error: " + String(code));
    lcdForce("Schedule err", "Code:" + String(code));
    delay(2000);
  }
  http.end();
}

void parseSchedule(String json) {
  StaticJsonDocument<1024> doc;
  if (deserializeJson(doc, json)) { Serial.println("JSON parse error"); return; }

  // Set ESP32 clock from server time (no NTP/internet needed)
  long serverTime = doc["serverTime"] | 0;
  if (serverTime > 0) {
    time_t t = (time_t)(serverTime + GMT_OFFSET_SEC);
    struct timeval tv = { t, 0 };
    settimeofday(&tv, nullptr);
    Serial.println("Clock set from server: " + getCurrentTimeString());
    lcdForce("Time set", getCurrentTimeString());
    delay(1000);
  } else {
    Serial.println("Warning: no serverTime in response");
  }

  String name = doc["patientName"] | "Unknown";
  lcdForce("Patient:", name.substring(0, 16));
  delay(1500);

  pillQty[0] = doc["pills"]["pill1"] | 0;
  pillQty[1] = doc["pills"]["pill2"] | 0;
  pillQty[2] = doc["pills"]["pill3"] | 0;

  scheduleCount = 0;
  JsonArray times = doc["times"].as<JsonArray>();
  for (JsonVariant t : times) {
    if (scheduleCount >= MAX_TIMES) break;
    scheduledTimes[scheduleCount++] = t.as<String>();
  }

  scheduleLoaded = true;
  Serial.printf("Schedule: %s | %d times | P:%d/%d/%d\n",
                name.c_str(), scheduleCount, pillQty[0], pillQty[1], pillQty[2]);

  lcdForce("Schedule OK", String(scheduleCount) + " dose time(s)");
  delay(1500);
}

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIRM DISPENSING
// ─────────────────────────────────────────────────────────────────────────────
void confirmDispensing() {
  if (WiFi.status() != WL_CONNECTED) { Serial.println("confirm: no WiFi"); return; }

  HTTPClient http;
  http.begin(String(SERVER_URL) + "/controller/dispense");
  http.addHeader("Content-Type", "application/json");

  String body = "{\"key\":\"" + String(PATIENT_ID) + "\""
                ",\"pill1\":" + String(pillQty[0]) +
                ",\"pill2\":" + String(pillQty[1]) +
                ",\"pill3\":" + String(pillQty[2]) +
                ",\"pill4\":0,\"pill5\":0}";

  int code = http.POST(body);
  Serial.println("Confirm: " + String(code));
  if (code == 200) Serial.println(http.getString());
  http.end();
}

// ─────────────────────────────────────────────────────────────────────────────
//  MOTORS
// ─────────────────────────────────────────────────────────────────────────────
void updateRevDurations() {
  motor1RevDuration = map(motor1Speed, 0, 255, 2000, 500);
  motor2RevDuration = map(motor2Speed, 0, 255, 2000, 500);
  motor3RevDuration = map(motor3Speed, 0, 255, 2000, 500);
}

void startMotor1Once() {
  motor1StartTime = millis();
  ledcWrite(MOTOR1_IN1, motor1Speed);
  ledcWrite(MOTOR1_EN,  motor1Speed);
  motor1Running = true;
  Serial.println("Motor 1 started");
  forceDisplayRefresh(); updateDisplay();
}

void startMotor2Once() {
  motor2StartTime = millis();
  ledcWrite(MOTOR2_IN1, motor2Speed);
  ledcWrite(MOTOR2_EN,  motor2Speed);
  motor2Running = true;
  Serial.println("Motor 2 started");
  forceDisplayRefresh(); updateDisplay();
}

void startMotor3Once() {
  motor3StartTime = millis();
  ledcWrite(MOTOR3_IN1, motor3Speed);
  ledcWrite(MOTOR3_EN,  motor3Speed);
  motor3Running = true;
  Serial.println("Motor 3 started");
  forceDisplayRefresh(); updateDisplay();
}

void stopMotor1()    { ledcWrite(MOTOR1_IN1, 0); ledcWrite(MOTOR1_EN, 0); }
void stopMotor2()    { ledcWrite(MOTOR2_IN1, 0); ledcWrite(MOTOR2_EN, 0); }
void stopMotor3()    { ledcWrite(MOTOR3_IN1, 0); ledcWrite(MOTOR3_EN, 0); }
void stopAllMotors() { stopMotor1(); stopMotor2(); stopMotor3(); }

// ─────────────────────────────────────────────────────────────────────────────
//  DHT11
// ─────────────────────────────────────────────────────────────────────────────
void readDHTSensor() {
  float h = dht.readHumidity();
  float t = dht.readTemperature();
  if (isnan(h) || isnan(t)) { temperature = -99; humidity = -99; }
  else { temperature = t; humidity = h; }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DISPLAY
// ─────────────────────────────────────────────────────────────────────────────

// Force next updateDisplay() to redraw both lines (used on mode/state changes)
void forceDisplayRefresh() {
  previousLine0 = "";
  previousLine1 = "";
}

// Write directly to LCD – use only during setup/transitions (clears screen)
void lcdForce(String l0, String l1) {
  lcd.clear();
  lcd.setCursor(0, 0); lcd.print(l0.substring(0, 16));
  lcd.setCursor(0, 1); lcd.print(l1.substring(0, 16));
  previousLine0 = l0.substring(0, 16);
  previousLine1 = l1.substring(0, 16);
}

void writeLine(int row, String text) {
  // Pad / truncate to 16 chars
  while ((int)text.length() < 16) text += " ";
  text = text.substring(0, 16);
  String& prev = (row == 0) ? previousLine0 : previousLine1;
  if (text != prev) {
    lcd.setCursor(0, row);
    lcd.print(text);
    prev = text;
  }
}

void updateDisplay() {
  // ── Dispensing states override idle modes ────────────────────────────────
  if (dispenseState == DS_PRE_BEEP) {
    writeLine(0, "!! MEDS READY !!");
    writeLine(1, "Dispensing soon!");
    return;
  }

  if (dispenseState == DS_MOTOR1 || dispenseState == DS_MOTOR2 || dispenseState == DS_MOTOR3) {
    // Line 0: which pill is running + progress dots
    String l0 = "Dispensing P" + String(currentPill);
    if (motor1Running || motor2Running || motor3Running) {
      // Animate with a rotating marker based on time
      int dot = (millis() / 250) % 4;
      for (int i = 0; i < dot; i++) l0 += ".";
    }
    writeLine(0, l0);

    // Line 1: remaining pills per slot  "P1:2 P2:1 P3:0"
    String l1 = "P1:" + String(dispenseRemaining[0]) +
                " P2:" + String(dispenseRemaining[1]) +
                " P3:" + String(dispenseRemaining[2]);
    writeLine(1, l1);
    return;
  }

  if (dispenseState == DS_CONFIRM) {
    writeLine(0, "Confirming...   ");
    writeLine(1, "Please wait...  ");
    return;
  }

  if (dispenseState == DS_POST_BEEP) {
    writeLine(0, "** DONE! **     ");
    writeLine(1, "Take your meds! ");
    return;
  }

  // ── Idle display modes ───────────────────────────────────────────────────
  switch (displayMode) {

    case 0: {
      // Next dose time + current clock
      String nextTime = getNextScheduledTime();
      writeLine(0, "Next: " + nextTime);
      writeLine(1, "Now:  " + getCurrentTimeString());
      break;
    }

    case 1: {
      // Motor status – all 3 on 2 lines
      // "M1:RDY M2:RDY  " / "M3:RDY  S:140  "
      auto motorTag = [](bool running) -> String { return running ? "RUN" : "RDY"; };
      writeLine(0, "M1:" + motorTag(motor1Running) + " M2:" + motorTag(motor2Running));
      writeLine(1, "M3:" + motorTag(motor3Running) + "  Spd:" + String(motor1Speed));
      break;
    }

    case 2: {
      // Temp + humidity
      writeLine(0, getDHTLine0());
      writeLine(1, getDHTLine1());
      break;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  DISPLAY HELPERS
// ─────────────────────────────────────────────────────────────────────────────
String getCurrentTimeString() {
  struct tm t;
  if (!getLocalTime(&t)) return "--:--";
  char buf[6];
  snprintf(buf, sizeof(buf), "%02d:%02d", t.tm_hour, t.tm_min);
  return String(buf);
}

String getNextScheduledTime() {
  if (!scheduleLoaded || scheduleCount == 0) return "No schedule";

  struct tm t;
  if (!getLocalTime(&t)) return "--:--";
  int nowMins = t.tm_hour * 60 + t.tm_min;

  int bestDiff = 99999;
  String bestTime = "";

  for (int i = 0; i < scheduleCount; i++) {
    int h = scheduledTimes[i].substring(0, 2).toInt();
    int m = scheduledTimes[i].substring(3, 5).toInt();
    int diff = (h * 60 + m) - nowMins;
    if (diff <= 0) diff += 1440;  // wrap to next day
    if (diff < bestDiff) { bestDiff = diff; bestTime = scheduledTimes[i]; }
  }

  return bestTime;
}

String getDHTLine0() {
  String r = "Temp:";
  if (temperature == -99) r += " Error  ";
  else { r += String(temperature, 1); r += (char)223; r += "C"; }
  while ((int)r.length() < 16) r += " ";
  return r;
}

String getDHTLine1() {
  String r = "Humid:";
  if (humidity == -99) { r += "Error "; }
  else {
    r += String(humidity, 1) + "% ";
    if (temperature >= 20 && temperature <= 25 && humidity >= 40 && humidity <= 60) r += "OK";
    else if (temperature > 30) r += "HOT";
    else if (temperature < 18) r += "CLD";
    else r += "--";
  }
  while ((int)r.length() < 16) r += " ";
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
//  SERIAL COMMANDS
// ─────────────────────────────────────────────────────────────────────────────
void handleSerialCommands() {
  if (!Serial.available()) return;
  String cmd = Serial.readStringUntil('\n');
  cmd.trim(); cmd.toLowerCase();

  if      (cmd == "m1")       { startMotor1Once(); }
  else if (cmd == "m2")       { startMotor2Once(); }
  else if (cmd == "m3")       { startMotor3Once(); }
  else if (cmd == "dispense") { if (dispenseState == DS_IDLE) startDispensingSequence(); }
  else if (cmd == "fetch")    { fetchSchedule(); forceDisplayRefresh(); }
  else if (cmd.startsWith("m1speed:")) { motor1Speed = cmd.substring(8).toInt(); updateRevDurations(); }
  else if (cmd.startsWith("m2speed:")) { motor2Speed = cmd.substring(8).toInt(); updateRevDurations(); }
  else if (cmd.startsWith("m3speed:")) { motor3Speed = cmd.substring(8).toInt(); updateRevDurations(); }
  else if (cmd == "status") {
    Serial.println("=== Status ===");
    Serial.printf("WiFi:    %s\n", WiFi.status() == WL_CONNECTED
                  ? WiFi.localIP().toString().c_str() : "disconnected");
    Serial.printf("Time:    %s\n", getCurrentTimeString().c_str());
    Serial.printf("Schedule: %d time(s)\n", scheduleCount);
    for (int i = 0; i < scheduleCount; i++) Serial.println("  " + scheduledTimes[i]);
    Serial.printf("Pills/dose: P1:%d P2:%d P3:%d\n", pillQty[0], pillQty[1], pillQty[2]);
    Serial.printf("Next dose: %s\n", getNextScheduledTime().c_str());
    Serial.printf("Motors: M1:%s M2:%s M3:%s\n",
                  motor1Running ? "RUN" : "STP",
                  motor2Running ? "RUN" : "STP",
                  motor3Running ? "RUN" : "STP");
    Serial.printf("Temp: %.1f°C  Humid: %.1f%%\n", temperature, humidity);
    Serial.printf("Last dispensed: %s\n", lastDispensedMinute.c_str());
    Serial.println("==============");
  }
  else if (cmd != "") {
    Serial.println("Commands: m1 m2 m3 dispense fetch status m1/2/3speed:XXX");
  }
}
