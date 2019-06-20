#include <WiFi.h>
#include <PubSubClient.h>
#include <EasyButton.h>

#define HOME_BUTTON_PIN 5
#define HOME_RESET_BUTTON_PIN 23
#define OPPONENT_BUTTON_PIN 18
#define OPPONENT_RESET_BUTTON_PIN 19

#define HOME_LED 16
#define OPPONENT_LED 17

const char* ssid = "";
const char* password =  "";
const char* mqttServer = "";
const int mqttPort = 10532;
const char* mqttUser = "";
const char* mqttPassword = "";

unsigned long check_wifi = 30000;
 
WiFiClient espClient;
PubSubClient client(espClient);

EasyButton home_button(HOME_BUTTON_PIN);
EasyButton home_reset_button(HOME_RESET_BUTTON_PIN);
EasyButton opponent_button(OPPONENT_BUTTON_PIN);
EasyButton opponent_reset_button(OPPONENT_RESET_BUTTON_PIN);

void onHomePressed() {
  Serial.println("Home button has been pressed!");
  client.publish("esp/test", "home");
}

void onUndoHomePressed() {
  Serial.println("Undo home button has been pressed!");
  client.publish("esp/test", "home_undo");
}


void onOpponentPressed() {
  Serial.println("Opponent button has been pressed!");
  client.publish("esp/test", "opponent");
}


void onUndoOpponentPressed() {
  Serial.println("Undo opponent button has been pressed!");
  client.publish("esp/test", "opponent_undo");
}

void onPressedForDuration() {
  Serial.println("Reset button has been pressed!");
  client.publish("esp/test", "reset");
}

void setup() {
  pinMode(HOME_LED, OUTPUT);
  pinMode(OPPONENT_LED, OUTPUT);
  // Initialize Serial for debuging purposes.
  Serial.begin(115200);
  
  WiFi.begin(ssid, password);

  home_button.begin();
  home_reset_button.begin();
  opponent_button.begin();
  opponent_reset_button.begin();

  home_button.onPressed(onHomePressed);
  home_reset_button.onPressed(onUndoHomePressed);
  opponent_button.onPressed(onOpponentPressed);
  home_reset_button.onPressedFor(2000, onPressedForDuration);
  opponent_reset_button.onPressed(onUndoOpponentPressed);
  opponent_reset_button .onPressedFor(2000, onPressedForDuration);
 
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi..");
    //digitalWrite(OPPONENT_LED, HIGH);
    //digitalWrite(HOME_LED, HIGH);
    delay(1000);
    digitalWrite(OPPONENT_LED, LOW);
    digitalWrite(HOME_LED, LOW);
  }
 
  Serial.println("Connected to the WiFi network");
 
  client.setServer(mqttServer, mqttPort);
 
  connectToMQTT();
}

void connectToMQTT() {
  while (!client.connected()) {
    delay(500);
    Serial.println("Connecting to MQTT...");
     //digitalWrite(OPPONENT_LED, HIGH);
    //digitalWrite(HOME_LED, HIGH);
    delay(500);
    digitalWrite(OPPONENT_LED, LOW);
    digitalWrite(HOME_LED, LOW);
    
    if (client.connect("ESP32Client", mqttUser, mqttPassword )) {
 
      Serial.println("connected");
 
    } else {
 
      Serial.print("failed with state ");
      Serial.print(client.state());
      delay(2000);
 
    }
  }
}

void loop() {
   if ((WiFi.status() != WL_CONNECTED) && (millis() > check_wifi)) {
    Serial.println("Reconnecting to WiFi...");
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    check_wifi = millis() + 30000;
  }
  
   if (!client.connected()) {
    connectToMQTT();
  }
  
  // Continuously read the status of the button. 
  home_button.read();
  home_reset_button.read();
  opponent_button.read();
  opponent_reset_button.read();
  client.loop();
}
