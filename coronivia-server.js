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

// timing intervals
const GAME_START_COUNTDOWN = 3;
const ROUND_LABEL_TIMER = 3;
const QUESTION_COUNTDOWN = 15;
const SHOW_ANSWER_TIMER = 5;
const SHOW_SCORES_TIMER = 10;

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
    let game = new GameRoom(owner,rounds,questionsPerRound,difficulty);
 
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
    @emits player-change event to all in roomname
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
  
    let game = gameRoomArray[data.roomname];
    io.to(data.roomname).emit('player-change',game.getPlayerInfo()); // Update all the scores

    if(!endGame(data.roomname, data.ownerID)){
      console.error("Unable to remove game for some reason");
      callback({ success: false, error: 'unable to remove game...not sure why'});
      return;
    }
  
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
    console.log('Starting game for room: '+data.roomname);
    
    io.to(gameRoom.roomName).emit('game-start',{ gameStatus: 'PLAYING' }); // Issue game start!
    console.log('Issued game-start event to Game Room: '+gameRoom.roomName);
   
    createTimer(gameRoom.roomName,GAME_START_COUNTDOWN,"The Game is starting!",gameRoom,gameRoom.startRound);
   
    callback({success: true, message: 'Game started'});
  });

  /* Handles a player-answer event. Checks if the answer is correct and if so, increments the player's score 
    @param data.player The player name
    @param data.gameRoomName The four character game room number
    @param data.answer The selcted answer from the user
  */
  socket.on('player-answer',(data,callback) =>{
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
    console.log("DEBUG player-answer: Player "+ data.player + " answered "+data.playerAnswer+" correct answer is "+currentQuestion.correctAnswer);
    if(data.playerAnswer === currentQuestion.correctAnswer) {
      let points = currentQuestion.questionData.pointValue;
      gameRoom.getPlayer(data.player).updateScore(points);
      pointsEarned = points;
      console.log("Player earned: "+points);
    }
    
    callback({success: true, points: pointsEarned})
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




/////////////// HELPER METHODS - START /////////////// 

/* Creates a timer for a particular room to display a countdown 
  @param roomname The room to broadcast the timer
  @param secs How many seconds for the countdown 
  @param message Message to show with the countdown timer
  @param gameRoom The GameRoom object, needed so that the game context can be provided to the callback
  @param callback Function to call once the countdown has elapsed
*/
function createTimer(roomName,secs,message,gameRoom,callback){
  
  console.log('DEBUG: createTimer() called with roomName: ' + roomName + ' secs: '+ secs + ' message: '+ message + ' gameRoom object with owner: '+ gameRoom.owner + ' callback: '+callback.name );

  let timer = setInterval(()=>{

    io.to(roomName).emit('countdown',{ count: secs, timerMessage: message, showCountdown: true }); // Update all the scores
    secs--;
    if(secs === 0){
      clearInterval(timer);
      io.to(roomName).emit('clear-countdown',{});
      callback(gameRoom);
    }
  },1000);
}

/* Creates a timer for a particular room to show a message
  @param roomname The room to send the timer
  @param secs How many seconds to display a message
  @param message Message to show
  @param gameRoom The GameRoom object, needed so that the game context can be provided to the callback
  @param callback Function to call once the timer has elapsed
*/
function createTimerNoCountdown(roomName,secs,message,gameRoom,callback){
  console.log('DEBUG: createTimerNoCountdown() called with roomName: ' + roomName + ' secs: '+ secs + ' message: '+ message + ' gameRoom object with owner: '+ gameRoom.owner + ' callback: '+callback.name);

  io.to(roomName).emit('countdown',{count: secs,timerMessage: message, showCountdown: false});
  let timer = setInterval(()=>{
    secs--;
    if(secs === 0){
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

  constructor(owner,rounds,questionCount,difficulty) {
      this.TRIVIA_URI =  "https://opentdb.com/api.php";
      this.owner = owner;
      this.ownerID = this.createOwnerID();
      this.rounds = rounds;
      this.questionCount = questionCount;
      this.difficulty = difficulty;
      this.roomName = this.createRoomName();
      this.gameRoundArray = [];
      this.getQuestions(rounds,questionCount,difficulty);
      this.createdDate = Date.now();
      this.players = [];
      this.gameStatus = 'WAITING';
      this.currentRoundNumber = 0;
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
        console.log('Retrieved ' + questionsJSON.results.length + ' questions for Round '+ i);
        let round = new Round(Question.parseQuestions(questionsJSON));
        this.gameRoundArray.push(round);
      });
        
    } // end for loop
  }

  /* Starts the round with the current this.currentRoundNumber. 
  */
  startRound(gameRoom){
    //TODO: Check to see that at least one client is connected. Otherwise end the game and clean-up

    if(gameRoom.hasMoreRounds()){ // this check handles the impossible case that there are zero rounds...
      let roundTitle = 'Round ' + (gameRoom.currentRoundNumber + 1) + ' of '+gameRoom.rounds;
      console.log("Starting " + roundTitle);
      createTimerNoCountdown(gameRoom.roomName,ROUND_LABEL_TIMER,roundTitle,gameRoom,gameRoom.playRound);
    } else { // Out of rounds, end the the game
      gameRoom.endGame();
    }
  }
  
  /* Helper method to see if there are more rounds to go
    @return boolean whether there are more rounds to play
  */
  hasMoreRounds(){
    return (this.currentRoundNumber === this.rounds)? false : true ;
  }
 
  /* Gets the next question and sends it. Ends round if no more questions. 
    @param gameRoom The game object passed through the callback
  */
  playRound(gameRoom){
    let round = gameRoom.getCurrentRound(); // We know there is one because we checked in startRound()

    if(round.hasMoreQuestions()){
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
    currentRoundNumber++; // For labeling
    questionNumber++; // For labeling
    let questionTitle = 'Round ' + currentRoundNumber + ', Question '+questionNumber+' of '+totalQuestions;
    let data = { currentRoundNumber: currentRoundNumber, questionNumber: questionNumber, totalQuestions: totalQuestions, question: question.questionData };
    console.log("Sending question: %o",data);
    
    io.to(this.roomName).emit('question',data);

    createTimer(this.roomName,QUESTION_COUNTDOWN,questionTitle,this,this.sendAnswer);
  }

  /* Shows the answer to the current question and calls playRound after an interval.
      Also increments the currentQuestion for the next round
    @emits answer event with the correct answer
  */
 sendAnswer(gameRoom){
  let currentRoundObj = gameRoom.getCurrentRound();
  let currentQuestionObj = currentRoundObj.getCurrentQuestion();
  // console.log("DEBUG: In sendAnswer() currentQuestionObj: %o ",currentQuestionObj);
  
  io.to(gameRoom.roomName).emit('answer',{answer: currentQuestionObj.correctAnswer}); 
  let answerTitle = 'Answer';
  currentRoundObj.currentQuestionNumber++;
  createTimerNoCountdown(gameRoom.roomName,SHOW_ANSWER_TIMER,answerTitle,gameRoom,gameRoom.playRound);
}

  /* Ends the current round and sends player-change data, followed by a show-scores timed message 
    Increments the currentRoundNumber by 1
    @emits round-end With player info to update and show scores
  */
  endRound(){
    console.log("Ending Round "+this.currentRoundNumber);
    io.to(this.roomName).emit('round-end',this.getPlayerInfo());
    this.currentRoundNumber++;
    if(this.hasMoreRounds()){
      createTimerNoCountdown(this.roomName,SHOW_SCORES_TIMER,'Scores',this,this.startRound);
    } else {
      this.endGame();
    }
  }

  /* Tells the clients the game is over. Emits a game ending event and closes all the sockets
    @emits game-ended With the winner 
  */
  endGame(){
  let winningPlayerArray = this.getWinners();
  console.log("sending winner array: %o ",winningPlayerArray);
  io.to(gameRoom.roomName).emit('game-ended',{winningPlayerArray: winningPlayerArray});
  console.log("Closing all the sockets for room "+gameRoom.roomName);
  this.players.forEach(player=>{
    player.socket.disconnect(true);
    console.log('Disconneded socket for player: '+player.name);
  });

  gameRoom.gameStatus = 'ENDED';
  console.log('Calling external function to delete game');
  endGame(gameRoom.roomName, gameRoom.ownerID);
  
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
        winningPlayers.push(player.name);
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
//    console.log('DEBUG: in getCurrentQuestion() this.questionArray: o%',this.questionArray);
//    console.log('DEBUG: in getCurrentQuestion() and currentQuestion: o%',currentQuestionObj);
    return currentQuestionObj;
  }

}

/* The Question class encapsulates all the aspects of a question. It's constructed with a question JSON from 
   opentdb.com and parses it into a format that can be queried and sent to clients */
class Question{
  constructor(questionJSON){
    let pointValuesObj = {easy: 1, medium: 3, hard: 5};

    this.correctAnswer = questionJSON.correct_answer;
    this.questionData ={
      category: questionJSON.category,
      type: questionJSON.type,
      difficulty: questionJSON.difficulty,
      question: questionJSON.question,
      answers: questionJSON.incorrect_answers,
      pointValue: pointValuesObj[questionJSON.difficulty]
    };
    this.questionData.answers.push(this.correctAnswer);
    this.questionData.answers = shuffle(this.questionData.answers);

  }


  /* Static helper method to parse an opendbt.com question result and return an array of Question objects */
  static parseQuestions(questionsJSON){
    let result = {success: true, message:'parsed questions'};
    
    if(questionsJSON.response_code !== 0){ // handle error from opendbt.com
        result.success = false;
        result.message = 'Error response code from opendbt.com: '+questionsJSON.response_code;
        return result;  
    }
    // Populate an array of Question objects
    let questionResultArray = [];
    questionsJSON.results.forEach((question)=>{
      questionResultArray.push(new Question(question));
    } );
    console.log('Successfully parsed '+questionResultArray.length + ' questions');
    return questionResultArray;
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
  // console.log("my object: %o", req)
  result = validateParams(["owner","rounds","questions","difficulty"],req.query);
  if(!result.success){
    console.error(result.messages)  
    res.status(400).send({ game_status: 'failed', errors: result.messages });
    return;
  }

  var owner = req.query.owner;
  console.log('Owner set to: ' + owner);


  var questionsPerRound = req.query.questions;
  if(questionsPerRound < 1 || questionsPerRound > MAX_NUM_QUESTIONS){ questionsPerRound = DEFAULT_NUM_QUESTIONS; }
  console.log('Number of questions set to: ' + questionsPerRound);
  
  var rounds = req.query.rounds;
  if(rounds < 1 || rounds > MAX_ROUNDS){rounds = DEFAULT_NUM_ROUNDS; }
  console.log('Number of rounds set to: ' + rounds);

  var difficulty = (!req.query.difficulty || req.query.difficulty === 'any') ? null : req.query.difficulty;

  // create a new game room with the supplied parameters and add it to the list of games
  game = new GameRoom(owner,rounds,questionsPerRound,difficulty);

  gameRoomArray[game.roomName] = game;
  console.log("Room Created: %o",game);

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

console.log("/api/start-game called:\n"+req.query.roomname+ " removed for ownerID "+req.query.ownerID);
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
console.log("/api/end-game called:\n"+req.query.roomname+ " removed for ownerID "+req.query.ownerID);
res.send({ game_status: 'removed',room_name: req.query.roomname });
})

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
})

// DEBUG - REMOVE BEFORE PROD
app.get('/api/dump-all-games', (req, res) => {
  console.log("/api/dump-all-games called");
  res.send({ gameRoomArray });
})

/////////////// API ENDPOINTS - END ///////////////
