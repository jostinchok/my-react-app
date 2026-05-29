#pragma once

// Copy this file to arduino_secrets.h before flashing the ESP32.
// Keep arduino_secrets.h local only. Do not commit real WiFi passwords or tokens.

#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// Match this with IOT_SENSOR_TOKEN in your local .env when
// DEVICE_TOKEN_AUTH_ENABLED=true. Leave as a placeholder for basic demo mode.
#define IOT_SENSOR_DEVICE_TOKEN "YOUR_IOT_SENSOR_TOKEN"
