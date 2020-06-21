import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Redirect } from "react-router-dom";
import { GameInfo } from "./GameInfo";
import { GamePlay } from "./GamePlay";
import { JoinGameForm } from "./forms";
import PlayerListScores from './PlayerListScores';
import { confirmAlert } from 'react-confirm-alert'; // Import
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import css
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import AssignmentTwoToneIcon from '@material-ui/icons/AssignmentTwoTone';
import AssignmentTurnedInTwoToneIcon from '@material-ui/icons/AssignmentTurnedInTwoTone';
import { green } from '@material-ui/core/colors';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';

import io from "socket.io-client/lib";
import config  from "./config";
import QuestionDialog from "./QuestionDialog";

let SERVER_URI = null;
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  SERVER_URI = config.DEV_SERVER_URI;
} else {
  SERVER_URI = config.PROD_SERVER_URI;
}


const styles = theme => ({
  colorfulButton: {
    background: 'linear-gradient(45deg, #32a852 30%, #d8e038 90%)',
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(245, 250, 155, .3)',
    color: 'white',
    height: 48,
    padding: '0 30px',
  }, 
  mainGrid: {
    padding: theme.spacing(2)
  }
});

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

  /* Get a random funny error phrase to prefix dialogs */
function getErrorPhrase(){
  return config.ERROR_PHRASES[Math.floor(Math.random() * config.ERROR_PHRASES.length)];
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
class Game extends React.Component{
    constructor(props){
      super(props);
      console.debug("Game constructor received props: o%",props);
      this.gameConfig = props.gameConfig;
      this.state = {
        gameStatus: props.gameConfig.gameStatus,
        players: props.gameConfig.players,
        leaveGame: false, 
        serverConnection: 'disconnected',
        isLoading: true,
        error: null,
        copied: false,
        confirmCancel: false,
        confirmLeave: false
      };
      this.socket = props.socket;
      this.setUpEventHandlers();
      this.playerListElement = React.createRef();
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
      console.debug("Game received player array update: %o",playerArray);
  
      this.setState({players: playerArray});
      console.debug("updating PlayerList with %o",this.state.players);
      if(this.playerListElement.current){
        this.playerListElement.current.updatePlayers(this.state.players); // Update the child
      }
    }
  
     setUpEventHandlers(){
      console.debug("Setting up socket.io event hanlders for socket: "+this.socket.id);
     
  
      this.socket.on('game-start',(data) =>{
        console.debug('event: game-start with data: %o',data);
        this.gameConfig.gameStatus = data.gameStatus;
        this.setState({ gameStatus: data.gameStatus }); // Kick things off!
      });
    
      this.socket.on('player-change',(playerArray) =>{
        console.debug('Game event: player-change with data: %o',playerArray);
        this.setState({players: playerArray});
        if(this.playerListElement.current){
          this.playerListElement.current.updatePlayers(this.state.players); // Update the child
        }
        console.debug('new Game status: %o',this.state);
      });
    
    
      this.socket.on('round-start',(data) =>{
        console.debug('event: round-start with data: %o',data);
      });
    
      this.socket.on('question',(data) =>{
        console.debug('event: question with data: %o',data);
      });
    
      this.socket.on('answer',(data) =>{
        console.debug('event: answer with data: %o',data);
      });
    
  
  
      this.socket.on('game-cancelled',(data) =>{
        console.debug('event: game-cancelled with data: %o',data);
        this.handleEndGame();
  
      });
    
      this.socket.on('timer-update',(data) =>{
        console.debug('event: timer-update with data: %o',data);
      });
    
    
      this.socket.on('disconnect',(reason) => {
        console.debug('event: disconnect from server for reason: '+reason);
        if(reason === 'transport closed') {
          this.socket.connect(); // manually reconnecting
        } if(reason === 'io server disconnect') {
          this.socket.disconnect(true);
        } else {
          this.socket.disconnect(true);
        }
      });
    
      this.socket.on('connect_failed',() => {
        console.debug('event: connection to server failed');
      })
    
      this.socket.on('reconnect',(attemptNumber) => {
        console.debug('event: reconnected with server after '+attemptNumber+' tries');
      });
    }
  
  
    /* Handles the button click to start the game! */
    handleStartGame(){
    console.debug("DEBUG handleStartGame() called with object this: %o",this);
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
      console.debug("handleEndGame() called");
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
      console.error("handleError(): "+errorMsg);
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
    handleCancelGame = ()=>{
        this.setState({confirmCancel: false}); // Hide the cancel dialog

        console.debug("cancelling the game");
        this.socket.emit('cancel-game',{roomname: this.gameConfig.roomname, ownerID: this.gameConfig.ownerID},(data)=>{
        console.debug('Cancel game result: %o',data);
        if(!data.success){ this.handleError(data.error); }
        // Server should kick everyone out and display final score
        });
    }
  
    /* Handles the button click to start the game! */
    handleLeaveGame = ()=>{
   
        this.socket.emit('remove-player',{roomname: this.gameConfig.roomname, player: this.gameConfig.player},(data)=>{
        console.debug('Player '+this.gameConfig.player+' leaving game result: %o',data);
        this.setState({leaveGame:true, confirmLeave: false});
        this.socket.close();
        });
    }

    /* Copies the game link text to the clipboard */
    handleCopyLink(){
      var copyText = document.getElementById("gameroom");
      copyText.select();
      document.execCommand("copy");
      console.debug("copied link to clipboard");
      this.setState({copied: true});
      return false;
    }

    /* Cancel the player leaving the game */
    cancelLeave = ()=>{
      this.setState({confirmCancel: false,confirmLeave: false});
    }
  
    render() {
      const { classes } = this.props;

      if(this.state.leaveGame){
        return <Redirect to='/' />
      }

      if(this.state.confirmCancel){
        return <QuestionDialog  showQuestion={true} 
                                timerText={this.state.timerText} 
                                dialogTitle={'Cancel the game?'}
                                leaveGame={true} 
                                stayCallback={this.cancelLeave}
                                leaveCallback={this.handleCancelGame}>
                                Do you really want to cancel the game? This will end the game for all players.
                </QuestionDialog>;
      }

      if(this.state.confirmLeave){
        return <QuestionDialog  showQuestion={true} 
                                timerText={this.state.timerText} 
                                dialogTitle={'Leave the game?'}
                                leaveGame={true} 
                                stayCallback={this.cancelLeave}
                                leaveCallback={this.handleLeaveGame}>
                                Do you really want to leave the game?
                </QuestionDialog>;
      }
      
      let headerMessage = 'Welcome to Game Room: '+this.gameConfig.roomname+'!';
      let waitingButtons = <p><Button onClick={()=>this.setState({confirmLeave: true})}
                  type="button" 
                  variant="outlined" >Leave the Game</Button></p>;
  
      if(this.gameConfig.ownerID){
        headerMessage ='Game Room: '+this.gameConfig.roomname+' was Created!';
        waitingButtons = <Box>
        <Button type="submit" size="small" variant="contained" className={classes.colorfulButton}  onClick={this.handleStartGame}>
        Start Game</Button>&nbsp;
        <Button onClick={()=>this.setState({confirmCancel: true})}
                  type="button" 
                  variant="outlined" 
                  >Cancel Game</Button>
          {/* 
        <AlertDialog buttonContinueText={'Start'} buttonCancelText={'Wait some more'}
                     dialogText={'Click start to beging the game.'} 
                     dialogTitle={'Starting the Game'} callback={this.handleStartGame}>
        Click Start to begin!</AlertDialog>*/}
        </Box>;
 
  
      }
      const gameURL = getBaseURL()+ 'join?roomname=' +this.gameConfig.roomname;
      const clipboardIcon = (this.state.copied)? <AssignmentTurnedInTwoToneIcon  onClick={() => this.handleCopyLink()} style={{ color: green[500] }} /> :<AssignmentTwoToneIcon  onClick={() => this.handleCopyLink()} style={{ color: green[500] }} />;
  
      if (this.state.error) { // REPLACE WITH DIALOG
        return <p>{ this.state.error }</p>;
      }
  
      switch(this.state.gameStatus){
        case 'WAITING':
          return(
            <Grid container>
              <Grid item sm={12}>
                <h2>{ headerMessage }</h2>
              </Grid>
              <Grid item sm={12}>
              <Paper>
              <Box  p={2}>
              <TextField id="gameroom" label='Share this link' variant='outlined' value={gameURL} style={{  minWidth: 200}} size='small' />
              {clipboardIcon}
              </Box>
              <Grid container>
                
                <Grid item sm={6}  style={{ padding: '5px'}} >
                  <Paper elevation={3}>
                    <Box p={1}><GameInfo gameConfig={ this.gameConfig } handleStartGame={ this.handleStartGame } /></Box>
                  </Paper>
                </Grid>

                <Grid  style={{ padding: '5px'}} item sm={6}>
                  <Paper elevation={3}>
                    <Box p={1} ><PlayerListScores thisPlayer={ this.gameConfig.player } players={ this.state.players } ref={ this.playerListElement } /></Box>
                  </Paper>
                </Grid>
              
              </Grid>
              
              <Box p={2}>{waitingButtons}</Box>
              </Paper>
              </Grid>
            </Grid>
          );
        
        case 'PLAYING':
       
        return(
          <Grid container>
            <Grid item xs={12}><GamePlay gameConfig={ this.gameConfig } socket={ this.socket }  /></Grid>
          </Grid>
        );
  
        case 'ENDED':
          return(<PlayerListScores showScore={true}  thisPlayer={this.gameConfig.player} players={this.state.players} ref={this.playerListElement} />);
  
        default:
          return(<div>Really shouldn't get here</div>);
      }
    }
  }

  Game.propTypes =  {
    classes: PropTypes.object.isRequired,
  };

export default withStyles(styles)(Game);

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
        console.debug('JoinGame event: player-change with data: %o',data);
        this.playerListElement.current.updatePlayers(data); // Update the child Game
      });
  
      /* Handle generic server error ¯\_(ツ)_/¯ */
      this.socket.on('error',(data) => {
        console.error('event: error with data: %o',data);
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
        console.debug('client socket connected with id: '+this.socket.id);
        this.setState({serverConnection: 'connected', isLoading: false});
        this.socket.emit('join',{roomname: joinGameData.roomname, player: joinGameData.player},(data)=>{
          if(data.success){
            this.gameConfig = data;
            this.setState({joined: true}); // Causes a referesh and Game will get created
            console.debug("Socket opened by: "+joinGameData.player+" to join the game: "+joinGameData.roomname);
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