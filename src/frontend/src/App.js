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
color: white;
background-color: rgb(51,51,51,100);
width: 20%
font-size: 40px;
padding: 14px 40px;
border-radius: 10px;
margin: 10px 0px;
cursor: pointer;
`;

const Input = styled.input`
color: white;
background-color: rgb(51,51,51,100);
width: 60%;
font-size: 20px;
padding: 10px 40px;
border-radius: 10px;
margin: 5px 0px;
`;

function getColor(answer) {
  if(answer.toLowerCase().includes("yes")) {
    return "green";
  } else if (answer.toLowerCase().includes("no") && !answer.toLowerCase().includes("not")) {
    return "red";
  } else {
    return "white";
  }
}

function makePopUp(tri, head, strs, inputs) {
  return <Popup
    trigger={tri}
    modal
    nested
  >
    {close => (
      <div className="modal">
        <button className="close" onClick={close}>
          &times;
        </button>
        <div className="header"> {head} </div>
        <div className="content">
          {strs.map((str) => {return <div>{str}<br /></div>;})}
        </div>
        <div className="actions">
          {inputs}
        </div>
      </div>
    )}
  </Popup>
}

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

  const handleRoomCreate = (e) => {
    e.preventDefault();
    setRoom(socket.id);
    room = socket.id;
    name = textName;
    setName('');
    resetGame();
  }

  let historyAsList = Object.entries(history).reverse().map(([index, hist]) => {
    console.log("i hate javascript: index -> " + index + " history data thing => " + hist.name + hist.question)
    if (hist.type === 'question') {
      return <p><div class="left">({index}) [{hist.name}]: {hist.question} </div> <div class="right" style={{color: getColor(hist.answer)}}>{hist.answer}</div></p>
    } else if (hist.type === 'guess') {
      return <p><div class="left">({index}) [{hist.name}]: Guessed {hist.guess} </div> <div class="right">{hist.correct ? "Correct!":"Incorrect"}</div></p>
    } else {
      return <p key={index}>error</p>;
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
            {makePopUp(<a href="#friends">Play with Friends</a>, 'Play with Friends', 
              ['To win, guess the word using only yes or no questions.',
              'If you think you know the word, type it in and press the "Guess" button.'], 
              [<button onClick={handleRoomCreate}>Create Game</button>, 
              <button onClick={handleRoomChange}>Join Game</button>, 
              <input type="text" placeholder="Room ID" value={textRoom} onChange={e => setRoom(e.target.value)}/>, 
              <input type="text" placeholder="Name" value={textName} onChange={e => setName(e.target.value)}/>])}
            {makePopUp(<a href="#settings">Settings</a>, 'Settings', 
              ['To win, guess the word using only yes or no questions.',
              'If you think you know the word, type it in and press the "Guess" button.'], [])}
            {makePopUp(<a href="#How to play"> How to Play </a>, 'How to Play', 
              ['To win, guess the word using only yes or no questions.',
              'If you think you know the word, type it in and press the "Guess" button.'], [])}
            {makePopUp(<a href="#about">About</a>, 'About', 
              ['Made by Northeastern students using GPT3',
              'Credits: Alessandra Simmons, Riley Platz, and some other guy and also someone else'], [])}
              
          </div>
        </div>
        <div class="playarea">
          {winStatus ? <p> {winBox()} </p> : ""}
          <div>
            <form onSubmit={handleAsk}>
              <Input type="text" value = {question} onChange={(e) => setQuestion(e.target.value)}></Input>
              <Button type="submit" onClick={handleAsk}>Ask</Button>
              <Button type="submit" onClick={handleGuess}>Guess</Button>
            </form>
          </div>
          {historyAsList}
        </div>
      </header>
    </div>
  );
}

/*
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
*/

export default App;