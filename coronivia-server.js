const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
const http = require('http');
const socketIo = require("socket.io/lib");
const path = require('path');
const TriviaDB = require('./trivia-questions');
const winston = require('winston');
const fs = require('fs');


// Imports the Google Cloud client library for Winston
const {LoggingWinston} = require('@google-cloud/logging-winston');

const loggingWinston = new LoggingWinston();



const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with level `error` and below to `error.log`
    // - Write all logs with level `info` and below to `combined.log`
    //
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log', level: 'info' }),
    new winston.transports.File({ filename: 'debug.log' }),
    new winston.transports.Console({ format: winston.format.simple()})
  ],
});



if (process.env.NODE_ENV === 'production') {
  logger.add(loggingWinston);
}

// test the logging output
console.error("console.error -> coronivia-server.js log initialization test.");
console.log("console.log -> coronivia-server.js log initialization test.");
console.debug("console.debug -> coronivia-server.js log initialization test.");

logger.error("winston logger.error -> coronivia-server.js log initialization test.");
logger.info("winston logger.info -> coronivia-server.js log initialization test.");
logger.debug("winston logger.debug -> coronivia-server.js log initialization test.");


// Some meta objects for tracking objects and data across the server
const gameRoomArray = {}; // All games are stored here
const socketConnections = {}; // Tracking all socket connections
const gameStats = { // games stats since the server started
  gamesCreated: 0,
  gamesPlayed: 0,
  gamesCancelled: 0,
  playersJoined: 0,
  roundsPlayed: 0,
  questionsAnswered: 0,
  questionsServed: 0, 
  gamesAbandoned: 0,
  gamesFinished: 0,
  mostPlayersPerGame: 0,
  mostQuestionsPerGame: 0,
  categoryFrequency: { 9:0, 10:0, 15:0, 17: 0, 20:0, 21:0, 22:0, 23:0, 24:0, 31:0},
  pauseBetweenRounds: { no: 0, yes: 0},
  seconds: {5: 0,10:0, 15:0, 20:0, 30:0},
  questionFive: {yes:0, no: 0}
}; 


const app = express();
const port = process.env.PORT || 5000;
const DEFAULT_NUM_QUESTIONS = 5; // For people hacking the API
const DEFAULT_NUM_ROUNDS = 1; // For people hacking the API
const MAX_NUM_QUESTIONS = 10;
const MAX_ROUNDS = 10;

// timing intervals
const GAME_START_COUNTDOWN = 3;
const ROUND_LABEL_TIMER = 3;
const QUESTION_COUNTDOWN_DEFAULT = 15;
const SHOW_ANSWER_TIMER = 5;
const SHOW_SCORES_TIMER = 7;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(express.static(path.join(__dirname, "/public")));


///////////////  WEBSOCKET CONFIGURATION ///////////////
const server = http.createServer(app);
const io = socketIo(server); // setup the websocket


io.on('connection',handleNewSocketConnection);

function handleNewSocketConnection(socket){
  logger.debug('a user connected with socket.id: '+socket.id);  

  ///////// Socket Message Handlers /////////

  /* Create a game 
    @param rounds The number of game rounds
    @param questions The number of questions per round
    @param difficulty any|easy|medium|hard
    @param owner Name of the owner
    @return All submitted params + game room name and ownerID
  */
  socket.on('create-game',(data,callback)=>{
    gameStats.gamesCreated++;

    logger.debug('Handled create-game event with data:');
    logger.debug(data);
    let result = validateParams(["owner","rounds","questions","difficulty","categories"],data);
    if(!result.success){
      console.error(result.messages); 
      callback({ success: false, error: result.messages});
      return;
    }
 
    let owner = data.owner;
    let difficulty = data.difficulty;

    var questionsPerRound = data.questions;
    if(questionsPerRound < 1 || questionsPerRound > MAX_NUM_QUESTIONS){ questionsPerRound = DEFAULT_NUM_QUESTIONS;}
    logger.debug('Number of questions set to: ' + questionsPerRound);
    
    let rounds = data.rounds;
    if(rounds < 1 || rounds > MAX_ROUNDS){rounds = DEFAULT_NUM_ROUNDS;}
    logger.debug('Number of rounds set to: ' + rounds);


    let questionCountdown = data.questionCountdown ? data.questionCountdown : QUESTION_COUNTDOWN_DEFAULT;
    gameStats.seconds[questionCountdown]++;

    let pauseBetweenRounds = data.pauseBetweenRounds ? data.pauseBetweenRounds : false;
    (pauseBetweenRounds) ? gameStats.pauseBetweenRounds.yes++ : gameStats.pauseBetweenRounds.no++;

    let questionFive = data.questionFive ? data.questionFive : false;
    (questionFive) ? gameStats.questionFive.yes++ : gameStats.questionFive.no++;

      // If the categories array is empty, set the category to General by default
    let categories = (data.categories.length === 0) ? [9] : data.categories;
    categories.forEach(category =>gameStats.categoryFrequency[category]++);

     // create a new game room with the supplied parameters and add it to the list of games
    let game = new GameRoom(owner,rounds,questionsPerRound,difficulty,questionCountdown,pauseBetweenRounds,questionFive, categories);
 
     gameRoomArray[game.roomName] = game;
    
     logger.info("Game created -> roomname: "+game.roomName+" owner: "+game.owner+" rounds: "+game.rounds+" qs/rnd: "+game.questionCount+
                    " difficulty: "+game.difficulty+ " pauseBetweenRounds: "+game.pauseBetweenRounds+" questionFive: "+game.questionFive);
     callback({ success: true, 
                gameStatus: 'WAITING',
                rounds: game.rounds, 
                questions: questionsPerRound, 
                roomname: game.roomName,
                difficulty: game.difficulty, 
                owner: owner,
                player: owner,
                ownerID: game.ownerID,
                pauseBetweenRounds: game.pauseBetweenRounds,
                questionFive: game.questionFive,
                players: [] });
     });

  /* Add player to a game 
    @param roomname
    @param player
    @emits player-change event to all in roomname 
  */
  socket.on('join',(data,callback)=>{
    gameStats.playersJoined++; // log data
    logger.debug('Handled join event with data %o',data);
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
  
    // Add user to a room and track that room globally. On disconnect the room will be updated and the user removed from tracking.
    socket.join(data.roomname);
    socketConnections[socket.id] = data.roomname; // this would run the server out of memory, eventually, without cleanup
  
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
                          ownerID: (data.player === game.owner)? game.ownerID : null,
                          pauseBetweenRounds: game.pauseBetweenRounds,
                          questionFive: game.questionFive,
                          players: game.getPlayerInfo()
      }
      logger.debug("Sending gameConfig: %o",gameConfig);
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
    @emits player-change event to all in roomname
  */
  socket.on('remove-player',(data,callback)=>{
   
    logger.debug('Handled remove-player event with data %o',data);
   
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
    let game = gameRoomArray[data.roomname];

    if(removePlayerResult.success){
      logger.debug("Successfully removed player "+data.player+" number of remaining players: "+game.players.length );

      if(game.players.length > 0){ // Only send an event if there is someone to send it to
        // Tell everyone that the Players have changed
        io.to(data.roomname).emit('player-change',game.getPlayerInfo());
        callback({ success: true, error: 'Player '+data.player+' removed from room '+data.roomname});
      } else {
        // end the game since there is no one left!
        logger.debug("All players have left game "+game.roomName+". Ending game.");
        gameStats.gamesAbandoned++;
        endGame(game.roomName, game.ownerID);
      }
    } else {
      // probably useless since the client already left...
      callback({ success: false, error: removePlayerResult.messages});
    }

  });
  
  socket.on('cancel-game',(data,callback) =>{
    gameStats.gamesCancelled++;
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
  
    let game = gameRoomArray[data.roomname];
    io.to(data.roomname).emit('player-change',game.getPlayerInfo()); // Update all the scores

    if(!endGame(data.roomname, data.ownerID)){
      console.error("Unable to remove game for some reason");
      callback({ success: false, error: 'unable to remove game...not sure why'});
      return;
    }
  
    io.to(data.roomname).emit('game-cancelled',{success: true, message: data.roomname+' was removed'}); // cancel for all
    logger.debug("cancel-game called: room "+data.roomname+ " removed for ownerID "+data.ownerID);
   
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
    gameRoom = gameRoomArray[data.roomname];
    gameRoom.gameStatus = 'PLAYING';
    logger.debug('Starting game for room: '+data.roomname);
    logger.info('Starting game -> '+data.roomname+' with players: '+gameRoom.players.length);
    logger.info(gameRoom.getPlayerInfo());
    
    gameStats.gamesPlayed++;
    gameStats.mostPlayersPerGame = ( gameRoom.players.length > gameStats.mostPlayersPerGame ) ? gameRoom.players.length : gameStats.mostPlayersPerGame;

    io.to(gameRoom.roomName).emit('game-start',{ gameStatus: 'PLAYING' }); // Issue game start!
    logger.debug('Issued game-start event to Game Room: '+gameRoom.roomName);
   
   // createTimer(gameRoom.roomName,GAME_START_COUNTDOWN,'countdown-round',"The Game is starting!",gameRoom,gameRoom.startRound);
   gameRoom.startRound(gameRoom); // Start the 1st Round

    callback({success: true, message: 'Game started'});
  });

  /* Handles a player-answer event. Checks if the answer is correct and if so, increments the player's score 
    @param data.player The player name
    @param data.gameRoomName The four character game room number
    @param data.answer The selcted answer from the user
  */
  socket.on('player-answer',(data,callback) =>{
    gameStats.questionsAnswered++;

    let result = validateParams(["gameRoomName","player","playerAnswer"],data);
   
    if(!result.success){
      console.error(result.messages);
      callback({ success: false, error: result.messages});
      return;
    }
   
    if(!doesGameExist(data.gameRoomName)){
      console.error("Player "+data.player+" attempted to answer a question for non-existant room: "+data.gameRoomName);
      callback({ success: false, error: 'No such roomname found: '+data.gameRoomName});
      return;
    }
    
    let pointsEarned = 0;
    let gameRoom = gameRoomArray[data.gameRoomName];
    let currentRoundObj = gameRoom.getCurrentRound();
    let currentQuestion = currentRoundObj.getCurrentQuestion();
    if(currentQuestion){
      logger.debug("DEBUG player-answer: Player "+ data.player + " answered "+data.playerAnswer+" correct answer is "+currentQuestion.correctAnswer);
      if(data.playerAnswer === currentQuestion.correctAnswer) {
        let points = currentQuestion.questionData.pointValue;
        gameRoom.getPlayer(data.player).updateScore(points);
        pointsEarned = points;
        logger.debug("Player earned: "+points);
      }
      callback({success: true, points: pointsEarned});
    } else {
      logger.debug("Player was too late answering question and no current question exists!");
      callback({ success: false, error: 'Answer was too late!'});
    }
  
  });


   /* Handles the owner clicking the next round button. Starts the next round
    @param data.ownerID The owner id
    @param data.roomname The four character game room number

  */
 socket.on('continue-round',(data,callback) =>{
 // Validate room and owner id
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
 gameRoom = gameRoomArray[data.roomname];
 logger.debug('Continuing game for room: '+data.roomname+" round: "+gameRoom.currentRoundNumber);
 
gameRoom.startRound(gameRoom); // Start the next round

 callback({success: true, message: 'Game continued.'});
 });



  ///////// Utility Socket Message Handlers /////////
   socket.on('error',(data) => {
    // Pop a dialog?
    logger.debug("Error from client: %o",data);
  }
  );

  socket.on('disconnect',() => {
    
    logger.debug('A user with socket.id: '+socket.id +' disconnected');


    const roomname =  socketConnections[socket.id];
    const game = gameRoomArray[roomname];
    if(game && game.hasConnectedPlayers()){ // make sure it still exists as a cancel game may have removed it and it has active users
       logger.debug('Sending players list update to room: '+roomname);
       io.to(roomname).emit('player-change',game.getPlayerInfo());
    }
    delete socketConnections[socket.id]; // Remove user from the users in rooms

    // Remove the game is there are no connected users
    // If game is in WAITING, user might disconnect when windowing on a mobile device and so allow that case
    if(game && !game.hasConnectedPlayers() && game.gameStatus !== 'WAITING'){
      logger.debug('On user disconnect, game '+game.roomName+' has no more active players. Removing.');
      endGame(game.roomName,game.ownerID);
    }
  });

}


/* Start the server */
const startTime = (new Date()).toTimeString();
server.listen(port, () => logger.debug(`Listening on port ${port} at ${startTime}`));




/////////////// HELPER METHODS - START /////////////// 

/* Creates a timer for a particular room to display a countdown 
  @param roomname The room to broadcast the timer
  @param secs How many seconds for the countdown 
  @param event type of event to emit
  @param message Message to show with the countdown timer
  @param gameRoom The GameRoom object, needed so that the game context can be provided to the callback
  @param callback Function to call once the countdown has elapsed
*/
function createTimer(roomName,secs,event,message,showCountdown,gameRoom,callback){

  // Check if room still exists. The game may have been cancelled and if so, we want to return, which will break the game cycle.
  if(!gameRoomArray[roomName]){
      logger.debug("No roomName: "+roomName +" found in createTimer(). The game has been cancelled so ending game cycle.");
      return;
  }
  
  logger.debug('DEBUG: createTimer() called with roomName: ' + roomName + ' secs: '+ secs + ' event: '+event+ ' message: '+ message + ' gameRoom object with owner: '+ gameRoom.owner + ' callback: '+callback.name );
  let interval = secs; // Used for calculating the % time remaining on the client side
  let timer = setInterval(()=>{
    io.to(roomName).emit(event,{ count: secs, timerMessage: message, showCountdown: showCountdown, interval: interval }); // Update all the scores
    secs--;
    if(secs == -2){
      clearInterval(timer);
      io.to(roomName).emit('clear-countdown',{});
      callback(gameRoom);
    }
  },1000);
}



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
    logger.debug("Player with name: "+ playerToAdd+" reconnected to game: "+roomname);
    return result;
  }
  
  var newPlayer = new Player(playerToAdd, roomname, socket); 
  gameRoomArray[roomname].players.push(newPlayer);
  logger.debug("Player with name: "+playerToAdd+" added to game:"+roomname);
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
  logger.debug('Player '+playerToRemove+' removed from '+roomname);
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
  if(!isGameOwner(roomName,ownerID)) { 
      logger.debug("No game matched roomName: "+roomName+" ownerID: "+ownerID); 
      return false;
    } // checks for existence and ownership

  const game = gameRoomArray[roomName];
  logger.info("Game ended -> roomname: "+game.roomName+" owner: "+game.owner+" rounds: "+game.rounds+" ended on round: "+game.currentRoundNumber+ 
              " players at end: "+game.players.length);
  logger.info(game.getPlayerInfo());
  logger.info(JSON.stringify(gameStats));

  delete gameRoomArray[roomName];
  logger.debug("Removed game with roomName: "+roomName+ " and ownerID: "+ownerID );
  return true;
}

/* takes an Array and shuffles the order 
  @param Array to shuffle
  @return Shuffled array
*/
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}


/////////////// HELPER METHODS - END /////////////// 

/////////////// CLASS DEFINITIONS - START /////////////// 
/* The GameRoom class encapsulates all the aspects and attributes of the game room */
class GameRoom{

  constructor(owner,rounds,questionCount,difficulty,questionCountdown,pauseBetweenRounds,questionFive, categories) {
      this.TRIVIA_URI =  "https://opentdb.com/api.php";
      this.owner = owner;
      this.ownerID = this.createOwnerID();
      this.questionCount = questionCount;
      this.difficulty = difficulty;
      this.roomName = this.createRoomName();
      this.gameRoundArray = [];
      this.getQuestions(rounds,questionCount,difficulty,categories);
      this.createdDate = Date.now();
      this.players = [];
      this.gameStatus = 'WAITING';
      this.currentRoundNumber = 0;
      this.questionCountdown = questionCountdown;
      this.pauseBetweenRounds = pauseBetweenRounds;
      this.questionFive = questionFive;

      // This handles the case where we may have fewer questions per round than the user asked for
      this.rounds = this.gameRoundArray.length;
  }

  /* Checks to see if there are players still connected to the game 
    @return true if at least one connected player, false if no connected players
  */
  hasConnectedPlayers() { 
    let hasConnected = false;
    this.players.forEach(player =>{
        if(player.socket.connected){
          hasConnected = true;
          return;
        }
    });
    return hasConnected;
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

  /* Calls the local data structure to retrieve questions and asynchronously sets the question sets as rounds into gameRoundQuestions array
      @param rounds required The number of rounds for which to receive quesitons. Defaults to 1 if not specified.
      @param questionsPerRound  required The number of questions to retrieve per round.  Defaults to 10 if not specified.
      @param difficulty A string for the question difficulty (any | easy | medium | hard)
      @param categories An array of category numbers to choose from

  */
  getQuestions(rounds,questionsPerRound,difficulty, categories){

    let totalQuestions = rounds * questionsPerRound;

    if(totalQuestions > gameStats.mostQuestionsPerGame){gameStats.mostQuestionsPerGame = totalQuestions; }

    const questions = TriviaDB.getTriviaQuestions(categories,(totalQuestions), difficulty);
    console.debug("DEBUG getQuestions() -> received "+questions.length+" questions");

    // Create questionObjects out of the questions
    const questionObjArray = [];
    questions.forEach((rawQuestion)=>{
      questionObjArray.push(new Question(rawQuestion));
    });

    // slice up the questionObjArray into Rounds
    let start = 0;
    let end = questionsPerRound;
    let i;
    for(i=0; i < rounds;i++){
        start = i * questionsPerRound;
        end = start + questionsPerRound;

        // Check case if we ran out of questions
        if(start >= questions.length){ 
          logger.debug("Ran out of questions for user selected criteria: \n"+
                      "  categories: "+categories+"\n"+
                      "  difficulty: "+difficulty+"\n"+
                      "  rounds: "+rounds+"\n"+
                      "  questionsPerRound: "+questionsPerRound+"\n"+
                      "User asked for: "+totalQuestions+" but we only had "+questions.length
                    );
          return;
        }
        let round = new Round(questionObjArray.slice(start,end));
        this.gameRoundArray.push(round);

    }
        
  }

  /* Starts the round with the current this.currentRoundNumber. 
    @param Takes a reference to the game object to start
    TODO: Instead of passing gameRoom around, refactor to use bind to 'this'
  */
  startRound(gameRoom){
    //TODO: Check to see that at least one client is connected. Otherwise end the game and clean-up

    if(gameRoom.hasMoreRounds()){ // this check handles the impossible case that there are zero rounds...
      gameStats.roundsPlayed++;

      let roundTitle = 'Starting Round ' + (gameRoom.currentRoundNumber + 1) + ' of '+gameRoom.rounds;
      logger.debug("Starting " + roundTitle);
      createTimer(gameRoom.roomName,ROUND_LABEL_TIMER,'countdown-round',roundTitle,true,gameRoom,gameRoom.playRound);
    } else { // Out of rounds, end the the game
      gameRoom.endGame();
    }
  }
  
  /* Helper method to see if there are more rounds to go
    @return boolean whether there are more rounds to play
  */
  hasMoreRounds(){
    let hasMore = (this.currentRoundNumber == this.rounds)? false : true ;
    logger.debug("DEBUG hasMoreRounds(): this.currentRoundNumber: "+this.currentRoundNumber+
      " this.rounds: "+this.rounds+" hasMore: "+hasMore);
    return hasMore;
  }
 
  /* Gets the next question and sends it. Ends round if no more questions. 
    @param gameRoom The game object passed through the callback
  */
  playRound(gameRoom){
    let round = gameRoom.getCurrentRound(); // We know there is one because we checked in startRound()

    if(round && round.hasMoreQuestions()){
      gameRoom.sendNextQuestion(round.getCurrentQuestion(),gameRoom.currentRoundNumber,round.currentQuestionNumber,round.numberOfQuestions);
    } else {
      gameRoom.endRound();
    }
  }

  /* Sends the question to the clients  
    @param question The question object to send 
    @param currentRoundNumber  The current round number, zero indexed
    @param questionNumber The current question number
    @param totalQuestions The count of questions in this round.  
  */
  sendNextQuestion(question,currentRoundNumber, questionNumber, totalQuestions){
    gameStats.questionsServed++;

    currentRoundNumber++; // For labeling
    questionNumber++; // For labeling
    let questionTitle = 'Question '+questionNumber+' of '+totalQuestions;
    let data = { currentRoundNumber: currentRoundNumber, questionNumber: questionNumber, totalQuestions: totalQuestions, question: question.questionData };
    console.debug("Room "+ this.roomName + ": sending round "+currentRoundNumber+" of "+this.rounds+", question "+questionNumber+" of "+totalQuestions);
    
    io.to(this.roomName).emit('question',data);

    createTimer(this.roomName,this.questionCountdown,'countdown-question',questionTitle,true,this,this.sendAnswer);
  }

  /* Shows the answer to the current question and calls playRound after an interval.
      Also increments the currentQuestion for the next round
    @emits answer event with the correct answer
  */
 sendAnswer(gameRoom){
  let currentRoundObj = gameRoom.getCurrentRound();
  let currentQuestionObj = currentRoundObj.getCurrentQuestion();
  // logger.debug("DEBUG: In sendAnswer() currentQuestionObj: %o ",currentQuestionObj);
  try{
    io.to(gameRoom.roomName).emit('answer',{answer: currentQuestionObj.correctAnswer}); 
  } catch(err){
    console.error('Caught error: '+err);
  }

  let answerTitle = 'Answer';
  currentRoundObj.currentQuestionNumber++;
  //createTimerNoCountdown(gameRoom.roomName,SHOW_ANSWER_TIMER,'countdown-answer',answerTitle,gameRoom,gameRoom.playRound);
  createTimer(gameRoom.roomName,SHOW_ANSWER_TIMER,'countdown-answer',answerTitle,false,gameRoom,gameRoom.playRound);
}

  /* Ends the current round and sends player-change data, followed by a show-scores timed message 
    Increments the currentRoundNumber by 1. If pauseBetweenRounds has been set, the client knows to display a button
    @emits round-end With player info to update and show scores
  */
  endRound(){
    // Check if game ended 
    this.currentRoundNumber++;
    let gameEnded = (this.rounds === this.currentRoundNumber)? true : false;

    logger.debug("Room "+this.roomName+" ending Round "+this.currentRoundNumber);

    io.to(this.roomName).emit('round-end',{playerArray: this.getPlayerInfo(), gameEnded:gameEnded});
    
    let roundMessage = (gameEnded )? 'Final Round Scores!':'Scores after Round '+ this.currentRoundNumber;
    
    let callback = (!this.pauseBetweenRounds || gameEnded || this.isOwnerAbsent() ) ? this.startRound : ()=>logger.debug("Waiting for Owner to start the next round");

    createTimer(this.roomName,SHOW_SCORES_TIMER,'countdown-endround',roundMessage,false,this,callback);
  }

  /* Tells the clients the game is over. Emits a game ending event and closes all the sockets
    @emits game-ended With the winner 
  */
  endGame(){
    gameStats.gamesFinished++;

    let winningPlayerArray = this.getWinners();
    logger.debug("sending winner array:")
    logger.debug(winningPlayerArray);
    io.to(gameRoom.roomName).emit('game-ended',{winningPlayerArray: winningPlayerArray, count:0});
    logger.debug('Pausing for a second before game cleanup for '+gameRoom.roomName);
    
    // delay 1 second before disconnecting all sockets to ensure the emissions happen
    setTimeout(function(){
      logger.debug("Closing all the sockets for room "+gameRoom.roomName);
      gameRoom.players.forEach(player=>{
        player.socket.disconnect(true);
        logger.debug('Disconnected socket for player: '+player.name);
      });
  
      gameRoom.gameStatus = 'ENDED';
      logger.debug('Calling external function to delete game');
      endGame(gameRoom.roomName, gameRoom.ownerID);
    }, 1000);

  
}

/* Determines if the owner still connected 
  @return True if absent, False if present and connected
*/
isOwnerAbsent(){
  return (!this.getPlayer(this.owner) || !(this.getPlayer(this.owner)).socket.connected) ? true : false;
}

/*
  Returns the player with the highest score
  @return array of winning players
*/
getWinners(){
  let winningPlayers = [];
  let highScore = 0;
  
  this.players.forEach(player=>{ // find the high score
    if(player.score > highScore){
        highScore = player.score;
    }
  });

  this.players.forEach(player=>{ // put players with matching high scores into the result array
    if(player.score === highScore){
        winningPlayers.push({name:player.name,score:player.score});
    }
  });

  return winningPlayers;
}

  /* Returns the current round  
    @return The 
  */
 getCurrentRound(){
  return this.gameRoundArray[this.currentRoundNumber];
}


} // End GameRoom class

/* The Round class is a thin object wrapper to hold round questions. The order of Round objects  in the 
gameRound array is the order of Rounds (duh ;)  */
class Round {
  constructor(questionArray){
    this.questionArray = questionArray;
    this.currentQuestionNumber = 0;
    this.numberOfQuestions = questionArray.length;
  }


  /* Helper method to encapsulate question iteration 
    @return boolean if there are more*/
  hasMoreQuestions(){
    return (this.currentQuestionNumber === this.numberOfQuestions)? false : true ;
  }

  /* Returns the currently active question
    @return the current question object 
  */
  getCurrentQuestion(){
    let currentQuestionObj = this.questionArray[this.currentQuestionNumber];
//    logger.debug('DEBUG: in getCurrentQuestion() this.questionArray: o%',this.questionArray);
//    logger.debug('DEBUG: in getCurrentQuestion() and currentQuestion: o%',currentQuestionObj);
    return currentQuestionObj;
  }

}

/* The Question class encapsulates all the aspects of a question. It's constructed with a question JSON from 
   opentdb.com and parses it into a format that can be queried and sent to clients */
class Question{
  constructor(questionJSON){
    let pointValuesObj = {easy: 10, medium: 30, hard: 50};

    this.correctAnswer = questionJSON.correct_answer;
    this.questionData ={
      category: questionJSON.category,
      sub_category: questionJSON.sub_category,
      type: questionJSON.type,
      difficulty: questionJSON.difficulty,
      question: questionJSON.question,
      answers: questionJSON.incorrect_answers,
      pointValue: pointValuesObj[questionJSON.difficulty]
    };
    this.questionData.answers.push(this.correctAnswer);
    this.questionData.answers = shuffle(this.questionData.answers);
    // console.debug("DEBUG: Successfully created question with questionData: %o",this.questionData);

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

  /* Takes points and adds them to score
    @param points
  */
  updateScore(points){
    this.score += points;
  }
}
/////////////// CLASS DEFINITIONS - END /////////////// 

///////////////  API ENDPOINTS - START ///////////////

/* /api/create-game Initializes a new game.
@param: req.params.amount  optional The number of questions to retrieve per round.  Defaults to 10 if not specified.
@param: req.params.rounds optional The number of rounds for which to receive questions. Defaults to 1 if not specified.
@return: res.send sends JSON as a resonse to the call. No explicit return.
*/
app.get('/api/create-game', (req, res) => {
  // logger.debug("my object: %o", req)
  result = validateParams(["owner","rounds","questions","difficulty","categories"],req.query);
  if(!result.success){
    console.error(result.messages)  
    res.status(400).send({ game_status: 'failed', errors: result.messages });
    return;
  }

  var owner = req.query.owner;
  logger.debug('Owner set to: ' + owner);


  var questionsPerRound = req.query.questions;
  if(questionsPerRound < 1 || questionsPerRound > MAX_NUM_QUESTIONS){ questionsPerRound = DEFAULT_NUM_QUESTIONS; }
  logger.debug('Number of questions set to: ' + questionsPerRound);
  
  var rounds = req.query.rounds;
  if(rounds < 1 || rounds > MAX_ROUNDS){rounds = DEFAULT_NUM_ROUNDS; }
  logger.debug('Number of rounds set to: ' + rounds);


  var pauseBetweenRounds = (req.query.pauseBetweenRounds) ? req.query.pauseBetweenRounds : false; 

  var difficulty = req.query.difficulty;

  // If the categories array is empty, set the category to General by default
  var categories = (categories.length === 0)? [9]:req.query.categories;

  // create a new game room with the supplied parameters and add it to the list of games
  game = new GameRoom(owner,rounds,questionsPerRound,difficulty,pauseBetweenRounds, categories);

  gameRoomArray[game.roomName] = game;
  logger.debug("Room Created: %o",game);

  res.send({ game_status: 'WAITING',rounds: rounds, questions: questionsPerRound, roomname: game.roomName, owner: owner, owner_id: game.ownerID });
})

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
  res.status(400).send({ game_status: 'failed', error: 'no such roomname found' });
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
  res.status(400).send({ game_status: 'failed', error: result.message });
}
})


/* /api/remove-player Takes a GameRoom name a player name and removes player from the game.
  @param roomname The room to exit.
  @param player  The player name to remove from the room.
  @returns JSON game_status: If success, player is removed from the room. If failed, error message.
*/
app.get('/api/remove-player', (req, res) => {
result = validateParams(["roomname","player"],req.query);
if(!result.success){
  console.error(result.messages)  
  res.status(400).send({ game_status: 'failed', errors: result.messages });
  return;
}
if(!doesGameExist(req.query.roomname)){
  console.error("roomname not found");
  res.status(400).send({ game_status: 'failed', error: 'no such roomname found' });
  return;
}
removePlayer(req.query.player, req.query.roomname);
res.send({ game_status: 'success',room_name: req.query.roomname, player: req.query.player });
})



/* /api/start-game Takes a GameRoom name and ownerID and moves it from the 'WAITING' state to 'PLAYING' state.
  @param roomName The room to start playing.
  @param ownerID  The ID to validate if this request comes from the room owner.
  @returns JSON game_status: If success, GameRoom is set to PLAYING. If failed, error message.
*/
app.get('/api/start-game', (req, res) => {
result = validateParams(["roomname","ownerID"],req.query);
if(!result.success){
  console.error(result.messages)  
  res.status(400).send({ game_status: 'failed', errors: result.messages });
  return;
}

if(!isGameOwner(req.query.roomname, req.query.ownerID)){
  console.error("roomname not found OR ownerID did not match with the room");
  res.status(400).send({ game_status: 'failed', error: 'no such roomname with ownerID found' });
  return;
}
  // START THE GAME!
 gameRoomArray[req.query.roomname].gameState = 'PLAYING';

logger.debug("/api/start-game called:\n"+req.query.roomname+ " removed for ownerID "+req.query.ownerID);
res.send({ game_status: 'PLAYING',room_name: req.query.roomname });
})

/* /api/end-game Takes a GameRoom name and ownerID and removes the game from the server.
  @param roomName The room to be removed.
  @param ownerID  The ID to validate if this request comes from the room owner.
  @returns JSON game_status: removed or failed. If success, room name. If failed, error message.
*/
app.get('/api/end-game', (req, res) => {
result = validateParams(["roomname","ownerID"],req.query);
if(!result.success){
  console.error(result.messages)  
  res.status(400).send({ game_status: 'failed', errors: result.messages });
  return;
}

if(!isGameOwner(req.query.roomname, req.query.ownerID)){
  console.error("roomname not found OR ownerID did not match with the room");
  res.status(400).send({ game_status: 'failed', error: 'no such roomname with ownerID found' });
  return;
}
if(!endGame(req.query.roomname, req.query.ownerID)){
  console.error("Unable to remove game for some reason");
  res.status(500).send({ game_status: 'failed', error: 'unable to remove game...not sure why' });
  return;
}
logger.debug("/api/end-game called:\n"+req.query.roomname+ " removed for ownerID "+req.query.ownerID);
res.send({ game_status: 'removed',room_name: req.query.roomname });
})

/* List all games on the server. Returns the room name, the create date, players and status */
app.get('/api/list-games', (req, res) => {
var gameList = {games: []};
const roomIDs = Object.keys(gameRoomArray);
logger.debug("Room IDs: "+roomIDs);
roomIDs.forEach(id => {
  var gameBrief = {};
  gameBrief["roomName"] = gameRoomArray[id].roomName;
  gameBrief["createdDate"] = gameRoomArray[id].createdDate;
  gameBrief["players"] = gameRoomArray[id].getPlayerInfo();
  gameBrief["status"] = gameRoomArray[id].state;
  gameList.games.push(gameBrief);  
  });
  logger.debug("/api/list-games called:\n %o",gameList);
  res.send(gameList);
})

// DEBUG - REMOVE BEFORE PROD
app.get('/api/dump-all-games', (req, res) => {
  logger.debug("/api/dump-all-games called");
  res.send({ gameRoomArray });
})

// DEBUG - REMOVE BEFORE PROD
app.get('/api/get-all-users', (req, res) => {
  logger.debug("/api/get-all-users called");
  res.send({ socketConnections });
})

// DEBUG - REMOVE BEFORE PROD
app.get('/api/info', (req, res) => {
  logger.debug("/api/info called");
  res.send({gameStats});
})

// DEBUG - REMOVE BEFORE PROD
app.get('/api/debug', (req, res) => {
  logger.debug("/api/info called");
  const debugLog = fs.readFileSync('debug.log').toString();
  res.send({ debugLog });
})

// DEBUG - REMOVE BEFORE PROD
app.get('/api/error', (req, res) => {
  logger.debug("/api/error called");
  const errorLog = fs.readFileSync('error.log').toString();
  errorLog 
  res.send({ errorLog });
})

// DEBUG - REMOVE BEFORE PROD
/* Send an event to all clients */
app.get('/api/send-event', (req, res) => {
result = validateParams(["e","d"],req.query);
if(!result.success){
  console.error(result.messages)  
  res.status(400).send({ success: false, errors: result.messages });
  return;
}

  logger.debug("/api/send-event called");
  const roomIDs = Object.keys(gameRoomArray);
  const event = req.query.e;
  const queryData = JSON.parse(req.query.d);
  logger.debug(queryData);
  roomIDs.forEach(id => {
    const gameRoom = gameRoomArray[id];
    
    io.to(gameRoom.roomName).emit(event,queryData);
  });
  res.send({message: 'sent event to all clients: '+req.query.e, data: queryData});
})

// Catch all route to send to the static React app
app.get("/*",(req,res) => {
  res.sendFile(path.join(__dirname, "/public/index.html"));
});

/////////////// API ENDPOINTS - END ///////////////
