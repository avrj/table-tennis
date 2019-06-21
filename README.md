[![Build Status](https://travis-ci.org/avrj/table-tennis.svg?branch=master)](https://travis-ci.org/avrj/table-tennis)

# Keeping count of table tennis points
**The idea:**

Keep count of table tennis points with buttons connected to a microcontroller, which passes the points to a MQTT broker via WiFi.
Show the points in real time in a browser window.

**Feature ideas:**
* undoing points
* multiple game modes (like 2/5 serves per player, 11/21 points to win etc.)
* led indicator to indicate wifi+mqtt connection
* game duration timer
* integrating to the original [wunderpong](https://github.com/wunderdogsw/wunderpong) app
    * starting game with the face recognition webcam (to get the names of the players)
    * saving games to the score board
* nice-to-have:
    * wireless buttons (for example 433 mhz)

## MQTT broker for local development
To start the MQTT broker for local development, run: 

`docker run -it -p 1883:1883 -v mosquitto:/mosquitto/config eclipse-mosquitto`

Configuration file for Mosquitto is located at `./mosquitto/mosquitto.conf`

# ESP-32 microcontroller

**Where to buy:**

https://www.aliexpress.com/item/ESP32-Development-Board-WiFi-Bluetooth-Ultra-Low-Power-Consumption-Dual-Cores-ESP-32-ESP-32S/32799710563.html?spm=a2g0s.9042311.0.0.27424c4d0UfrTN

**Drivers for ESP-32:**

https://www.silabs.com/products/development-tools/software/usb-to-uart-bridge-vcp-drivers

**Libraries used:**

https://github.com/knolleary/pubsubclient

https://github.com/evert-arias/EasyButton

**Pinout:**

![ESP32 pinout](esp-32/esp32_pinout.webp)
