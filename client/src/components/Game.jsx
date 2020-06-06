import React from 'react';
import { Redirect } from "react-router-dom";
import { GameInfo } from "./GameInfo";
import { GamePlay } from "./GamePlay";
import RoundDialog from './RoundDialog';
import { CreateGameForm, JoinGameForm } from "./forms";
import { PlayerList, PlayerListScores } from "./PlayerList";
import { Countdown } from './Countdown';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import { Button } from "./Button";
import AlertDialog from "./AlertDialog";

import Box from '@material-ui/core/Box';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import io from "socket.io-client/lib";

/////////////  CONSTANTS /////////////  
const SERVER_URI = "http://localhost:5000";

/////////////// HELPER FUNCTIONS /////////////

/* Parse out the base URL and return */
function getBaseURL(){
    return window.location.protocol + "//" + window.location.host + "/";
  }

/* Scrape the query params
*/
function useQuery() {
    return new URLSearchParams(window.location.search);
  }
  const ERROR_PHRASES = ['Aww snap!',
                        'Trouble down at mill!',
                        'Sad news friend!',
                        "Wouldn't you just know it?",
                        'Fiddlesticks!',
                        'Poop!',
                        'Bad luck friend!',
                        'Nothing to see here, citizen.',
                        'A very tinny result.',
                        'Uh, O Spagetti-os!',
                        "It's a trap!",
                        "Dammit!",
                        'Seriously?',
                        'For the love of Pete!',
                        'Since the dawn of time, mankind has experienced errors...',
                        'Blammo!',
                        'Son of a biscuit!',
                        'Bummer dude!',
                        "I just can't do it captain!",
                        'Who would have thunk it?',
                        "Well, I'll be go to hell.",
                        'Shiiiooot!',
                        'Danger Will Robinson!',
                        'So say we all.',
                        'By the Hammer of Grabthar!',
                        'There can be only one!',
                        'Doh!'
                      ];
  /* Get a random funny error phrase to prefix dialogs */
  function getErrorPhrase(){
    return ERROR_PHRASES[Math.floor(Math.random() * ERROR_PHRASES.length)];
  }

/////////////// CLASS DEFINTIONS /////////////

/* CreateGame includes the CreateGameForm and passeses in a function-as-prop
   to have the form, on submit, set the form parameters into CreateGame object
   in order to fetch from the server create-game api. The returned JSON will be
   used to show the user 
*/
export class CreateGame extends React.Component{
    constructor(props){
      super(props);
      this.state = { 
        created: false,
        joined: false
      }
      this.gameConfig = {}; // The parsed config to send to Game
      this.createdGameResponseJSON = {}; // Raw JSON response from the Server create-game API
      this.handleFormSubmit = this.handleFormSubmit.bind(this);
      this.playerListElement = React.createRef(); // Bind to Game method for passing status
      this.socket = null;
  
    }
  
    setUpEventHandlers(){
    
      this.socket.on('game-joined',(data)=>{
        this.setState({created: true});
        console.log("Owner: "+this.gameConfig.owner+" joined the game: "+this.gameConfig.roomname);
      });
  
      this.socket.on('player-change',(data) =>{
        console.log('CreateGame event: player-change with data: %o',data);
        this.playerListElement.current.updatePlayers(data); // Update the child Game
      });
  
      this.socket.on('error',(data) => {
        console.log('event: error with data: %o',data);
      });
    }
  
    handleJoinErrors(errorMsg){
      confirmAlert({
        title: getErrorPhrase(),
        message: errorMsg,
        buttons: [
          {
            label: 'Ok',
            onClick: () => {}
          }
        ]
      });
    }
  
    /* Function passed to CreateGameForm to accept form data to submit to backend API 
    */ 
    handleFormSubmit(createGameData){
  
      this.socket = io(SERVER_URI);
      this.setUpEventHandlers();
      this.socket.on('connect',() =>{
        console.log('client socket connected with id: '+this.socket.id);
        
        // Handle case if Owner's client got disconnected 
        // TODO: consider checking with server if game exists. It's possible the game server got restarted
        //       and all games flushed. If so, message should be shown and game should be recreated.
        if(!this.state.created){
        // Create the game on the server
        this.socket.emit('create-game',{rounds:createGameData.rounds,
                                        questions:createGameData.questions,
                                        difficulty:createGameData.difficulty, 
                                        owner:createGameData.owner}, (createGameResp)=>{ // Process the server response
                                          console.log("create-game API response: %o",createGameResp);
                                          
                                          this.gameConfig = createGameResp;
                                          // Now join this game
                                          this.socket.emit('join',{roomname: createGameResp.roomname, player: createGameResp.player},(data)=>{
                                            if(data.success){
                                              this.setState({created: true, joined:true}); // Causes a referesh and Game will get created
                                              console.log("Socket opened by: "+createGameResp.player+" to join the game: "+createGameResp.roomname);
                                            } else {
                                              // Handle errors
                                              this.handleJoinErrors(data.error);
                                              // this.socket.close(); // I think we want to retry in the create game case
                                            }
                                          }
                                          );
          });
      
      } else {
        console.log("Game "+this.gameConfig.roomname+" already created");
      }
      });
    }
  
    render() {
      if(!this.state.created){
        return(
            <CreateGameForm handleFormSubmit={this.handleFormSubmit} />
        );
      } else {
        return(
          <Game gameConfig={ this.gameConfig }  ref={ this.playerListElement }  socket={ this.socket }  />
        );
      }
    }
  
  }
  /* Game is the client intantiation of the game. It creates a websocket connection to the server to drive the 
    game state.
    @param rounds
    @param questions
    @param roomname
    @param difficulty
    @param ownerID // only if player is the owner 
    @param player
    @param gameStatus
  */
  export class Game extends React.Component{
    constructor(props){
      super(props);
      console.log("Game constructor received props: o%",props);
      this.gameConfig = props.gameConfig;
      this.state = {
        gameStatus: props.gameConfig.gameStatus,
        players: props.gameConfig.players,
        leaveGame: false, 
        serverConnection: 'disconnected',
        isLoading: true,
        error: null,
        countdownData: null
      };
      this.socket = props.socket;
      this.setUpEventHandlers();
      this.playerListElement = React.createRef();
      this.countdownElement = React.createRef();
      this.handleStartGame = this.handleStartGame.bind(this);
      this.handleCancelGame = this.handleCancelGame.bind(this);
    }
  
     /* Clean up once the game is unmounted */
     componentWillUnmount() {
       console.log('Closing socket');
      this.socket.close();
     }
  
     /* Method bound to CreateGame reference so that Parent can pass in updates to the playerArray and force a refresh 
          @param playerArray The updated player array to show.
      */
     updatePlayers(playerArray){
      console.log("Game received player array update: %o",playerArray);
  
      this.setState({players: playerArray});
      console.log("updating PlayerList with %o",this.state.players);
      this.playerListElement.current.updatePlayers(this.state.players); // Update the child
    }
  
     setUpEventHandlers(){
      console.log("Setting up socket.io event hanlders for socket: "+this.socket.id);
      
      /* General handler for countdown timers received from the server.
        @param data.count  seconds remaining
        @param data.timerMessage message to show above the seconds remaining
        @param data.showCountdown Boolean of whether to show the digits counting down
       */
      this.socket.on('countdown',(data) =>{
        console.log('countdown event: %o',data);
        this.setState({countdownData: data});
        this.countdownElement.current.updateCountdown(data); // Update the child & show the countdown count
      });
     
      /* Nulls the countdownData which hides the countdown component
      */
      this.socket.on('clear-countdown',(data) =>{
        console.log('clear-countdown event');
        this.setState({countdownData: null});
      });
  
  
      this.socket.on('game-start',(data) =>{
        console.log('event: game-start with data: %o',data);
        this.setState({ gameStatus: data.gameStatus }); // Kick things off!
      });
    
      this.socket.on('player-change',(playerArray) =>{
        console.log('Game event: player-change with data: %o',playerArray);
        this.setState({players: playerArray})
        this.playerListElement.current.updatePlayers(this.state.players); // Update the child
        console.log('new Game status: %o',this.state);
      });
    
    
      this.socket.on('round-start',(data) =>{
        console.log('event: round-start with data: %o',data);
      });
    
      this.socket.on('question',(data) =>{
        console.log('event: question with data: %o',data);
      });
    
      this.socket.on('answer',(data) =>{
        console.log('event: answer with data: %o',data);
      });
    
  
    
      this.socket.on('game-ended',(data) =>{
        console.log('event: game-end with data: %o',data);
        this.handleEndGame();
  
      });
  
      this.socket.on('game-cancelled',(data) =>{
        console.log('event: game-cancelled with data: %o',data);
        this.handleEndGame();
  
      });
    
      this.socket.on('timer-update',(data) =>{
        console.log('event: timer-update with data: %o',data);
      });
    
    
      this.socket.on('disconnect',(reason) => {
        console.log('event: disconnect from server for reason: '+reason);
        if (reason === 'io server disconnect') {
          this.socket.connect(); // manually reconnecting
        } else {
          this.socket.disconnect(true);
        }
      });
    
      this.socket.on('connect_failed',() => {
        console.log('event: connection to server failed');
      })
    
      this.socket.on('reconnect',(attemptNumber) => {
        console.log('event: reconnected with server after '+attemptNumber+' tries');
      });
    }
  
  
    /* Handles the button click to start the game! */
    handleStartGame(){
    console.log("DEBUG handleStartGame() called with object this: %o",this);
     this.socket.emit('start-game',{roomname: this.gameConfig.roomname, ownerID: this.gameConfig.ownerID},
              (data)=>{
                if(data.success){
                  console.log("Server acknowledged start-game event");
                } 
                  else {this.handleError(data.error);}
              });
    }
  
    /*Called when game is cancelled or naturally ends*/
    handleEndGame(){
      console.log("handleEndGame() called");
      confirmAlert({
        customUI: ({ onClose }) => {
          this.socket.close();
          return (
            <div className='score-wrapper'>
              <div className='score-dialog'>
                <h2>Game Ended - Final Scores</h2>
                <p><Button onClick={() => {                  
                    this.setState({leaveGame: true});
                    onClose();}}
                    type="button" 
                    buttonSize="btn--small"
                    buttonStyle='btn--success--solid'>Close</Button>
                </p>
                <p>
                <PlayerListScores thisPlayer={this.gameConfig.player} players={this.state.players} ref={this.playerListElement} />
                </p>
              </div>
            </div>
          );
        }
      });
  
    }
  
    handleError(errorMsg){
      confirmAlert({
        title: getErrorPhrase(),
        message: errorMsg,
        buttons: [
          {
            label: 'Ok',
            onClick: () => {}
          }
        ]
      });
    }
    
    /* Handles the button click to start the game! */
    handleCancelGame(){
        console.log("cancelling the game");
        this.socket.emit('cancel-game',{roomname: this.gameConfig.roomname, ownerID: this.gameConfig.ownerID},(data)=>{
        console.log('Cancel game result: %o',data);
        if(!data.success){ this.handleError(data.error); }
        // Server should kick everyone out and display final score
        });
    }
  
    /* Handles the button click to start the game! */
    handleLeaveGame(){
      confirmAlert({
        title: 'Leave the Game',
        message: 'Do you really want to leave?',
        buttons: [
          {
            label: 'Yes',
            onClick: () => {
              this.socket.emit('remove-player',{roomname: this.gameConfig.roomname, player: this.gameConfig.player},(data)=>{
                console.log('Leaving game result: %o',data);
  
                // Redirect to join page
                this.setState({leaveGame:true});
                this.socket.close();
              }  
              );
            }
          },
          {
            label: 'No',
            onClick: () => {}
          }
        ]
      });
    }
  
    render() {
      if(this.state.leaveGame){
        return <Redirect to='/' />
      }
      
      let headerMessage = 'Welcome to Game Room: '+this.gameConfig.roomname+'!';
      let waitingButtons = <p><Button onClick={() => {this.handleLeaveGame();}}
                  type="button" 
                  buttonSize="btn--small"
                  buttonStyle='btn--warning--outline'>Leave the Game</Button></p>;
      let playingButtons = waitingButtons;
  
      if(this.gameConfig.ownerID){
        headerMessage ='Game Room: '+this.gameConfig.roomname+' was Created!';
        waitingButtons = <Box>
            
        <AlertDialog buttonContinueText={'Yes'} buttonCancelText={'No'}
                     dialogText={'Do you really want to cancel the game? This will end the game for all players.'} 
                     dialogTitle={'Cancel the Game'} callback={this.handleCancelGame}>
        Cancel Game</AlertDialog>
        <AlertDialog buttonContinueText={'Start'} buttonCancelText={'Wait some more'}
                     dialogText={'Click start to beging the game.'} 
                     dialogTitle={'Starting the Game'} callback={this.handleStartGame}>
        Click Start to begin!</AlertDialog>
        </Box>;
        playingButtons = <Box>
        <Button onClick={() => {this.handleCancelGame();}}
                  type="button" 
                  buttonSize="btn--small"
                  buttonStyle='btn--warning--outline'>End the Game</Button></Box>;
  
  
      }
  
      if (this.state.error) { // REPLACE WITH DIALOG
        return <p>{ this.state.error }</p>;
      }
  
      switch(this.state.gameStatus){
        case 'WAITING':
          return(
            <Box>
              <h2>{ headerMessage }</h2>
              <Box>Share this link with other players: <br /> { getBaseURL()+ 'join?roomname=' +this.gameConfig.roomname }</Box>
              <Box p={3}>{this.state.players.length} { (this.state.players.length === 1) ? 'player': 'players' } waiting</Box>
              <Box><PlayerListScores thisPlayer={ this.gameConfig.player } players={ this.state.players } ref={ this.playerListElement } /></Box>
             
              <Box><GameInfo gameConfig={ this.gameConfig } handleStartGame={ this.handleStartGame } /></Box>
              <Box>{waitingButtons}</Box>
            </Box>
          );
        
        case 'PLAYING':
         let countdown = (this.state.countdownData)? <RoundDialog><Countdown ref={this.countdownElement}  /></RoundDialog> : '';
        return(
          <Box>
            <Box><GamePlay gameConfig={ this.gameConfig } socket={ this.socket }  /></Box>
            <Box>{countdown}</Box>
            <Box><PlayerListScores thisPlayer={ this.gameConfig.player } players={ this.state.players } ref={ this.playerListElement } /></Box>
            <Box>{ playingButtons }</Box>
          </Box>
        );
  
        case 'ENDED':
          return(<PlayerListScores  thisPlayer={this.gameConfig.player} players={this.state.players} ref={this.playerListElement} />);
  
        default:
          return(<div>Really shouldn't get here</div>);
      }
    }
  }

  /* JoinGame includes the JoinGameForm and passeses in a function-as-prop
     to have the form, on submit, set the form parameters into JoinGame object
     in order to fetch from the server create-game api. The returned JSON will be
     used to show the user 
  */
 export class JoinGame extends React.Component{
    constructor(props){
      super(props);
  
      this.query = useQuery();
  
      this.state = { 
        joined: false
      }
      this.socket = null; // Initialize
      this.gameConfig = {}; // The parsed config to send to Game
      this.joinGameResponseJSON = {}; // Raw JSON response from the Server create-game API
      this.handleFormSubmit = this.handleFormSubmit.bind(this);
      this.playerListElement = React.createRef(); // Bind to Game method for passing status
    }
   
    /* Sets up the socket event handlers for the Join activities */
    setUpEventHandlers(){
  
      this.socket.on('player-change',(data) =>{
        console.log('JoinGame event: player-change with data: %o',data);
        this.playerListElement.current.updatePlayers(data); // Update the child Game
      });
  
      /* Handle generic server error ¯\_(ツ)_/¯ */
      this.socket.on('error',(data) => {
        console.log('event: error with data: %o',data);
        confirmAlert({
          title: getErrorPhrase(),
          message: data.error,
          buttons: [
            {
              label: 'Ok',
              onClick: () => {}
            }
          ]
        });
      });
  
    }
  
    handleJoinErrors(errorMsg){
      confirmAlert({
        title: getErrorPhrase(),
        message: errorMsg,
        buttons: [
          {
            label: 'Ok',
            onClick: () => {}
          }
        ]
      });
    }
  
    /* Function passed to JoinGameForm to accept form data to submit to backend API 
      @param joinGameData Data collected from the JoinGameForm
    */ 
    handleFormSubmit(joinGameData){
    
      this.socket = io(SERVER_URI);
      this.setUpEventHandlers();
      this.socket.on('connect',() =>{
        console.log('client socket connected with id: '+this.socket.id);
        this.setState({serverConnection: 'connected', isLoading: false});
        this.socket.emit('join',{roomname: joinGameData.roomname, player: joinGameData.player},(data)=>{
          if(data.success){
            this.gameConfig = data;
            this.setState({joined: true}); // Causes a referesh and Game will get created
            console.log("Socket opened by: "+joinGameData.player+" to join the game: "+joinGameData.roomname);
          } else {
            // Handle errors
            this.handleJoinErrors(data.error);
            this.socket.close();
          }
        }
        );
      });
    }
  
    render() {
      if(!this.state.joined){
        return( 
          <JoinGameForm roomname={this.query.get("roomname")}  handleFormSubmit={this.handleFormSubmit} />
        );
      } else {
        return(
          <Game socket={this.socket} gameConfig={this.gameConfig}   ref={this.playerListElement}  />
        );
      }
    }
  
  }