#include "WiFiS3.h"

// ========================================
// WIFI SETTINGS
// ========================================

// Examaple:
// const char ssid[] = "ExampleWiFi";
// const char pass[] = "ExampleMyPassword123";
// const char server[] = "203.0.113.42";

const char ssid[] = "YOUR_WIFI_NAME";
const char pass[] = "YOUR_WIFI_PASSWORD";

int status = WL_IDLE_STATUS;

// ========================================
// SERVER SETTINGS
// ========================================

// IMPORTANT:
// Use your computer's local IPv4 address on the same Wi-Fi network.
// Example: "192.168.1.50"
const char server[] = "YOUR_COMPUTER_IP";
const int serverPort = 3000;

WiFiClient client;

// ========================================
// SENSOR SETTINGS
// ========================================

const int SENSOR_PIN = 2;

int shakeCount = 0;
int previousState = LOW;

// ========================================
// SETUP
// ========================================

void setup() {
  Serial.begin(9600);
  delay(1000);

  pinMode(SENSOR_PIN, INPUT);

  Serial.println("SHAKE SENSOR READY");

  if (WiFi.status() == WL_NO_MODULE) {
    Serial.println("Communication with WiFi module failed!");
    while (true);
  }

  Serial.print("Connecting to SSID: ");
  Serial.println(ssid);

  WiFi.begin(ssid, pass);

  unsigned long startAttemptTime = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("\nWiFi connection failed.");
    while (true);
  }

  Serial.println("\nConnected to Wi-Fi!");
  printCurrentNet();

  randomSeed(analogRead(A0));

  Serial.println("DICE READY!");
}

// ========================================
// LOOP
// ========================================

void loop() {
  int currentState = digitalRead(SENSOR_PIN);

  if (currentState == HIGH && previousState == LOW) {
    shakeCount++;

    int diceRoll = random(1, 7);

    Serial.print("SHAKE ");
    Serial.println(shakeCount);

    Serial.print("DICE ROLL: ");
    Serial.println(diceRoll);

    sendRollToServer(diceRoll);
  }

  previousState = currentState;
  delay(5);
}

// ========================================
// SEND DICE ROLL TO EXPRESS SERVER
// ========================================

void sendRollToServer(int roll) {
  Serial.println("Sending roll to server...");

  if (!client.connect(server, serverPort)) {
    Serial.println("Connection to server failed!");
    return;
  }

  String jsonData = "{\"roll\":" + String(roll) + "}";

  client.println("POST /api/roll HTTP/1.1");
  client.print("Host: ");
  client.println(server);
  client.println("Content-Type: application/json");
  client.print("Content-Length: ");
  client.println(jsonData.length());
  client.println("Connection: close");
  client.println();
  client.println(jsonData);

  unsigned long timeout = millis();

  while (client.connected() && millis() - timeout < 5000) {
    while (client.available()) {
      Serial.write(client.read());
    }
  }

  client.stop();
  Serial.println("\nRoll sent successfully!");
}

// ========================================
// PRINT NETWORK INFORMATION
// ========================================

void printCurrentNet() {
  Serial.print("SSID: ");
  Serial.println(WiFi.SSID());

  long rssi = WiFi.RSSI();
  Serial.print("Signal strength (RSSI): ");
  Serial.println(rssi);

  IPAddress ip = WiFi.localIP();
  Serial.print("IP Address: ");
  Serial.println(ip);
}
