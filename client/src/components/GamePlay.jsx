import React from "react";
import "./game-play.css";
import Question from './Question';
import PlayerListScores from "./PlayerListScores";
import QuestionDialog from "./QuestionDialog";
import WinnerList from "./WinnerList";
import Box from '@material-ui/core/Box';
import { Redirect } from "react-router-dom";

export class GamePlay extends React.Component{
    constructor(props){
        super(props)
        console.log("GamePlay constructed with props: %o",props);
        this.gameConfig = props.gameConfig;
        this.socket = props.socket;
        this.state = {
            question: null,
            players: [],
            timerText: 'Starting the Game!',
            questionDialogTitle: '',
            showScores: false,
            showQuestion:false,
            showEndgame:false,
            countdownData: null,
            leaveGame: false
        }
        this.winningPlayerArray = [];
        this.setUpEventHandlers();
        this.playerListElement = React.createRef(); // Allow sending updates to child
        this.questionElement = React.createRef(); // Allow updating question in child
        this.handleLeaveGame = this.handleLeaveGame.bind(this);
    }
    
    /* Sets up the event handlers for playing the game */
    setUpEventHandlers(){
    
        /* Handles a new question */
        this.socket.on('question',(data)=>{
            console.log("Received question event with data: %o", data);
            this.setState({question:data,showScores:false,showQuestion:true});
            this.questionElement.current.setQuestion(data);
        });


        this.socket.on('round-end',(playerArray) =>{
            this.setState({players: playerArray, showQuestion:false, showScores: true})
           // this.playerListElement.current.updatePlayers(this.state.players); // Update the child
            console.log('event: round-end with data: %o',playerArray);
          });

     
        /* Handler for countdown question timers received from the server.
            @param data.count  seconds remaining
            @param data.timerMessage message to show above the seconds remaining
            @param data.showCountdown Boolean of whether to show the digits counting down
        */
        this.socket.on('countdown-question',(data) =>{
            console.log('countdown-question event: %o',data);
            this.setState({countdownData: data,timerText: data.timerMessage+": "+data.count});
        });

            /* General handler for countdown answer timers received from the server.
            @param data.count  seconds remaining
            @param data.timerMessage message to show above the seconds remaining
            @param data.showCountdown Boolean of whether to show the digits counting down
        */
        this.socket.on('countdown-answer',(data) =>{ // bascially a no-op
            console.log('countdown-answer event: %o',data);
        });
        
        /* Nulls the countdownData which hides the countdown component
        */
        this.socket.on('clear-countdown',(data) =>{
            console.log('clear-countdown event');
            this.setState({countdownData: null,timerText: ''});
        });

        /* Handler for countdown round timers received from the server.
        @param data.count  seconds remaining
        @param data.timerMessage message to show above the seconds remaining
        @param data.showCountdown Boolean of whether to show the digits counting down
        */
        this.socket.on('countdown-round',(data) =>{
            console.log('countdown-round event: %o',data);
            this.setState({countdownData: data,timerText: data.timerMessage});
        });

        /* Handler for countdown endround timers received from the server.
        @param data.timerMessage message to show in the endround dialog
        @param data.showCountdown Boolean of whether to show the digits counting down
        */
       this.socket.on('countdown-endround',(data) =>{
        console.log('countdown-endround event: %o',data);
        this.setState({countdownData: data,timerText:data.timerMessage});
        });


        /* Handler for game-ended event from the server 
            @param data.winningPlayerArray The list of player(s) with the highest score
        */
        this.socket.on('game-ended',(data) =>{
            this.winningPlayerArray = data.winningPlayerArray;
            this.setState({showScores: false, showEndgame: true});
            console.log('event: game-end with data: %o',data);
    
        });

    }

    /* Handles if a player leaves the game. Passed to QuestionDialog */
    handleLeaveGame = ()=>{ 
/*  If a player is removed, she no longer appears in the list at the end. The players will get removed at end game in any case      
    this.socket.emit('remove-player',{roomname: this.gameConfig.roomname, player: this.gameConfig.player},(data)=>{
            console.log('Leaving game result: %o',data);
            // Redirect to join page
            this.setState({leaveGame:true});    
            this.socket.close();
        });
*/  
        this.setState({leaveGame:true});    
        this.socket.close();
    }

    render(){
       if(this.state.leaveGame){
            console.log("GamePlay player "+this.gameConfig.player+" is leaving game "+this.gameConfig.roomname);
            return <Redirect to='/' />
          }

    
        if(this.state.showScores) {
            return(
                <Box>
                    <QuestionDialog showQuestion={this.state.showQuestion} timerText={this.state.timerText} dialogTitle={this.state.questionDialogTitle} >
                        <PlayerListScores players={this.state.players} ref={this.playerListElement} />
                    </QuestionDialog>
                </Box> 
            );
           
        }

        if(this.state.showQuestion){
            return(
                <Box>
                    <QuestionDialog showQuestion={this.state.showQuestion} timerText={this.state.timerText} dialogTitle={this.state.questionDialogTitle} >
                        <Question gameRoomName={this.gameConfig.roomname} 
                                    thisPlayer={this.gameConfig.player} 
                                    socket={this.socket} 
                                    ref={this.questionElement} /> 
                    </QuestionDialog>
                </Box> 
                );
        }
        

        if(this.state.showEndgame){
            return(
                <Box>
                    <QuestionDialog showQuestion={this.state.showQuestion} timerText={this.state.timerText} dialogTitle={this.state.questionDialogTitle} >
                        <WinnerList leaveGame={this.handleLeaveGame}  winners={this.winningPlayerArray} />
                    </QuestionDialog>
                </Box> 
                );
            
        }
       
        // If nothing else, show the opening dialog
        return(
            <Box>
            <QuestionDialog showQuestion={this.state.showQuestion} timerText={this.state.timerText} dialogTitle={this.state.questionDialogTitle} >
            </QuestionDialog>
        </Box> 
        )
    };
}

