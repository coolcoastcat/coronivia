import React from 'react';
import Game from './Game';
import { confirmAlert } from 'react-confirm-alert'; // Import
import AlertDialog from './AlertDialog';
import io from "socket.io-client/lib";
import { CreateGameForm } from "./forms";
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

/////////////// CLASS DEFINTIONS /////////////

/* CreateGame includes the CreateGameForm and passeses in a function-as-prop
to have the form, on submit, set the form parameters into CreateGame object
in order to fetch from the server create-game api. The returned JSON will be
used to show the user 
*/
export class CreateGame extends React.Component{
  constructor(props){
    super(props);

    this.query = useQuery();

    this.state = { 
      created: false,
      joined: false,
      joinError: false,
      joinErrorMsg: null
    }
    this.gameConfig = {}; // The parsed config to send to Game
    this.createdGameResponseJSON = {}; // Raw JSON response from the Server create-game API
    this.handleFormSubmit = this.handleFormSubmit.bind(this);
//    this.playerListElement = React.createRef(); // Bind to Game method for passing status
    this.socket = null;

    if(this.query.get("roomname") && this.query.get("player") &&  this.query.get("id")  ) {
      this.joinGame(this.query.get("roomname"),this.query.get("player"),this.query.get("id"));
    }

  }

setUpEventHandlers(){

this.socket.on('game-joined',(data)=>{
this.setState({created: true});
console.debug("Owner: "+this.gameConfig.owner+" joined the game: "+this.gameConfig.roomname);
});

this.socket.on('error',(data) => {
console.log('event: error with data: %o',data);
});
}

handleJoinErrors(errorMsg){
  this.setState({joinError: true, joinErrorMsg: errorMsg});
}
// TODO - DECIDE IF THERE SHOULD BE AN owner-join EVENT OR IF THE CONFIG I RECEIVE FROM THE JOIN EVENT IS SUFFICIENT TO REINSTANTIATE THE GAME 
// ALONG WITH THE OWNER ID (WHICH I THINK IT SHOULD )
joinGame(roomname,player,ownerID){
  if(!this.socket){
    this.setupSocket();
  }
  this.socket.emit('join',{roomname: roomname, player: player},(data)=>{
    console.debug('DEBUG CreatGame.joinGame(): owner joined game with data: %o',data);
    if(data.success){
      this.gameConfig = data;
      this.gameConfig.ownerID = ownerID;
      this.setState({created: true, joined:true}); // Causes a referesh and Game will get created
      goTo({page: 'oplaying'},"Playing","/oplaying?roomname="+roomname+"&player="+player+"&id="+ownerID);
      console.debug("Socket opened by owner: "+player+" to join the game: "+roomname);
    } else {
      // Handle errors
      this.handleJoinErrors(data.error);
      // this.socket.close(); // I think we want to retry in the create game case
    }

  });
}

setupSocket(){
  this.socket = io(SERVER_URI);
  this.setUpEventHandlers();
}

/* Function passed to CreateGameForm to accept form data to submit to backend API 
*/ 
handleFormSubmit(createGameData){

  this.setupSocket();
  this.socket.on('connect',() =>{
  console.debug('client socket connected with id: '+this.socket.id);

  // Handle case if Owner's client got disconnected 
  // TODO: consider checking with server if game exists. It's possible the game server got restarted
  //       and all games flushed. If so, message should be shown and game should be recreated.
  if(!this.state.created){
    // Create the game on the server
    this.socket.emit('create-game',createGameData, (createGameResp)=>{ // Process the server response
                    console.debug("create-game API response: %o",createGameResp);
                    
                    this.gameConfig = createGameResp;
                    console.debug("received game config: %o",this.gameConfig);
                    // Now join this game
                      this.joinGame(createGameResp.roomname, createGameResp.player, createGameResp.ownerID);
                    }
                    );

} else {
  console.debug("Game "+this.gameConfig.roomname+" already created");
  // Re-join this game
  this.socket.emit('join',{roomname: this.gameConfig.roomname, player: this.gameConfig.player},(data)=>{
    if(data.success){
      this.setState({created: true, joined:true}); // Causes a referesh and Game will get created
      console.debug("Socket opened by: "+this.gameConfig.player+" to re-join the game: "+this.gameConfig.roomname);
    } else {
      // Handle errors
      this.handleJoinErrors(data.error);
      // this.socket.close(); // I think we want to retry in the create game case
    }
}
);
}
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


if(!this.state.created){
return(
<CreateGameForm handleFormSubmit={this.handleFormSubmit} />
);
} else {
  console.debug("SENDING IN CONFIG %o",this.gameConfig);
return(
<Game gameConfig={ this.gameConfig }    socket={ this.socket }  />
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