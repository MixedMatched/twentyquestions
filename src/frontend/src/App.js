import React, { useState, } from 'react';
import socketIOClient from 'socket.io-client';
import './App.css';

var room = '0';
var name = 'Guest';

var socket = socketIOClient('http://localhost:5000/');

function App() {
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState('');
  const [winStatus, setWinStatus] = useState(false);
  const [textRoom, setRoom] = useState(0);
  const [textName, setName] = useState('Guest');

  socket.on('connect', () => {
    if(room === '0') {
      console.log("room was 0, setting to " + socket.id);
      room = socket.id;
      setRoom(socket.id);
    }
  });

  socket.on('question_reply', (reply) => {
    console.log("question reply");
    setHistory((hist) => [...hist, reply]);
  });

  socket.on('guess_reply', (reply) => {
    setWinStatus(reply.correct);
    setHistory((hist) => [...hist, reply]);
  });

  socket.on('history', (reply) => {
    setHistory(reply.history);
  });

  const sendQuestion = async (question, history) => {
    console.log("sending question");
    socket.emit(
        "question", 
        {
          'question': question,
          'history': history,
          'room': room,
          'name': name
        },
    );
  }

  const sendGuess = async (guess) => {
    socket.emit(
        "guess", 
        {
          'guess': guess,
          'room': room,
          'name': name
        },
    );
  }

  const joinRoom = (room, name) => {
    socket.emit(
        "join",
        {
          'room': room,
          'name': name
        }
    );
  }

  const handleAsk = (e) => {
    console.log("ask");
    e.preventDefault();
    sendQuestion(question, history);
    setQuestion('');
  }

  const handleGuess = (e) => {
    console.log("guess");
    e.preventDefault();
    sendGuess(question);
    setQuestion('');
  }

  const resetGame = () => {
    setHistory([]);
    setWinStatus(false);
  }

  const handleRoomChange = (e) => {
    console.log("room change");
    e.preventDefault();
    joinRoom(textRoom, textName);
    room = textRoom;
    name = textName;
    setRoom('');
    setName('');
    resetGame();
  }

  let historyAsList = Object.entries(history).map(([index, hist]) => {
    console.log("i hate javascript: index -> " + index + " history data thing => " + hist.name + hist.question)
    if (hist.type === 'question') {
      return <li key={index}>{hist.name} asked: "{hist.question}" which was replied to with "{hist.answer}"</li>
    } else if (hist.type === 'guess') {
      return <li key={index}>{hist.name} guessed: {hist.guess}, which was {hist.correct ? "" : "not "}correct</li>
    } else {
      return <li key={index}>error</li>;
    }
  });

  return (
    <div className="App">
      <header className="App-header">
        <p>{winStatus ? "Winner!" : ""}</p>
        <ul>{historyAsList}</ul>
        <div>
          <form onSubmit={handleAsk}>
            <input type="text" value = {question} onChange={(e) => setQuestion(e.target.value)}></input>
            <button type="submit" onClick={handleAsk}>Ask</button>
            <button type="submit" onClick={handleGuess}>Guess</button>
          </form>
        </div>
        <div>
          <form onSubmit={handleRoomChange}>
            <input type="text" value = {textRoom} onChange={(e) => setRoom(e.target.value)}></input>
            <input type="text" value = {textName} onChange={(e) => setName(e.target.value)}></input>
            <button type="submit" onClick={handleRoomChange}>Join Room</button>
          </form>
        </div>
      </header>
    </div>
  );
}

export default App;
