import React from 'react';
import Game from './Game';
import { confirmAlert } from 'react-confirm-alert'; // Import
import io from "socket.io-client/lib";
import { CreateGameForm } from "./forms";
import config  from "./config";

let SERVER_URI = null;
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  SERVER_URI = config.DEV_SERVER_URI;
} else {
  SERVER_URI = config.PROD_SERVER_URI;
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
                 owner:createGameData.owner,
                 categories: createGameData.categories,
                 pauseBetweenRounds: createGameData.pauseBetweenRounds}
                 , (createGameResp)=>{ // Process the server response
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
// Re-join this game
this.socket.emit('join',{roomname: this.gameConfig.roomname, player: this.gameConfig.player},(data)=>{
  if(data.success){
    this.setState({created: true, joined:true}); // Causes a referesh and Game will get created
    console.log("Socket opened by: "+this.gameConfig.player+" to re-join the game: "+this.gameConfig.roomname);
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