import React, { useState, useEffect } from "react";
import "./App.css";
import * as mqtt from "async-mqtt";

const voiceLanguage = "fi-FI";

const gameModes = Object.freeze({
  wunderpong: "wunderpong",
  official: "official"
});

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
  if (voices.length === 0) {
    console.log("Still loading voices list...");
    return;
  }

  const utterThis = new SpeechSynthesisUtterance(text);

  utterThis.voice = voices.find(voice => voice.lang === voiceLanguage);
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
  const [gameMode, setGameMode] = useState(gameModes.wunderpong);
  const [previousDifference, setPreviousDifference] = useState(0);
  const [isMuted, setMuted] = useState(false);
  const [speakServesEnabled, setSpeakServesEnabled] = useState(true);
  const [servesPerPlayer, setServesPerPlayer] = useState(5);
  const [isConnected, setConnected] = useState(false);
  const [playerServe, setPlayerServe] = useState(true);
  const [opponentName, setOpponentName] = useState("pelaaja 2");
  const [homeName, setHomeName] = useState("pelaaja 1");
  const [points, setPoints] = useState({ home: 0, opponent: 0 });

  const speak = text => {
    if (isMuted) {
      return;
    }

    speakText(text);
  };

  const onMessage = async (topic, message) => {
    console.log(`Received message '${message.toString()}' on topic '${topic}'`);

    switch (message.toString()) {
      case "opponent":
        addOpponentPoint();
        break;
      case "home":
        addHomePoint();
        break;
      case "opponent_undo":
        undoOpponentPoint();
        break;
      case "home_undo":
        undoHomePoint();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      gameMode === gameModes.official &&
      points.home >= 10 &&
      points.opponent >= 10
    ) {
      setServesPerPlayer(1);
    }

    speakStatus();

    const serveHasChanged =
      points.home + points.opponent > 0 &&
      (points.home + points.opponent) % servesPerPlayer === 0;

    if (serveHasChanged) {
      if (speakServesEnabled)
        speak(`Syöttövuorossa ${!playerServe ? homeName : opponentName}`);

      setPlayerServe(serve => !serve);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const speakStatus = () => {
    setPreviousDifference(Math.abs(points.home - points.opponent));

    if (points.home === 0 && points.opponent === 0) {
      return;
    }

    if (points.home === points.opponent) {
      speak(`tasapeli ${points.home} - ${points.opponent}`);
    } else if (points.home > points.opponent && previousDifference === 0) {
      speak(`${homeName} siirtyi johtoon ${points.home} - ${points.opponent}`);
    } else if (points.opponent > points.home && previousDifference === 0) {
      speak(
        `${opponentName} siirtyi johtoon ${points.home} - ${points.opponent}`
      );
    } else {
      speak(`tilanne ${points.home} - ${points.opponent}`);
    }
  };

  const addHomePoint = () => {
    setPoints(points => ({ home: points.home + 1, opponent: points.opponent }));
  };

  const addOpponentPoint = () => {
    setPoints(points => ({ home: points.home, opponent: points.opponent + 1 }));
  };

  const undoHomePoint = () => {
    setPoints(points => {
      if (points.home === 0) {
        return points;
      }

      return {
        home: points.home - 1,
        opponent: points.opponent
      };
    });
  };

  const undoOpponentPoint = () => {
    setPoints(points => {
      if (points.opponent === 0) {
        return points;
      }

      return {
        home: points.home,
        opponent: points.opponent - 1
      };
    });
  };

  const startNewGame = () => {
    setPoints({ home: 0, opponent: 0 });

    speak("Aloitetaan uusi peli");

    const whichOneStartsTheGame = Boolean(getRandomInt(2));

    speak(
      `${whichOneStartsTheGame ? homeName : opponentName} saa aloittaa pelin`
    );

    setPlayerServe(whichOneStartsTheGame);
  };

  const gameHasStarted = points.home > 0 || points.opponent > 0;

  return isConnected ? (
    <div className="App">
      <h1 className={"header"}>
        <div style={{ width: "80px", marginRight: "10px" }}>
          {playerServe && (
            <img
              alt={""}
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
          <strong style={{ fontSize: "40pt" }}>{points.home}</strong>
        </div>{" "}
        <div className={"vs"}>VS</div>{" "}
        <div>
          {opponentName}
          <br />
          <strong style={{ fontSize: "40pt" }}>{points.opponent}</strong>
        </div>
        <div style={{ width: "80px", marginLeft: "10px" }}>
          {!playerServe && (
            <img
              alt={""}
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
      Game mode:{" "}
      <input
        disabled={gameHasStarted}
        type="radio"
        name="game_mode"
        value={gameModes.wunderpong}
        onChange={e => {
          setServesPerPlayer(5);
          setGameMode(e.currentTarget.value);
        }}
        checked={gameMode === gameModes.wunderpong}
      />{" "}
      Wunderpong (5 serves){" "}
      <input
        type="radio"
        name="game_mode"
        value={gameModes.official}
        checked={gameMode === gameModes.official}
        onChange={e => {
          setServesPerPlayer(2);
          setGameMode(e.currentTarget.value);
        }}
        disabled={gameHasStarted}
      />{" "}
      Official (2 serves, after 10-10 one serve)
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
