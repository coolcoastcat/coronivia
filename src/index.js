import React from 'react';
import ReactDOM from 'react-dom';
import logo from './logo.png';
import './index.css';
import { Button } from "./components/Button"

class Square extends React.Component {
  render() {
    return (
      <button className="square">
        {/* TODO */}
      </button>
    );
  }
}

class Game extends React.Component {
  renderSquare(i) {
    return <Square />;
  }

  render() {

    const title = 'Welcome to Coronivia!'
    return (
      <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div>
          <div >{title}</div>
          <Button onClick={() => {console.log("Clicked on Create Game")}}
           type="button" 
           buttonSize="btn--medium"
           buttonStyle='btn--success--outline'>Create Game</Button>&nbsp;
          <Button onClick={() => {console.log("Clicked on Join Game")}}
           type="button" 
           buttonSize="btn--medium"
           buttonStyle='btn--success--solid'>Join Game</Button>
       </div>
      </header>
    </div>
      
    );
  }
}

class GameManager extends React.Component {
  render() {
    return (
      <div className="game-manager">
        <div className="game">
          <Game />
        </div>
        <div className="game-info">
          <div>{/* status */}</div>
          <ol>{/* TODO */}</ol>
        </div>
      </div>
    );
  }
}

// ========================================

ReactDOM.render(
  <GameManager />,
  document.getElementById('root')
);

