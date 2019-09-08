
#include <WiFi.h>
#include <PubSubClient.h>

#include <RCSwitch.h>

RCSwitch mySwitch = RCSwitch();

#define HOME_LED 16
#define OPPONENT_LED 17

const char* ssid = "";
const char* password =  "";
const char* mqttServer = "";
const int mqttPort = 10532;
const char* mqttUser = "";
const char* mqttPassword = "";


unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 1000;

unsigned long check_wifi = 30000;

WiFiClient espClient;
PubSubClient client(espClient);

// Callback function to be called when the button is pressed.
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
  // Initialize Serial for debugging purposes.
  Serial.begin(300);
  
  WiFi.begin(ssid, password);

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
  mySwitch.enableReceive(13);
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

  if (mySwitch.available()) { 
    int value = mySwitch.getReceivedValue();


  if ((millis() - lastDebounceTime) > debounceDelay) {
    
    if(value == 11469281) {
      onHomePressed();
    } else if(value == 1885089) {
      onOpponentPressed();
    }
    
    lastDebounceTime = millis();
  } else {
    Serial.print("debounce");
  }

    mySwitch.resetAvailable();
  }
  
  client.loop();
}
