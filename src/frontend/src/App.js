import React, { useState, } from 'react';
import styled from 'styled-components';
import socketIOClient from 'socket.io-client';
import './App.css';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize'
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';

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
padding: 10px 40px;
border-radius: 5px;
margin: 10px 0px;
cursor: pointer;
`;

const Input = styled.input`
background-color: black;
color: white;
font-size: 20px;
padding: 10px 225px;
border-radius: 5px;
margin: 10px 0px;
`;

function App() {
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState('');
  const [winStatus, setWinStatus] = useState(false);
  const [winWord, setWinWord] = useState('');
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
    if (reply.correct) {
      setWinStatus(reply.correct);
      setWinWord(reply.guess)
    }
    setHistory(() => [...history, reply]);
  });

  socket.on('history', (reply) => {
    setHistory(reply.history);
  });

  socket.on('reset', (reply) => {
    setHistory([]);
    setWinStatus(false);
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

  const resetGame = () => {
    socket.emit(
      "reset",
      {
        'room': room,
      }
    )
  }

  const handleReset = (e) => {
    console.log("reset");
    e.preventDefault();
    resetGame();
    setHistory([]);
    setWinStatus(false);
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

  const handleRoomChange = (e) => {
    console.log("room change");
    e.preventDefault();
    joinRoom(textRoom, textName);
    room = textRoom;
    name = textName;
    setRoom('');
    setName('');
    setHistory([]);
    setWinStatus(false);
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

  const winBox = () => 
  <article>
    <Confetti width={width} height={height}/>
    <h2>Winner!</h2>
    <p>The word was {winWord}.</p>
    <p>You got the correct word in {history.length} tries.</p>
    <Button type="submit" onClick={handleReset}>Try again?</Button>
  </article>

  return (
    <div className="App">
      <header className="App-header">
        <div class="topnav">
          SOMETHINGLE
          <div class="right">
            <a href="#friends">Play with Friends</a>
            <a href="#settings">Settings</a>
            <Popup
            trigger={<a href="#How to play"> How to Play </a>}
            modal
            nested
          >
            {close => (
              <div className="modal">
                <button className="close" onClick={close}>
                  &times;
                </button>
                <div className="header"> How to Play </div>
                <div className="content">
                  {' '}
                  To win, guess the word using only yes or no questions.  
                  <br />
                  If you think you know the word, type it in and press the 'Guess' button.
                </div>
                <div className="actions">
                  <Popup
                    trigger={<button className="button"> Trigger </button>}
                    position="top center"
                    nested
                  >
                  </Popup>
                </div>
              </div>
            )}
          </Popup>
            <a href="#about">About</a>
          </div>
        </div> 
        {winStatus ? <p>winBox()</p> : ""}
        <div>
          <form onSubmit={handleAsk}>
            <Input type="text" value = {question} onChange={(e) => setQuestion(e.target.value)}></Input>
            <Button type="submit" onClick={handleAsk}>Ask</Button>
            <Button type="submit" onClick={handleGuess}>Guess</Button>
          </form>
        </div>
        <ul>{historyAsList}</ul>
      </header>
    </div>
  );
}

export default App;