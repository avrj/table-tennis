import React, { useState, useEffect } from "react";
import "./App.css";
import * as mqtt from "async-mqtt";

const refreshTimer = () => {
  if (new Date().getHours() === 5) {
    window.location.reload();
  }
};

setInterval(refreshTimer, 1000 * 60 * 60);

const synth = window.speechSynthesis;

let voices = [];

const populateVoiceList = () => {
  voices = synth.getVoices();
};

populateVoiceList();

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = populateVoiceList;
}

const getRandomInt = max => {
  return Math.floor(Math.random() * Math.floor(max));
};

const speakText = text => {
  const utterThis = new SpeechSynthesisUtterance(text);

  utterThis.voice = voices[34]; // Finnish
  utterThis.pitch = 1;
  utterThis.rate = 1;

  synth.speak(utterThis);
};

const host = process.env.REACT_APP_MQTT_HOST;
const port = process.env.REACT_APP_MQTT_PORT;

const mqttOptions = {
  port,
  clientId:
    "mqttjs_" +
    Math.random()
      .toString(16)
      .substr(2, 8),
  username: process.env.REACT_APP_MQTT_USERNAME,
  password: process.env.REACT_APP_MQTT_PASSWORD
};

const App = () => {
  const [previousErotus, setPreviousErotus] = useState(0);
  const [isMuted, setMuted] = useState(false);
  const [speakServesEnabled, setSpeakServesEnabled] = useState(true);
  const [servesPerPlayer, setServesPerPlayer] = useState(5);
  const [isConnected, setConnected] = useState(false);
  const [playerServe, setPlayerServe] = useState(true);
  const [pointsHome, setHome] = useState(0);
  const [pointsOpponent, setOpponent] = useState(0);
  const [opponentName, setOpponentName] = useState("pelaaja 2");
  const [homeName, setHomeName] = useState("pelaaja 1");

  const speak = text => {
    if (isMuted) {
      return;
    }

    speakText(text);
  };

  const onMessage = async (topic, message) => {
    switch (message.toString()) {
      case "opponent":
        addOpponentPoint();
        break;
      case "home":
        addHomePoint();
        break;
      case "reset":
        startNewGame();
        break;
      case "refresh":
        window.location.reload();
        break;
      default:
    }
  };

  const onError = async error => {
    console.error(error);
  };

  useEffect(() => {
    const client = mqtt.connect(host, mqttOptions);

    const onConnect = async () => {
      try {
        setConnected(true);

        await client.subscribe("esp/test");

        client.on("message", onMessage);
      } catch (e) {
        console.log(e.stack);
      }
    };

    client.on("connect", onConnect);
    client.on("error", onError);
  }, []);

  useEffect(() => {
    speakStatus();

    const serveHasChanged =
      pointsHome + pointsOpponent > 0 &&
      (pointsHome + pointsOpponent) % servesPerPlayer === 0;

    if (serveHasChanged) {
      if (speakServesEnabled)
        speak(`Lyöntivuorossa ${!playerServe ? homeName : opponentName}`);

      setPlayerServe(serve => !serve);
    }
  }, [pointsHome, pointsOpponent]);

  const speakStatus = () => {
    setPreviousErotus(Math.abs(pointsHome - pointsOpponent));
    if (pointsHome === pointsOpponent) {
      speak(`tasapeli ${pointsHome} - ${pointsOpponent}`);
    } else if (pointsHome > pointsOpponent && previousErotus === 0) {
      speak(
        `${homeName} siirtyi johtoon. tilanne ${pointsHome} - ${pointsOpponent}`
      );
    } else if (pointsOpponent > pointsHome && previousErotus === 0) {
      speak(
        `${opponentName} siirtyi johtoon. tilanne ${pointsHome} - ${pointsOpponent}`
      );
    } else {
      speak(`tilanne ${pointsHome} - ${pointsOpponent}`);
    }
  };

  const addHomePoint = () => {
    setHome(points => points + 1);
  };

  const addOpponentPoint = () => {
    setOpponent(points => points + 1);
  };

  const startNewGame = () => {
    setHome(0);
    setOpponent(0);

    speak("Aloitetaan uusi peli");
    speak("Arvotaan pelin aloittaja");

    const whichOneStartsTheGame = Boolean(getRandomInt(2));

    speak(
      `${whichOneStartsTheGame ? homeName : opponentName} saa aloittaa pelin`
    );

    setPlayerServe(whichOneStartsTheGame);
  };

  return isConnected ? (
    <div className="App">
      <h1 className={"header"}>
        <div style={{ width: "80px", marginRight: "10px" }}>
          {playerServe && (
            <img
              style={{ width: "100%" }}
              src={
                "https://upload.wikimedia.org/wikipedia/commons/8/8d/Table_tennis.svg"
              }
            />
          )}
        </div>
        <div>
          {homeName}
          <br />
          <strong style={{ fontSize: "40pt" }}>{pointsHome}</strong>
        </div>{" "}
        <div className={"vs"}>VS</div>{" "}
        <div>
          {opponentName}
          <br />
          <strong style={{ fontSize: "40pt" }}>{pointsOpponent}</strong>
        </div>
        <div style={{ width: "80px", marginLeft: "10px" }}>
          {!playerServe && (
            <img
              style={{ width: "100%" }}
              src={
                "https://upload.wikimedia.org/wikipedia/commons/8/8d/Table_tennis.svg"
              }
            />
          )}
        </div>
      </h1>
      <br />
      <button onClick={() => addHomePoint()}>Piste kotiin</button>{" "}
      <button onClick={() => addOpponentPoint()}>Piste vastustajalle</button>
      <br />
      <input
        type={"text"}
        onChange={e => setHomeName(e.target.value)}
        value={homeName}
      />{" "}
      vs{" "}
      <input
        type={"text"}
        onChange={e => setOpponentName(e.target.value)}
        value={opponentName}
      />
      <button onClick={() => startNewGame()}>Aloita uusi peli</button>
      <br />
      Settings:
      <br />
      Serves per player:{" "}
      <input
        type={"text"}
        onChange={e => setServesPerPlayer(e.target.value)}
        value={servesPerPlayer}
      />
      <br />
      Speak serves:
      <input
        type="checkbox"
        checked={speakServesEnabled}
        onChange={e => setSpeakServesEnabled(e.target.checked)}
      />
      <br />
      Mute sounds:
      <input
        type="checkbox"
        checked={isMuted}
        onChange={e => setMuted(e.target.checked)}
      />
      <br />
      <p>
        <strong>
          To start a new game, long press the small silver button (located above
          the big button) for 2 seconds
        </strong>
      </p>
    </div>
  ) : (
    <div className="App">
      Connecting to {host}:{port}
    </div>
  );
};

export default App;
