import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { Redirect } from "react-router-dom";
import { GameInfo } from "./GameInfo";
import GamePlay from "./GamePlay";
import PlayerListScores from './PlayerListScores';
import AlertDialog from './AlertDialog';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import AssignmentTwoToneIcon from '@material-ui/icons/AssignmentTwoTone';
import AssignmentTurnedInTwoToneIcon from '@material-ui/icons/AssignmentTurnedInTwoTone';
import { green } from '@material-ui/core/colors';
import TextField from '@material-ui/core/TextField';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import config  from "./config";
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

let SERVER_URI = null;
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  SERVER_URI = config.DEV_SERVER_URI;
} else {
  SERVER_URI = config.PROD_SERVER_URI;
}


function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
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
        errorMsg: null,
        copied: false,
        confirmCancel: false,
        confirmLeave: false,
        alertDisconnect: false
      };
      this.socket = props.socket;
      this.setUpEventHandlers();
      this.playerListElement = React.createRef();

    }
  
    onUnload = e => { // the method that will be used for both add and remove event
      e.preventDefault();
      e.returnValue = '';
   }

   componentDidMount() {
      window.addEventListener("beforeunload", this.onUnload);
      console.log("Game componentDidMount");
   }


     /* Clean up once the game is unmounted */
     componentWillUnmount() {
      window.removeEventListener("beforeunload", this.onUnload);
      console.log('Closing game socket on Game componentWillUnmount');
      if(this.socket.connected){
        this.socket.close();
      }
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
        
        console.debug("disconnect reason: "+reason);
        let match = (reason === 'transport close') ? 'yes':'no';
        console.debug("did reason match 'transport close' ? "+match);

        if(reason === 'transport close') {
          console.debug('Trying to reconnect socket'); 
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
    handleStartGame = ()=>{

    console.debug("DEBUG handleStartGame() called for game: "+this.gameConfig.roomname);
    if(!this.socket.connected){ // check to see if the socket got disconnected. This happens on mobile devices when the browser is backgrounded
      this.setState({alertDisconnect: true});
      console.debug("Reconnecting socket to server on Start Game");
      this.socket.connect(); // manually reconnecting
    }

     this.socket.emit('start-game',{roomname: this.gameConfig.roomname, ownerID: this.gameConfig.ownerID},
              (data)=>{
                if(data.success){
                  console.log("Server acknowledged start-game event");
                } 
                  else {this.handleError(data.error);}
              });
    }

    /* Called when snackbar is closed */
    handleAlertClose = () => {
      this.setState({alertDisconnect: false});
    }
  
    /*Called when game is cancelled or naturally ends*/
    handleEndGame = ()=>{
      this.setState({leaveGame:false, confirmLeave: false, gameStatus:'ENDED'});
      goTo('home',"Thanks for Playing!","/");
      this.socket.close();
      console.debug("handleEndGame(): displaying final scores and closed socket");
    }
  
    handleError = (errorMsg)=>{
      this.setState({errorMsg: errorMsg, error: true});
      console.error("handleError(): "+errorMsg);
    }
    
    /* Handles the button click to start the game! */
    handleCancelGame = ()=>{
        this.setState({confirmCancel: false}); // Hide the cancel dialog

        console.debug("cancelling the game");
        this.socket.emit('cancel-game',{roomname: this.gameConfig.roomname, ownerID: this.gameConfig.ownerID},(data)=>{
          console.debug('Cancel game result: %o',data);
        if(!data.success){ this.handleError(data.error); } 
        });
        this.setState({leaveGame:true, confirmLeave: false, gameStatus:'ENDED'});
    }
  
    /* Handles the button click to start the game! */
    handleLeaveGame = ()=>{
   
        this.socket.emit('remove-player',{roomname: this.gameConfig.roomname, player: this.gameConfig.player},(data)=>{
        console.debug('Player '+this.gameConfig.player+' leaving game result: %o',data);
        this.setState({leaveGame:true, confirmLeave: false, gameStatus:'ENDED'});
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
        return <AlertDialog 
                  buttonContinueText={'Cancel Game :('} 
                  buttonCancelText={'Play On!'}
                  dialogText={'Do you really want to cancel the game? This will end the game for all players.'} 
                  dialogTitle={'Cancel the game?'} 
                  callback={this.handleCancelGame}
                  cancelCallback={this.cancelLeave}>
               </AlertDialog>;
      }

      if(this.state.confirmLeave){
        return <AlertDialog 
                  buttonContinueText={'Leave :('} 
                  buttonCancelText={'Play On!'}
                  dialogText={'Do you really want to leave the game?'} 
                  dialogTitle={'Leave the game?'} 
                  callback={this.handleLeaveGame}
                  cancelCallback={this.cancelLeave}>
               </AlertDialog>;
      }
      
      let headerMessage = 'Welcome to Game Room: '+this.gameConfig.roomname+'!';
      let waitingButtons = <Button onClick={()=>this.setState({confirmLeave: true})}
                  type="button" 
                  variant="outlined" >Leave the Game</Button>;
  
      if(this.gameConfig.ownerID){
        headerMessage ='Game Room: '+this.gameConfig.roomname+' was Created!';
        waitingButtons = <Box>
        <Button type="submit" size="small" variant="contained" className={classes.colorfulButton}  onClick={this.handleStartGame}>
        Start Game</Button>&nbsp;
        <Button onClick={()=>this.setState({confirmCancel: true})}
                  type="button" 
                  variant="outlined" 
                  >Cancel Game</Button>
        </Box>;
 
  
      }
      const gameURL = getBaseURL()+ 'join?roomname=' +this.gameConfig.roomname;
      const clipboardIcon = (this.state.copied)? <AssignmentTurnedInTwoToneIcon  onClick={() => this.handleCopyLink()} style={{ color: green[500] }} /> :<AssignmentTwoToneIcon  onClick={() => this.handleCopyLink()} style={{ color: green[500] }} />;
  
      if (this.state.error) { 
        return ( 
          <AlertDialog buttonContinueText={'Ok'} 
            dialogText={this.state.joinErrorMsg} 
            dialogTitle={getErrorPhrase()}
            callback={()=>this.setState({error:false})} >
          </AlertDialog>
        );
      }
  
      switch(this.state.gameStatus){
        case 'WAITING':
          return(
            <Grid   justify="center" container>
              <Grid item sm={12}>
                <h2>{ headerMessage }</h2>
              </Grid>
              <Grid item sm={12}>
              <Paper>
              <Box  p={2}>
              <TextField id="gameroom" label='Share this link' variant='outlined' value={gameURL} style={{  minWidth: 200}} size='small' />
              {clipboardIcon}
              </Box>
              <Box p={2}>{waitingButtons}</Box>
              <Grid justify="center" container>
                
              <Grid  style={{ padding: '5px', flexGrow: 1}} item sm={6}>
                  <Paper  elevation={3}>
                    <Box  p={1} ><PlayerListScores thisPlayer={ this.gameConfig.player } players={ this.state.players } ref={ this.playerListElement } /></Box>
                  </Paper>
                </Grid>

                <Grid item sm={6}  style={{ padding: '5px'}} >
                  <Paper elevation={3}>
                    <Box p={1}><GameInfo gameConfig={ this.gameConfig } handleStartGame={ this.handleStartGame } /></Box>
                  </Paper>
                </Grid>
              
              
              </Grid>
                 <Snackbar open={this.state.alertDisconnect} autoHideDuration={3000} onClose={this.handleAlertClose}>
                  <Alert onClose={this.handleAlertClose} severity="warning">
                    You are not connected to the server...trying to reconnect. Wait a moment and try again. If this persists, refresh page.
                  </Alert>
                </Snackbar>
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
          goTo('home',"Coronivia","/");
          return(
            <Paper>
              <Box style={{fontSize:'30px'}} m={2}>The game was cancelled. Final scores:</Box>
              <Box p={2}><PlayerListScores showScore={true}  thisPlayer={this.gameConfig.player} players={this.state.players} ref={this.playerListElement} /></Box>
              <Box p={2}>
                <Button type="submit" size="small" variant="contained" className={classes.colorfulButton}  onClick={()=>this.setState({leaveGame:true})}>
              The End</Button>
              </Box>
            </Paper>
        );
  
        default:
          return(<div>Really shouldn't get here</div>);
      }
    }
  }

  Game.propTypes =  {
    classes: PropTypes.object.isRequired,
  };

export default withStyles(styles)(Game);

function goTo(page, title, url) {
  if ("undefined" !== typeof window.history.pushState) {
    window.history.pushState({page: page}, title, url);
  } else {
    window.location.assign(url);
  }
}