const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const http = require('http');
const socketIo = require("socket.io/lib");


const gameRoomArray = {};


const app = express();
const port = process.env.PORT || 5000;
const DEFAULT_NUM_QUESTIONS = 5; // For people hacking the API
const DEFAULT_NUM_ROUNDS = 1; // For people hacking the API
const MAX_NUM_QUESTIONS = 10;
const MAX_ROUNDS = 50;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

///////////////  WEBSOCKET CONFIGURATION ///////////////
const server = http.createServer(app);
const io = socketIo(server); // setup the websocket
// const socketConnections = {}; // TODO: Determine if there is a use for tracking all sockets

io.on('connection',handleNewSocketConnection);

function handleNewSocketConnection(socket){
  console.log('a user connected with socket.id: '+socket.id);
  // socketConnections[socket.id] = socket; // this would run the server out of memory, eventually, without cleanup

  ///////// Socket Message Handlers /////////

  /* Create a game 
    @param rounds The number of game rounds
    @param questions The number of questions per round
    @param difficulty any|easy|medium|hard
    @param owner Name of the owner
    @return All submitted params + game room name and ownerID
  */
  socket.on('create-game',(data,callback)=>{
    console.log('Handled create-game event with data %o',data);
    let result = validateParams(["owner","rounds","questions","difficulty"],data);
    if(!result.success){
      console.error(result.messages); 
      callback({ success: false, error: result.messages});
      return;
    }
 
     let owner = data.owner;
     let difficulty = data.difficulty;

     var questionsPerRound = data.questions;
     if(questionsPerRound < 1 || questionsPerRound > MAX_NUM_QUESTIONS){ questionsPerRound = DEFAULT_NUM_QUESTIONS;}
     console.log('Number of questions set to: ' + questionsPerRound);
     
     let rounds = data.rounds;
     if(rounds < 1 || rounds > MAX_ROUNDS){rounds = DEFAULT_NUM_ROUNDS;}
     console.log('Number of rounds set to: ' + rounds);
 
     // create a new game room with the supplied parameters and add it to the list of games
     game = new GameRoom(owner,rounds,questionsPerRound,difficulty);
 
     gameRoomArray[game.roomName] = game;
     console.log("Room Created: %o",game);
     callback({ success: true, 
                gameStatus: 'WAITING',
                rounds: rounds, 
                questions: questionsPerRound, 
                roomname: game.roomName,
                difficulty: game.difficulty, 
                owner: owner,
                player: owner,
                ownerID: game.ownerID,
                players: [] });
     });

  /* Add player to a game 
    @param roomname
    @param player
    @emits player-change event to all in roomname 
  */
  socket.on('join',(data,callback)=>{
    console.log('Handled join event with data %o',data);
    let result = validateParams(["roomname","player"],data);
    if(!result.success){
      console.error(result.messages)  
      callback({ success: false, error: result.messages});
      return;
    }
    if(!doesGameExist(data.roomname)){
      console.error("Player: "+data.player+" attempted to join non-existant room: "+data.roomname);
      callback({ success: false, error: 'No such roomname found: '+data.roomname});
      return;
    }
    socket.join(data.roomname);
    let addPlayerResult = addPlayer(data.player,data.roomname,socket);
    if(addPlayerResult.success){
      let game = gameRoomArray[data.roomname];
      let gameConfig = { success: true, 
                          player: data.player,
                          questions: game.questionCount,
                          difficulty: game.difficulty,
                          rounds: game.rounds,
                          roomname: game.roomName, 
                          owner: game.owner,
                          gameStatus: game.gameStatus,
                          players: game.getPlayerInfo()
      }
      console.log("Sending gameConfig: %o",gameConfig);
      callback(gameConfig);
      // Tell everyone that the Players have changed
      io.to(data.roomname).emit('player-change',game.getPlayerInfo());
      return;
      // socket.emit('game-joined',gameConfig);
    } else {
      callback({ success: false, error: addPlayerResult.message});
      return;
    }
  
  });

  /* Handles remove-player event from client. Takes a GameRoom name a player name and removes player from the game.
    @param roomname The room to exit.
    @param player  The player name to remove from the room.
    @emits @emits player-change event to all in roomname
  */
  socket.on('remove-player',(data,callback)=>{
   
    console.log('Handled remove-player event with data %o',data);
   
    let result = validateParams(["roomname","player"],data);
   
    if(!result.success){
      console.error(result.messages);
      callback({ success: false, error: result.messages});
      return;
    }
   
    if(!doesGameExist(data.roomname)){
      console.error("Player "+data.player+" attempted to leave non-existant room: "+data.roomname);
      callback({ success: false, error: 'No such roomname found: '+data.roomname});
      return;
    }

    let removePlayerResult =  removePlayer(data.player, data.roomname); 
    
    if(removePlayerResult.success){
      // Tell everyone that the Players have changed
      io.to(data.roomname).emit('player-change',game.getPlayerInfo());
      callback({ success: true, error: 'Player '+data.player+' removed from room '+data.roomname});
    
    } else {
      // probably useless since the client already left...
      callback({ success: false, error: removePlayerResult.messages});
    }

  });
  
  socket.on('cancel-game',(data,callback) =>{
    result = validateParams(["roomname","ownerID"],data);
    if(!result.success){
      console.error(result.messages)  
      callback({ success: false, error: result.messages});
      return;
    }
    
    if(!isGameOwner(data.roomname, data.ownerID)){
      console.error("roomname not found OR ownerID did not match with the room");
      callback({ success: false, error: 'no such roomname with ownerID found'});
      return;
    }
  

    if(!endGame(data.roomname, data.ownerID)){
      console.error("Unable to remove game for some reason");
      callback({ success: false, error: 'unable to remove game...not sure why'});
      return;
    }
    
    io.to(data.roomname).emit('player-change',game.getPlayerInfo()); // Update all the scores
    io.to(data.roomname).emit('game-cancelled',{success: true, message: data.roomname+' was removed'}); // cancel for all
    console.log("cancel-game called: room "+data.roomname+ " removed for ownerID "+data.ownerID);
   
    callback({ success: true, message: data.roomname+' was removed'});
  });

  ///////// Game Socket Message Handlers /////////
  /* Handles start-game event from room owner and starts the Game lifecycle
    @param roomname The room to start playing.
    @param ownerID  The ID to validate if this request comes from the room owner.
    @emits game-started to all players in roomname with no data 
  */
  socket.on('start-game',(data,callback) =>{
    // Validate room and owner id
    console.log('Starting game for room: '+roomname);
  });


  ///////// Utility Socket Message Handlers /////////
   socket.on('error',(data) => {
    // Pop a dialog?
    console.log("Error from client: %o",data);
  }
  );

  socket.on('disconnect',() => {
    console.log('a user with socket.id: '+socket.id +' disconnected');
  });

}


/* Start the server */
server.listen(port, () => console.log(`Listening on port ${port}`));
///////////////  API ENDPOINTS - START ///////////////

/* /api/create-game Initializes a new game.
@param: req.params.amount  optional The number of questions to retrieve per round.  Defaults to 10 if not specified.
@param: req.params.rounds optional The number of rounds for which to receive questions. Defaults to 1 if not specified.
@return: res.send sends JSON as a resonse to the call. No explicit return.
*/
app.get('/api/create-game', (req, res) => {
    // console.log("my object: %o", req)
    result = validateParams(["owner","rounds","questions","difficulty"],req.query);
    if(!result.success){
      console.error(result.messages)  
      res.status(400).send({ game_status: 'failed', errors: result.messages});
      return;
    }

    var owner = req.query.owner;
    console.log('Owner set to: ' + owner);
  

    var questionsPerRound = req.query.questions;
    if(questionsPerRound < 1 || questionsPerRound > MAX_NUM_QUESTIONS){ questionsPerRound = DEFAULT_NUM_QUESTIONS;}
    console.log('Number of questions set to: ' + questionsPerRound);
    
    var rounds = req.query.rounds;
    if(rounds < 1 || rounds > MAX_ROUNDS){rounds = DEFAULT_NUM_ROUNDS;}
    console.log('Number of rounds set to: ' + rounds);

    var difficulty = (!req.query.difficulty || req.query.difficulty === 'any') ? null : req.query.difficulty;

    // create a new game room with the supplied parameters and add it to the list of games
    game = new GameRoom(owner,rounds,questionsPerRound,difficulty);

    gameRoomArray[game.roomName] = game;
    console.log("Room Created: %o",game);

    res.send({ game_status: 'WAITING',rounds: rounds, questions: questionsPerRound, roomname: game.roomName, owner: owner, owner_id: game.ownerID });
  });

/* /api/add-player Takes a GameRoom name a player name and adds the player to the game.
    @param roomname The room to start playing.
    @param player  The player name to add to the room.
    @returns JSON game_status: If success, player is added to the room. If failed, error message.
  */
 app.get('/api/add-player', (req, res) => {
  result = validateParams(["roomname","player"],req.query);
  if(!result.success){
    console.error(result.messages)  
    res.status(400).send({ game_status: 'failed', errors: result.messages});
    return;
  }
  if(!doesGameExist(req.query.roomname)){
    console.error("roomname not found");
    res.status(400).send({ game_status: 'failed', error: 'no such roomname found'});
    return;
  }
  
  result = addPlayer(req.query.player,req.query.roomname,{connected:false});
  if(result.success){
    const game = gameRoomArray[req.query.roomname];
    res.send({ game_status: 'success',
              room_name: req.query.roomname, 
              player: req.query.player,
              questions: game.questionCount,
              difficulty: game.difficulty,
              rounds: game.rounds,
              roomname: game.roomName, 
              owner: game.owner,
              players: game.getPlayerInfo()
            });
  } else {
    res.status(400).send({ game_status: 'failed', error: result.message});
  }
});


/* /api/remove-player Takes a GameRoom name a player name and removes player from the game.
    @param roomname The room to exit.
    @param player  The player name to remove from the room.
    @returns JSON game_status: If success, player is removed from the room. If failed, error message.
  */
 app.get('/api/remove-player', (req, res) => {
  result = validateParams(["roomname","player"],req.query);
  if(!result.success){
    console.error(result.messages)  
    res.status(400).send({ game_status: 'failed', errors: result.messages});
    return;
  }
  if(!doesGameExist(req.query.roomname)){
    console.error("roomname not found");
    res.status(400).send({ game_status: 'failed', error: 'no such roomname found'});
    return;
  }
  removePlayer(req.query.player, req.query.roomname);
  res.send({ game_status: 'success',room_name: req.query.roomname, player: req.query.player});
});



/* /api/start-game Takes a GameRoom name and ownerID and moves it from the 'WAITING' state to 'PLAYING' state.
    @param roomName The room to start playing.
    @param ownerID  The ID to validate if this request comes from the room owner.
    @returns JSON game_status: If success, GameRoom is set to PLAYING. If failed, error message.
  */
 app.get('/api/start-game', (req, res) => {
  result = validateParams(["roomname","ownerID"],req.query);
  if(!result.success){
    console.error(result.messages)  
    res.status(400).send({ game_status: 'failed', errors: result.messages});
    return;
  }
  
  if(!isGameOwner(req.query.roomname, req.query.ownerID)){
    console.error("roomname not found OR ownerID did not match with the room");
    res.status(400).send({ game_status: 'failed', error: 'no such roomname with ownerID found'});
    return;
  }
    // START THE GAME!
   gameRoomArray[req.query.roomname].gameState = 'PLAYING';

  console.log("/api/start-game called:\n"+req.query.roomname+ " removed for ownerID "+req.query.ownerID);
  res.send({ game_status: 'PLAYING',room_name: req.query.roomname});
});

  /* /api/end-game Takes a GameRoom name and ownerID and removes the game from the server.
    @param roomName The room to be removed.
    @param ownerID  The ID to validate if this request comes from the room owner.
    @returns JSON game_status: removed or failed. If success, room name. If failed, error message.
  */
app.get('/api/end-game', (req, res) => {
  result = validateParams(["roomname","ownerID"],req.query);
  if(!result.success){
    console.error(result.messages)  
    res.status(400).send({ game_status: 'failed', errors: result.messages});
    return;
  }
  
  if(!isGameOwner(req.query.roomname, req.query.ownerID)){
    console.error("roomname not found OR ownerID did not match with the room");
    res.status(400).send({ game_status: 'failed', error: 'no such roomname with ownerID found'});
    return;
  }
  if(!endGame(req.query.roomname, req.query.ownerID)){
    console.error("Unable to remove game for some reason");
    res.status(500).send({ game_status: 'failed', error: 'unable to remove game...not sure why'});
    return;
  }
  console.log("/api/end-game called:\n"+req.query.roomname+ " removed for ownerID "+req.query.ownerID);
  res.send({ game_status: 'removed',room_name: req.query.roomname});
});

/* List all games on the server. Returns the room name, the create date, players and status */
app.get('/api/list-games', (req, res) => {
  var gameList = {games: []};
  const roomIDs = Object.keys(gameRoomArray);
  console.log("Room IDs: "+roomIDs);
  roomIDs.forEach(id => {
    var gameBrief = {};
    console.log(gameRoomArray[id]);
    gameBrief["roomName"] = gameRoomArray[id].roomName;
    gameBrief["createdDate"] = gameRoomArray[id].createdDate;
    gameBrief["players"] = gameRoomArray[id].getPlayerInfo();
    gameBrief["status"] = gameRoomArray[id].state;
    gameList.games.push(gameBrief);  
  });
  console.log("/api/list-games called:\n %o",gameList);
  res.send(gameList);
});

// DEBUG - REMOVE BEFORE PROD
 app.get('/api/dump-all-games', (req, res) => {
  console.log("/api/dump-all-games called");
  res.send({gameRoomArray});
});

/////////////// API ENDPOINTS - END ///////////////




/////////////// HELPER METHODS - START /////////////// 
/* If valid room and Player doesn't already exist, adds a player to the room.
   If Player does exist but no valid socket connection exists, reconnect to this Player
  @param playerToAdd String of the player to add
  @param roomname The 4 character roomname to find
  @param socket The socket object. If there is a duplicate name, need to check if the stored socket object is connected
  @return status object If added, true. If error, false.
*/
function addPlayer(playerToAdd, roomname, socket){
  
  var result = {success: true, message: ''};
  
  if(!doesGameExist(roomname)){ // check for valid room
    result.success = false;
    result.message = "Room name doesn't exist on the server: "+roomname;
    return result;
  }  
 
  const player = getPlayer(playerToAdd,roomname);
  if(player){ // Player already exists
    if(player.socket.connected){
      result.success = false;
      result.message = "Player with name: "+ playerToAdd+" already exists and is currently connected.";
      return result;
    }
    result.message = "Reconnecting to previous session";
    player.socket = socket; // update the player's socket with new one
    console.log("Player with name: "+ playerToAdd+" reconnected to game: "+roomname);
    return result;
  }
  
  var newPlayer = new Player(playerToAdd, roomname, socket); 
  gameRoomArray[roomname].players.push(newPlayer);
  console.log("Player with name: "+playerToAdd+" added to game:"+roomname);
  result.message ='Player with name:'+playerToAdd+" added to game:"+roomname;
  return result;
}


/* Takes a player out of the room 
  @param playerToRemove String of the playerToRemove
  @param roomname The 4 character roomname to find
*/
function removePlayer(playerToRemove, roomname){
  let result = {success: true, message: 'Player '+playerToRemove+' removed from '+roomname};

  const filtered = gameRoomArray[roomname].players.filter(player => { return player.name !== playerToRemove});
  gameRoomArray[roomname].players = filtered;
  console.log('Player '+playerToRemove+' removed from '+roomname);
  return result;
}


/* Checks to see if the room exists and the owner is legit
  @param roomName The GameRoom name
  @param ownerID  An ownerID to validate with this GameRoom
*/
function isGameOwner(roomName, ownerID){
  var room = gameRoomArray[roomName];// Retrieve the GameRoom and makes sure it exists
  if(!room){ return false;}
  if(room.ownerID === ownerID){ return true;}
  return false; 
}

/* Checks to see if the room exists
  @param roomName The GameRoom name
  @return true or false if the room exists
*/
function doesGameExist(roomName){
  var room = gameRoomArray[roomName];// Retrieve the GameRoom and makes sure it exists
  if(!room){ return false;}
  return true;
}

/* Gets a player from a room
  @param roomName The GameRoom name
  @param player The Player's name to retrieve
  @return The Player object or null if no such room or player
*/
function getPlayer(playerName,roomName){
  const room = gameRoomArray[roomName]; 
  if(!room){ return null;}
  return room.getPlayer(playerName);
}

/* Validates if a list of parameters exist. Returns a result object that contains a result status and an array of error messages.
  @param params A list of parameters to check
  @param query  The query object with params
  @returns result object {success: <true|false>, messages: [<error messages>] }
*/
function validateParams(params,query){
  var result = {success: true, messages: []};
  params.forEach(param =>{ if(!query.hasOwnProperty(param)){
      result["success"] = false;
      result["messages"].push("Missing required parameter: "+param);
    }
  });
  return result;
}

/* Removes a room from the server. Called from the API and a cleanup check 
  @param roomName The GameRoom name
  @param ownerID  An ownerID to validate with this GameRoom
*/
function endGame(roomName, ownerID){
  if(!isGameOwner(roomName,ownerID)) { return false;} // checks for existence and ownership
  delete gameRoomArray[roomName];
  console.log("Removed game: "+roomName);
  return true;
}

/////////////// HELPER METHODS - END /////////////// 

/////////////// CLASS DEFINITIONS - START /////////////// 
/* The GameRoom class encapsulates all the aspects and attributes of the game room */
class GameRoom{
 

  constructor(owner,rounds,questionCount,difficulty) {
      this.TRIVIA_URI =  "https://opentdb.com/api.php";
      this.owner = owner;
      this.ownerID = this.createOwnerID();
      this.rounds = rounds;
      this.questionCount = questionCount;
      this.difficulty = difficulty;
      this.roomName = this.createRoomName();
      this.gameRoundQuestions = [];
      this.getQuestions(rounds,questionCount,difficulty);
      this.createdDate = Date.now();
      this.players = [];
      this.gameStatus = 'WAITING';
  }

  /* Retrieves a player by name 
    @param playerName
    @return the Player object or null if not found
  */
  getPlayer(playerName){
    const tmpArray = this.players.filter(player => { return player.name === playerName})
    if(tmpArray.length > 0){
      return tmpArray[0];
    }
    return null;
  }

    /* Retrieves a player by name 
    @return An array containing player name, score and if connected
  */
 getPlayerInfo(){
  let players = [];
  this.players.forEach(player => {
    players.push({name: player.name, connected: player.socket.connected, score: player.score});
    }) ;
  
  return players;
}

  /* Creates a room name with 4 alfa-numeric characters, the first being alfa
      @return the room name
  */
  createRoomName(){
  var result           = '';
  var characters       = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed digits & letters that could be confused
  var characters2       = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  
  // Ensure the first character is an Alfa
  var charactersLength = characters.length;
  result += characters.charAt(Math.floor(Math.random() * charactersLength));
  
  var charactersLength2 = characters2.length;
   for ( var i = 0; i < 3; i++ ) {
      result += characters2.charAt(Math.floor(Math.random() * charactersLength2));
   }
    return result;
  }

  /* Creates a random GUID to return to the owner's client so that only the owner can drive the game. 
      @return the owner ID
  */
 createOwnerID(){
  return uuidv4();
}


  /* Calls the opentdb.com API for each round to retrieve questions and asynchronously sets the question sets as rounds into gameRoundQuestions array
      @param: rounds required The number of rounds for which to receive quesitons. Defaults to 1 if not specified.
      @param: questionsPerRound  required The number of questions to retrieve per round.  Defaults to 10 if not specified.

  */
  getQuestions(rounds,questionsPerRound,difficulty){
    var i;
    var params = '?amount='+ questionsPerRound;

    if(difficulty !== 'any'){ params += '&difficulty='+difficulty;} // handle the any difficulty case


    for(i=0; i < rounds;i++){
      fetch(this.TRIVIA_URI + params).then(response => {
          return response.json();
      }).then(questionsJSON=>{
        console.log(`Retrieved questions Round ${i}:`);
        console.log(questionsJSON)
        this.gameRoundQuestions.push(questionsJSON);
      });
        
    } // end for loop
  }
}
/* The Player class encapsulates all the aspects and attributes of the Player */
class Player{
 
  constructor(name,activeGame,socket) {
    this.name = name;
    this.activeGame = activeGame;
    this.score = 0;
    this.socket = socket;
  }
}
/////////////// CLASS DEFINITIONS - END /////////////// 