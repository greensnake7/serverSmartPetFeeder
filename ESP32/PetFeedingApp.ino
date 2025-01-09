#include "WiFi.h"
#include <WiFiManager.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>
#include <HX711.h>
#include <time.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

#define PIR_PIN 15
#define SERVO_PIN 13
#define LOADCELL_DT_PIN 27
#define LOADCELL_SCK_PIN 26

Servo myServo;
HX711 loadCell;
LiquidCrystal_I2C lcd(0x27, 16, 2);

const String serverURL = "http://192.168.1.3:3000/api";
const String deviceID= "ESP32_003";


bool autoStatus = true;

String schedule[10];
int scheduleCount = 0;

unsigned long previousReceiveConfig = 0;
const unsigned long interval = 30000;


void setup() { 
  Serial.begin(115200);

  pinMode(PIR_PIN, INPUT);

	myServo.attach(SERVO_PIN, 1000, 2000);

  loadCell.begin(LOADCELL_DT_PIN, LOADCELL_SCK_PIN);
  loadCell.set_scale(208750);
  loadCell.tare();

  lcd.init(); // Khởi tạo LCD
  lcd.backlight(); // Bật đèn nền

  setup_wifi();

  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov");

}

void setup_wifi() {
  WiFiManager wm;
  if (!wm.autoConnect("ESP32-Setup", "00000000")) {
    Serial.println("Không thể kết nối Wi-Fi. ESP32 sẽ khởi động lại.");
    delay(3000);
    ESP.restart();
  }
  while (WiFi.status() != WL_CONNECTED) {
    Serial.println("Đang cố gắng kết nối lại Wi-Fi...");
    delay(1000);
  }
  Serial.println("Địa chỉ IP: "+ WiFi.localIP());
}

String getFormattedTime() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    return "Lỗi lấy thời gian!";
  }
  char buffer[30];
  strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", &timeinfo);
  return String(buffer);
}


void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Mất kết nối WiFi, đang cố gắng kết nối lại...");
    delay(500);
    WiFi.reconnect();
  }

  float weightFood = loadCell.get_units(1);
  delay(1000);
  lcd.setCursor(0,0);
  lcd.print("Thuc an: " + String(weightFood) + " kg ");

  unsigned long currentReceiveConfig = millis();
  if (currentReceiveConfig - previousReceiveConfig >= interval) {
    previousReceiveConfig = currentReceiveConfig;
    receiveConfig(deviceID);
  }

  if(autoStatus){
    autoRun();
    lcd.setCursor(0,1);
    lcd.print("Auto Mode");
  } else {
    runOnASchedule();
    lcd.setCursor(0,1);
    lcd.print("Scheduling Mode");
  }
}

void autoRun(){
  int motionState = digitalRead(PIR_PIN);
  if (motionState == HIGH) {    
      myServo.writeMicroseconds(2000);
      delay(1000);
      myServo.writeMicroseconds(1500);
      delay(2000);
      myServo.writeMicroseconds(1000);
      delay(1000);
      myServo.writeMicroseconds(1500);
      float remainingFood = loadCell.get_units(1);
      Serial.println("Lượng thức ăn còn lại :" + String(remainingFood));
      String triggerType = "MOTION";
      sendData(deviceID, remainingFood, triggerType);
      delay(10000);
  }
}

void runOnASchedule() {
  String currentTime = getFormattedTime();
  for (int i = 0; i < scheduleCount; i++) {
    if (schedule[i] == currentTime.substring(11, 16)) {
      myServo.writeMicroseconds(2000);
      delay(1000);
      myServo.writeMicroseconds(1500);
      delay(2000);
      myServo.writeMicroseconds(1000);
      delay(1000);
      myServo.writeMicroseconds(1500);
      float remainingFood = loadCell.get_units(1);
      Serial.println("Lượng thức ăn còn lại :" + String(remainingFood));
      String triggerType = "SCHEDULE";
      sendData(deviceID, remainingFood, triggerType);
      delay(60000);       
    }
  }
}

void sendData(String deviceID, float remainingFood, String triggerType) {
  if(WiFi.status() == WL_CONNECTED) {
    HTTPClient http; 

    String serverPath = serverURL + "/device/data";

    http.begin(serverPath); 
    http.addHeader("Content-Type", "application/json");
    StaticJsonDocument<200> doc;
    JsonObject root = doc.to<JsonObject>();
    root["deviceID"] = deviceID;
    root["remainingFood"] = remainingFood;
    root["triggerType"] = triggerType;
    String jsonString;
    serializeJson(doc, jsonString);
    int httpResponseCode = http.POST(jsonString);
    if (httpResponseCode == 200) {
      String payload = http.getString();
      Serial.println("Response: " + payload);
    } else {
      Serial.println("Gửi dữ liệu thất bại");
    }
    http.end();
  }
}

void receiveConfig(String deviceID) {
  if(WiFi.status() == WL_CONNECTED){
  HTTPClient http;
  String serverPath = serverURL + "/device/" + deviceID +"/config" ;
  http.begin(serverPath);
  int httpResponseCode = http.GET();

  if (httpResponseCode == 200) {
    String response = http.getString();
    Serial.println("Response : " + response);
    DynamicJsonDocument doc(1024);
    DeserializationError error = deserializeJson(doc, response);
    if (error) {
      Serial.println("Failed to parse JSON!");
      return;
    }
    JsonObject root = doc.as<JsonObject>();
    autoStatus = root["autoStatus"];
    Serial.println("Auto Status: " + String(autoStatus));
    JsonArray scheduleArray = root["schedule"].as<JsonArray>();
    scheduleCount = 0;
    for (JsonObject item : scheduleArray) {
      String time = item["time"].as<String>();
      bool enabled = item["enabled"];

      if(enabled){
        schedule[scheduleCount] = time;  // Lưu thời gian vào schedule
        Serial.println("Schedule " + String(scheduleCount + 1) + ": " + time );
        scheduleCount++; 
      }
    }
  } else {
    Serial.print("Lấy cấu hình thất bại");
    Serial.println(httpResponseCode);
  }

  http.end();
  }
}
