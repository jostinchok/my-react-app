#include <WiFi.h>
#include <PubSubClient.h>

// =========================================================
// CTIP IoT Proximity Sensor Prototype
// Detects an object getting close to a protected plant zone.
// Publishes a JSON alert payload through MQTT.
// =========================================================

#define TRIG_PIN 5
#define ECHO_PIN 18
#define BUTTON_PIN 4

// ---------------------------------------------------------
// WiFi configuration
// Replace these before local testing.
// Do NOT commit real WiFi credentials into GitHub.
// ---------------------------------------------------------
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// ---------------------------------------------------------
// MQTT configuration
// Public broker is acceptable for prototype testing only.
// For production, use authenticated/private MQTT.
// ---------------------------------------------------------
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;
const char* mqtt_client_id = "CTIP-PlantZone01-ESP32";
const char* mqtt_topic = "ctip/sensor/plant-zone-01/proximity";

// ---------------------------------------------------------
// Sensor metadata
// Keep these aligned with admin/database incident records.
// ---------------------------------------------------------
const char* sensor_id = "plant-zone-01";
const char* location_name = "Plant Zone 01";
const char* event_type = "ObjectCloseToPlant";

WiFiClient espClient;
PubSubClient client(espClient);

float threshold_cm = 20.0;
bool ultrasonicEnabled = false;
bool lastButtonState = HIGH;

unsigned long lastTriggerTime = 0;
unsigned long triggerCooldown = 5000; // milliseconds

// =========================================================
// WiFi and MQTT helpers
// =========================================================
void setup_wifi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi connected. IP: ");
  Serial.println(WiFi.localIP());
}

void reconnect_mqtt() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");

    if (client.connect(mqtt_client_id)) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(". Retrying in 2 seconds.");
      delay(2000);
    }
  }
}

// =========================================================
// Ultrasonic sensor helpers
// =========================================================
float getDistanceOnce() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);

  if (duration == 0) {
    return -1;
  }

  return duration * 0.034 / 2;
}

float getAverageDistance(int samples = 5) {
  float total = 0.0;
  int validCount = 0;

  for (int i = 0; i < samples; i++) {
    float d = getDistanceOnce();
    if (d > 0) {
      total += d;
      validCount++;
    }
    delay(40);
  }

  if (validCount == 0) {
    return -1;
  }

  return total / validCount;
}

// =========================================================
// Publish incident payload
// =========================================================
void publishProximityAlert(float distance_cm) {
  char payload[512];

  snprintf(
    payload,
    sizeof(payload),
    "{\"source\":\"IOT_SENSOR\","
    "\"event_type\":\"%s\","
    "\"sensor_id\":\"%s\","
    "\"location\":\"%s\","
    "\"distance_cm\":%.2f,"
    "\"threshold_cm\":%.2f,"
    "\"status\":\"triggered\","
    "\"severity\":\"low\"}",
    event_type,
    sensor_id,
    location_name,
    distance_cm,
    threshold_cm
  );

  bool ok = client.publish(mqtt_topic, payload);

  Serial.print("MQTT topic: ");
  Serial.println(mqtt_topic);
  Serial.print("MQTT payload: ");
  Serial.println(payload);
  Serial.print("Publish success: ");
  Serial.println(ok ? "true" : "false");
}

// =========================================================
// Setup
// =========================================================
void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  setup_wifi();
  client.setServer(mqtt_server, mqtt_port);

  Serial.println("System ready.");
  Serial.println("Button toggles ultrasonic sensor ON/OFF.");
  Serial.print("Sensor ID: ");
  Serial.println(sensor_id);
  Serial.print("Location: ");
  Serial.println(location_name);
  Serial.print("Threshold: ");
  Serial.print(threshold_cm);
  Serial.println(" cm");
}

// =========================================================
// Main loop
// =========================================================
void loop() {
  if (!client.connected()) {
    reconnect_mqtt();
  }

  client.loop();

  int buttonState = digitalRead(BUTTON_PIN);

  if (lastButtonState == HIGH && buttonState == LOW) {
    ultrasonicEnabled = !ultrasonicEnabled;

    Serial.print("Ultrasonic sensor: ");
    Serial.println(ultrasonicEnabled ? "ON" : "OFF");

    delay(300); // debounce
  }

  lastButtonState = buttonState;

  if (ultrasonicEnabled) {
    float distance = getAverageDistance(5);

    Serial.print("Average distance: ");

    if (distance == -1) {
      Serial.println("No valid reading");
    } else {
      Serial.print(distance);
      Serial.println(" cm");

      if (distance < threshold_cm && millis() - lastTriggerTime > triggerCooldown) {
        Serial.println("Object close to protected plant zone detected.");
        publishProximityAlert(distance);
        lastTriggerTime = millis();
      }
    }
  } else {
    Serial.println("Ultrasonic sensor OFF");
  }

  delay(500);
}
