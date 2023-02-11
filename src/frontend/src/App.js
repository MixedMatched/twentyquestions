import React, { useState, } from 'react';
import styled from 'styled-components';
import socketIOClient from 'socket.io-client';
import './App.css';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize'

var room = '0';
var name = 'Guest';

var socket = socketIOClient('http://localhost:5000/', {
  withCredentials: true,
});

// Creating a custom hook
function useInput(defaultValue) {
  const [value, setValue] = useState(defaultValue);
  function onChange(e) {
    setValue(e.target.value);
  }
  return {
    value,
    onChange,
  };
}

const Button = styled.button`
background-color: black;
color: white;
font-size: 20px;
padding: 10px 60px;
border-radius: 5px;
margin: 10px 0px;
cursor: pointer;
`;

const Input = styled.input`
background-color: black;
color: white;
font-size: 20px;
padding: 10px 60px;
border-radius: 5px;
margin: 10px 0px;
`;

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
    setHistory(() => {
      console.log(history);
      return [...history, reply];
    });
  });

  socket.on('guess_reply', (reply) => {
    setWinStatus(reply.correct);
    setHistory(() => [...history, reply]);
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
    socket.emit(
      "request_history",
      {
        'room': room,
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

  let historyAsList = Object.entries(history).reverse().map(([index, hist]) => {
    console.log("i hate javascript: index -> " + index + " history data thing => " + hist.name + hist.question)
    if (hist.type === 'question') {
      return <li key={index} style={{color: hist.answer=== "Yes." ? "green" : hist.answer === "No." ? "red" : "white" }}>
        {hist.name} asked: "{hist.question}" which was replied to with "{hist.answer}"</li>
    } else if (hist.type === 'guess') {
      return <li key={index}>{hist.name} guessed: {hist.guess}, which was {hist.correct ? "" : "not "}correct</li>
    } else {
      return <li key={index}>error</li>;
    }
  });

  const inputProps = useInput();
  const { width, height } = useWindowSize();


  return (
    <div className="App">
      <header className="App-header">
        <p>{winStatus ? <Confetti width={width} height={height}/> : ""}</p>
        <div>
          <form onSubmit={handleAsk}>
            <Input type="text" value = {question} onChange={(e) => setQuestion(e.target.value)}></Input>
            <Button type="submit" onClick={handleAsk}>Ask</Button>
            <Button type="submit" onClick={handleGuess}>Guess</Button>
          </form>
        </div>
        <div>
          <form onSubmit={handleRoomChange}>
            <Input type="text" value = {textRoom} onChange={(e) => setRoom(e.target.value)}></Input>
            <Input type="text" value = {textName} onChange={(e) => setName(e.target.value)}></Input>
            <Button type="submit" onClick={handleRoomChange}>Join Room</Button>
          </form>
        </div>
        <ul>{historyAsList}</ul>
      </header>
    </div>
  );
}

export default App;