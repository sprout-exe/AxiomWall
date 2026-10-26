// BMS Guard v2 - Wokwi battery pack that feeds the AXIOMWALL website
//
// This ESP32 plays the BATTERY PACK: it simulates the real pack with the SAME physics
// as the website's digital twin (16S LFP, Rint 0.03, Cth 20000, Rth 0.05, Qnom 100 Ah,
// thermal time-scale 20), then publishes the REPORTED telemetry once per second.
// Attack buttons falsify only the reported stream, exactly like the website's Attack Lab.
// The website's firewall engine does the detection. A small on-board guard also runs
// here as a second opinion.
//
// Pot   = current magnitude (CHARGE: 0-55 A, DRIVE: 0-110 A)
// Btn1  = Temperature freeze   Btn2 = SoC +20% spoof   Btn3 = Malicious SET_CURRENT command
// Btn4  = Reset scenario       Btn5 = Switch CHARGE / DRIVE
// Sign convention (same as the website): I > 0 = drive/discharge, I < 0 = charging.

#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// ---------- Pins ----------
#define PIN_POT      34
#define PIN_ATK_TEMP 4
#define PIN_ATK_SOC  5
#define PIN_ATK_CMD  18
#define PIN_RESET    19
#define PIN_MODE     23
#define PIN_LED_G    25
#define PIN_LED_Y    26
#define PIN_LED_R    27

// ---------- Pack physics (identical to website src/engine/twin.js) ----------
const float RINT = 0.03;     // ohm
const float CTH  = 20000.0;  // J/K
const float RTH  = 0.05;     // K/W
const float TAMB = 28.0;     // degC
const float QNOM = 100.0;    // Ah
const float TC   = 20.0;     // thermal time-scale (applied to dT/dt only)
const float T_START   = 31.0;
const float SOC_START = 64.0;

const float OCV_S[14] = { 0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 85, 90, 95, 100 };
const float OCV_V[14] = { 48.00, 49.60, 50.40, 51.20, 51.52, 51.84, 52.00, 52.16, 52.48, 52.80, 53.28, 54.08, 56.00, 58.00 };

const float LIMIT_CHARGE = 60.0;   // A, safe limit
const float LIMIT_DRIVE  = 120.0;  // A, safe limit
const float POT_MAX_CHARGE = 55.0; // A, pot full scale (kept just under the limit so
const float POT_MAX_DRIVE  = 110.0; // sensor noise never crosses it on a normal run)

// ---------- On-board guard (second opinion) ----------
const float R_MODEL     = 0.0291;  // guard's own estimate of Rint (3% off, like real life)
const float TEMP_WARN   = 0.8,  TEMP_ATTACK = 1.5;   // degC residual
const float SOC_WARN    = 0.8,  SOC_ATTACK  = 1.5;   // % residual
const int   CONFIRM     = 2;
// false: the guard only reports, the website's firewall decides.
// true : the guard also cuts the pack current when it trips (standalone protection).
const bool  GUARD_CUTS_CURRENT = false;

// MUST be unique (public broker) and must match the website's MQTT topic field
const char* TOPIC     = "bms-guard-ai01-7421/telemetry";
const char* MQTT_HOST = "broker.hivemq.com";
const int   MQTT_PORT = 1883;

enum State { SAFE, WARNING, ATTACK };
enum Mode  { CHARGE, DRIVE };

Adafruit_SSD1306 oled(128, 64, &Wire, -1);
WiFiClient wifiClient;
PubSubClient mqtt(wifiClient);

// Real pack (hidden from the network)
float plantT = T_START, plantSoC = SOC_START;
// Guard's own model
float modelT = T_START, modelSoC = SOC_START;
// What is reported
float repV = 0, repI = 0, repT = T_START, repSoC = SOC_START, repP = 0;
// Operation
Mode mode = DRIVE;
float cmdA = 0, appliedA = 0, limitA = LIMIT_DRIVE, trueI = 0;
int speedKmh = 0;
unsigned long simT = 0;
// Attacks
bool atkTemp = false, atkSoC = false, atkCmd = false;
float frozenT = T_START;
// Guard state
int tempCount = 0, socCount = 0;
bool tempAlert = false, socAlert = false, cmdAlert = false, tripped = false;
float dT = 0, dS = 0;
State state = SAFE;

const uint8_t btnPin[5] = { PIN_ATK_TEMP, PIN_ATK_SOC, PIN_ATK_CMD, PIN_RESET, PIN_MODE };
bool btnLast[5] = { HIGH, HIGH, HIGH, HIGH, HIGH };
unsigned long lastStep = 0, lastMqttTry = 0;

float noise(float amp) { return (random(-1000, 1001) / 1000.0f) * amp; }

float ocv(float soc) {
  soc = constrain(soc, 0.0f, 100.0f);
  for (int i = 0; i < 13; i++) {
    if (soc <= OCV_S[i + 1]) {
      float f = (soc - OCV_S[i]) / (OCV_S[i + 1] - OCV_S[i]);
      return OCV_V[i] + f * (OCV_V[i + 1] - OCV_V[i]);
    }
  }
  return OCV_V[13];
}

void resetScenario() {
  plantT = modelT = repT = T_START;
  plantSoC = modelSoC = repSoC = SOC_START;
  atkTemp = atkSoC = atkCmd = false;
  tempCount = socCount = 0;
  tempAlert = socAlert = cmdAlert = tripped = false;
  dT = dS = 0;
  state = SAFE;
  simT = 0;
}

void handleButtons() {
  for (int i = 0; i < 5; i++) {
    bool s = digitalRead(btnPin[i]);
    if (s == LOW && btnLast[i] == HIGH) {
      switch (i) {
        case 0: atkTemp = !atkTemp; if (atkTemp) frozenT = plantT; break;
        case 1: atkSoC = !atkSoC; break;
        case 2: atkCmd = !atkCmd; break;
        case 3: resetScenario(); break;
        case 4: mode = (mode == CHARGE) ? DRIVE : CHARGE; break;
      }
    }
    btnLast[i] = s;
  }
}

void ensureMqtt() {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) return;
  if (millis() - lastMqttTry < 3000) return;
  lastMqttTry = millis();
  String id = "bms-guard-" + String((uint32_t)esp_random(), HEX);
  mqtt.connect(id.c_str());
}

// One second of simulation + guard evaluation
void stepSim() {
  // 1. Command (the pot, or a malicious one when the attack is on)
  limitA = (mode == CHARGE) ? LIMIT_CHARGE : LIMIT_DRIVE;
  float potMax = (mode == CHARGE) ? POT_MAX_CHARGE : POT_MAX_DRIVE;
  float potMag = round(analogRead(PIN_POT) / 4095.0 * potMax);
  cmdA = atkCmd ? 2.0 * limitA : potMag;        // malicious: twice the safe limit
  cmdAlert = cmdA > limitA + 0.5;               // above the limit is never legitimate
  appliedA = cmdAlert ? potMag : cmdA;          // reject the bad command, keep the last legitimate one
  if (GUARD_CUTS_CURRENT && tripped) appliedA = 0;

  trueI = (mode == CHARGE) ? -appliedA : appliedA;
  speedKmh = (mode == DRIVE && appliedA > 1.0) ? 30 : 0;

  // 2. Real pack physics (same equations as the website twin)
  float V_true = ocv(plantSoC) - trueI * RINT;
  plantT += (trueI * trueI * RINT - (plantT - TAMB) / RTH) / CTH * TC;
  plantSoC = constrain(plantSoC - trueI / (3600.0 * QNOM) * 100.0, 0.0f, 100.0f);

  // 3. Reported telemetry (T and SoC can be spoofed)
  repV   = V_true + noise(0.08);
  repI   = trueI + noise(0.35);
  repT   = atkTemp ? frozenT : plantT + noise(0.08);
  repSoC = constrain(plantSoC + noise(0.03) + (atkSoC ? 20.0 : 0.0), 0.0f, 100.0f);
  repP   = V_true * trueI / 1000.0;

  // 4. On-board guard: its own model driven by the reported current
  modelT += (repI * repI * R_MODEL - (modelT - TAMB) / RTH) / CTH * TC;
  modelSoC = constrain(modelSoC - repI / (3600.0 * QNOM) * 100.0, 0.0f, 100.0f);
  dT = repT - modelT;
  dS = repSoC - modelSoC;
  tempCount = (fabs(dT) > TEMP_ATTACK) ? tempCount + 1 : 0;
  socCount  = (fabs(dS) > SOC_ATTACK)  ? socCount + 1  : 0;
  if (tempCount >= CONFIRM) tempAlert = true;   // latched until reset
  if (socCount  >= CONFIRM) socAlert  = true;
  if (tempAlert || socAlert) tripped = true;

  bool warn = fabs(dT) > TEMP_WARN || fabs(dS) > SOC_WARN;
  if (tempAlert || socAlert || cmdAlert) state = ATTACK;
  else if (warn) state = WARNING;
  else state = SAFE;

  digitalWrite(PIN_LED_G, state == SAFE);
  digitalWrite(PIN_LED_Y, state == WARNING);
  digitalWrite(PIN_LED_R, state == ATTACK);
}

bool contactorOpen() { return GUARD_CUTS_CURRENT && tripped; }

void updateDisplay() {
  const char* names[] = { "SAFE", "WARNING", "ATTACK" };
  oled.clearDisplay();
  oled.setTextSize(1);
  oled.setTextColor(SSD1306_WHITE);
  oled.setCursor(0, 0);  oled.printf("%s  %s", mode == CHARGE ? "CHARGE" : "DRIVE", names[state]);
  oled.setCursor(0, 9);  oled.printf("I:%.0f cmd:%.0f lim:%.0f", trueI, cmdA, limitA);
  oled.setCursor(0, 18); oled.printf("T rep %.1f mdl %.1f", repT, modelT);
  oled.setCursor(0, 27); oled.printf("SoC rep %.1f mdl %.1f", repSoC, modelSoC);
  oled.setCursor(0, 36); oled.printf("dT %+.1f dS %+.1f", dT, dS);
  oled.setCursor(0, 45);
  if (tempAlert || socAlert || cmdAlert)
    oled.printf("ALERT:%s%s%s", tempAlert ? "TEMP " : "", socAlert ? "SOC " : "", cmdAlert ? "CMD" : "");
  else oled.print("No alerts");
  oled.setCursor(0, 54);
  oled.printf("%s MQTT:%s", contactorOpen() ? "Ctr:OPEN" : (tripped ? "TRIP(mon)" : "Ctr:CLOSED"),
              mqtt.connected() ? "ok" : "--");
  oled.display();
}

void publishTelemetry() {
  if (!mqtt.connected()) return;
  const char* names[] = { "SAFE", "WARNING", "ATTACK" };
  String alerts = "";
  if (tempAlert) alerts += "\"TEMP_MISMATCH\",";
  if (socAlert)  alerts += "\"SOC_JUMP\",";
  if (cmdAlert)  alerts += "\"OVERCURRENT_CMD\",";
  if (alerts.length()) alerts.remove(alerts.length() - 1);

  char cmdJson[64];
  if (atkCmd) snprintf(cmdJson, sizeof(cmdJson), "{\"type\":\"SET_CURRENT\",\"value\":%.0f}", cmdA);
  else strcpy(cmdJson, "null");

  char buf[700];
  snprintf(buf, sizeof(buf),
    "{\"t\":%lu,\"V\":%.3f,\"I\":%.3f,\"T\":%.3f,\"SoC\":%.3f,\"P\":%.4f,\"speed\":%d,"
    "\"mode\":\"%s\",\"digitalValid\":true,\"command\":%s,"
    "\"guard\":{\"state\":\"%s\",\"alerts\":[%s],\"contactor_closed\":%s,"
    "\"applied_a\":%.1f,\"limit_a\":%.1f,\"T_expected\":%.2f,\"SoC_expected\":%.2f}}",
    simT, repV, repI, repT, repSoC, repP, speedKmh,
    mode == CHARGE ? "charge" : "drive", cmdJson,
    names[state], alerts.c_str(), contactorOpen() ? "false" : "true",
    appliedA, limitA, modelT, modelSoC);
  mqtt.publish(TOPIC, buf);
}

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 5; i++) pinMode(btnPin[i], INPUT_PULLUP);
  pinMode(PIN_LED_G, OUTPUT); pinMode(PIN_LED_Y, OUTPUT); pinMode(PIN_LED_R, OUTPUT);
  randomSeed(esp_random());
  oled.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  oled.clearDisplay();
  oled.setTextColor(SSD1306_WHITE);
  oled.setCursor(0, 0);
  oled.println("BMS Guard v2 starting");
  oled.display();
  WiFi.begin("Wokwi-GUEST", "", 6);
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setBufferSize(768);
}

void loop() {
  handleButtons();
  ensureMqtt();
  mqtt.loop();
  if (millis() - lastStep >= 1000) {
    lastStep = millis();
    stepSim();
    updateDisplay();
    publishTelemetry();
    Serial.printf("t=%lu %s I=%.1f Trep=%.2f Tmdl=%.2f SoCrep=%.2f SoCmdl=%.2f state=%d\n",
                  simT, mode == CHARGE ? "CHG" : "DRV", trueI, repT, modelT, repSoC, modelSoC, state);
    simT++;
  }
  delay(5);
}