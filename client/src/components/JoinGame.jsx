import React from 'react';
import { JoinGameForm } from "./forms";
import Game from './Game';
import AlertDialog from './AlertDialog';
import io from "socket.io-client/lib";
import config  from "./config";


let SERVER_URI = null;
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  SERVER_URI = config.DEV_SERVER_URI;
} else {
  SERVER_URI = config.PROD_SERVER_URI;
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
        joined: false,
        joinError: false,
        joinErrorMsg: null,
        player: localStorage.getItem('player')
      }
      this.socket = null; // Initialize
      this.gameConfig = {}; // The parsed config to send to Game
      this.joinGameResponseJSON = {}; // Raw JSON response from the Server create-game API
      // this.playerListElement = React.createRef(); // Bind to Game method for passing status

      if(this.query.get("roomname") && this.state.player ) {
        var submission = {
          roomname: this.query.get("roomname"),
          player: this.state.player
        };
        this.handleFormSubmit(submission);
      }
    }

  

    /* Sets up the socket event handlers for the Join activities */
    setUpEventHandlers(){
  
      /* Handle generic server error ¯\_(ツ)_/¯ */
      this.socket.on('error',(data) => {
        this.setState({joinError: true, joinErrorMsg: data.error});
      });
    }
  
    handleJoinErrors(errorMsg){
     this.setState({joinError: true, joinErrorMsg: errorMsg});
    }
  
    /* Function passed to JoinGameForm to accept form data to submit to backend API 
      @param joinGameData Data collected from the JoinGameForm
    */ 
    handleFormSubmit = (joinGameData)=>{
      
      localStorage.setItem('player',joinGameData.player);
      this.setState({player:joinGameData.player});
      
      this.socket = io(SERVER_URI);
      this.setUpEventHandlers();
      this.socket.on('connect',() =>{
        console.debug('client socket connected with id: '+this.socket.id);
        this.setState({serverConnection: 'connected', isLoading: false});
        this.socket.emit('join',{roomname: joinGameData.roomname, player: joinGameData.player},(data)=>{
          if(data.success){
            goTo({page: 'playing'},"Playing","/playing?roomname="+joinGameData.roomname+"&player="+joinGameData.player);
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
      if(this.state.joinError){
        return (
          <AlertDialog buttonContinueText={'Ok'} 
          dialogText={this.state.joinErrorMsg} 
          dialogTitle={getErrorPhrase()}
          callback={()=>this.setState({joinError:false})} >
            </AlertDialog>
        );
      }

      if(!this.state.joined){
        console.debug('Rendering JoinGameForm with player: '+this.state.player);
        return( 
          <JoinGameForm roomname={this.query.get("roomname")} player={this.state.player}    handleFormSubmit={this.handleFormSubmit} />
        );
      } else {
        return(
          <Game socket={this.socket} gameConfig={this.gameConfig}    />
        );
      }
    }
  
  }

  function goTo(page, title, url) {
    if ("undefined" !== typeof window.history.pushState) {
      window.history.pushState({page: page}, title, url);
    } else {
      window.location.assign(url);
    }
  }