import React from 'react';
import './forms.css';
import _ from 'lodash';
import { Button } from "./Button"


export class CreateGameForm extends React.Component {
    constructor(props) {
      super(props);
      this.MAX_ROUNDS = 10;
      this.MAX_QUESTIONS_PER_ROUND = 50;
      this.DIFFICULTIES = ["any","easy","medium","hard"];
      this.state = {difficulty: 'any',
                    rounds: 1,
                    questions: 1,
                    owner: ''
                    };
      this.createGameResponse = '';
  
      this.handleRoundsChange = this.handleRoundsChange.bind(this);
      this.handleOwnerChange = this.handleOwnerChange.bind(this);
      this.handleQuestionsChange = this.handleQuestionsChange.bind(this);
      this.handleDifficultyChange = this.handleDifficultyChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    handleRoundsChange(event) {
      this.setState({rounds: event.target.value});
      console.log('set rounds to: '+event.target.value);
    }
    
    handleQuestionsChange(event) {
      this.setState({questions: event.target.value});
      console.log('set questions to: '+event.target.value);
    }
  
    handleDifficultyChange(event) {
      this.setState({difficulty: event.target.value});
      console.log('set difficulty to: '+event.target.value);
    }
  
    handleOwnerChange(event) {
      this.setState({owner: event.target.value});
    }
  
    handleSubmit(event) {
      var submission = {
        questions: this.state.questions,
        rounds: this.state.rounds,
        difficulty: this.state.difficulty,
        owner: this.state.owner
      };
      
      this.props.handleFormSubmit(submission);  
      event.preventDefault();
    }
    render() {
      return (
        <div>
        <div >Create a New Game</div>
  
        <form onSubmit={this.handleSubmit}>
        <div id="content-body-wrapper">
          <div id="content-body">
            <div id="labels-column">
            <label>
                Number of Rounds:
              </label>
              </div>
            <div id="form-column">
                <select name="rounds" value={this.state.rounds} onChange={this.handleRoundsChange} >
                    { _.range(1, this.MAX_ROUNDS + 1).map(value => <option key={value} value={value}>{value}</option>) }
                </select>
              </div>
            </div>
            <div id="content-body">
              <div id="labels-column">
              <label>
                Number of Questions Per Round:
              </label>
              </div>
              <div id="form-column">
                <select name="amount"  value={this.state.questions} onChange={this.handleQuestionsChange} >
                { _.range(1, this.MAX_QUESTIONS_PER_ROUND + 1).map(value => <option key={value} value={value}>{value}</option>) }
                </select>
              </div>
            </div>
            <div id="content-body">
             <div id="labels-column">
              <label>
                  Round Difficulty:
              </label>
              </div>
              <div id="form-column">
                  <select name="difficulty" value={this.state.difficulty} onChange={this.handleDifficultyChange}>
                  { this.DIFFICULTIES.map(difficulty => <option key={difficulty} value={difficulty}>{difficulty}</option>) }  
                  </select>
                </div>
              </div>
            <div id="content-body">
              <div id="labels-column">
                <label>
                  Your Player Name:
                </label>
              </div>
              <div id="form-column">
               <input
                name="owner"
                type="text"
                value={this.state.owner} onChange={this.handleOwnerChange} />
              </div>
              </div>
              <div id="content-body">
                <div id="labels-column">
                </div>
                <div id="form-column">
                  <Button onClick={() => {console.log("Clicked on Create Game")}}
                  type="submit" 
                  buttonSize="btn--small"
                  buttonStyle='btn--success--outline'>Create Game</Button>
                </div>
                </div>
           </div>
        </form>
        </div>
      );
    }
  }

  export class JoinGameForm extends React.Component {
    constructor(props) {
      super(props);
      this.state = {player: '',
                    roomname: (props.roomname) ? props.roomname : ''
                    };
  
      this.handleRoomnameChange = this.handleRoomnameChange.bind(this);
      this.handlePlayerChange = this.handlePlayerChange.bind(this);
      this.handleSubmit = this.handleSubmit.bind(this);
    }
  
    handleRoomnameChange(event) {
      this.setState({roomname: event.target.value});
    }
  
    handlePlayerChange(event) {
      this.setState({player: event.target.value});
    }
  
    handleSubmit(event) {
      console.log('A Player: '+this.state.player+ 'is joining roomname: ' + this.state.roomname);
        var submission = {
          roomname: this.state.roomname,
          player: this.state.player
        };
        
        this.props.handleFormSubmit(submission);  
      event.preventDefault();
    }
    render() {
      return (
        <div>
        <div >Join A Game</div>
        <form onSubmit={this.handleSubmit}>
        <div id="content-body-wrapper">
          <div id="content-body">
            <div id="labels-column">
              <label>
                Your Player Name:
                </label>
            </div>
            <div id="form-column">
              <input type="text" name="player" value={this.state.player} onChange={this.handlePlayerChange} />
            </div>
          </div>
          <div id="content-body">
            <div id="labels-column">
              <label>
                Room Code (4 Characters):
              </label>
            </div>
            <div id="form-column">
                <input
                  name="player"
                  type="text"
                  value={this.state.roomname} onChange={this.handleRoomnameChange} />
            </div>
          </div>

        <div id="content-body">
                <div id="labels-column">
                </div>
                <div id="form-column">
                  <Button onClick={() => {console.log("Clicked on Join Game")}}
                  type="submit" 
                  buttonSize="btn--small"
                  buttonStyle='btn--success--solid'>Join Game</Button>
              </div>
            </div>
          </div>
        </form>
        </div>
      );
    }
  }
