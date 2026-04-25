#include <WiFi.h>
#include <PubSubClient.h>

#define TRIG_PIN 5
#define ECHO_PIN 18
#define BUTTON_PIN 4

const char* ssid = "Isaac"; 
const char* password = "qwertyuIop";
const char* mqtt_server = "broker.hivemq.com";

WiFiClient espClient;
PubSubClient client(espClient);

float threshold = 20.0; // cm

bool ultrasonicEnabled = false;
bool lastButtonState = HIGH;

unsigned long lastTriggerTime = 0;
unsigned long triggerCooldown = 2000;

void setup_wifi() {
  Serial.print("Connecting to WiFi");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT...");

    if (client.connect("ESP32Client")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

float getDistance() {
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

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  setup_wifi();

  client.setServer(mqtt_server, 1883);

  Serial.println("System ready");
  Serial.println("Button toggles ultrasonic sensor ON/OFF");
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }

  client.loop();

  int buttonState = digitalRead(BUTTON_PIN);

  if (lastButtonState == HIGH && buttonState == LOW) {
    ultrasonicEnabled = !ultrasonicEnabled;

    Serial.print("Ultrasonic sensor: ");
    Serial.println(ultrasonicEnabled ? "ON" : "OFF");

    delay(300);
  }

  lastButtonState = buttonState;

  if (ultrasonicEnabled) {
    float distance = getDistance();

    Serial.print("Distance: ");

    if (distance == -1) {
      Serial.println("No reading");
    } else {
      Serial.print(distance);
      Serial.println(" cm");

      if (distance < threshold && millis() - lastTriggerTime > triggerCooldown) {
        Serial.println("Triggered!");

        client.publish("esp32/sensor", "Triggered!");

        lastTriggerTime = millis();
      }
    }
  } else {
    Serial.println("Ultrasonic sensor OFF");
  }

  delay(500);
}
