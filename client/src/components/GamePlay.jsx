import React from "react";
import Question from './Question';
import PlayerListScores from "./PlayerListScores";
import QuestionDialog from "./QuestionDialog";
import WinnerList from "./WinnerList";
import Box from '@material-ui/core/Box';
import { Redirect } from "react-router-dom";

export class GamePlay extends React.Component{
    constructor(props){
        super(props)
        console.debug("GamePlay constructed with props: %o",props);
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
            leaveGame: false,
            interval: null,
            showSeconds: false
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
            console.debug("Received question event with data: %o", data);
            this.setState({question:data,showScores:false,showQuestion:true, interval:data.interval});
            this.questionElement.current.setQuestion(data);
        });


        this.socket.on('round-end',(playerArray) =>{
            this.setState({players: playerArray})
           // this.playerListElement.current.updatePlayers(this.state.players); // Update the child
            console.debug('event: round-end with data: %o',playerArray);
          });

     
        /* Handler for countdown question timers received from the server.
            @param data.count  seconds remaining
            @param data.timerMessage message to show above the seconds remaining
            @param data.showCountdown Boolean of whether to show the digits counting down
        */
        this.socket.on('countdown-question',(data) =>{
            console.debug('countdown-question event: %o',data);
            this.setState({countdownData: data,timerText: data.timerMessage, interval:data.interval, showSeconds:data.showCountdown});
        });

            /* General handler for countdown answer timers received from the server.
            @param data.count  seconds remaining
            @param data.timerMessage message to show above the seconds remaining
            @param data.showCountdown Boolean of whether to show the digits counting down
        */
        this.socket.on('countdown-answer',(data) =>{ 
            this.setState({countdownData: data, timerText: data.timerMessage, interval:data.interval, showSeconds:data.showCountdown})
            console.debug('countdown-answer event: %o',data,);
        });
        
        /* Nulls the countdownData which hides the countdown component
        */
        this.socket.on('clear-countdown',(data) =>{
            console.debug('clear-countdown event');
            this.setState({countdownData: null,timerText: '', interval:0});
        });

        /* Handler for countdown round timers received from the server.
        @param data.count  seconds remaining
        @param data.timerMessage message to show above the seconds remaining
        @param data.showCountdown Boolean of whether to show the digits counting down
        */
        this.socket.on('countdown-round',(data) =>{
            console.debug('countdown-round event: %o',data);
            this.setState({countdownData: data,
                            timerText: data.timerMessage, 
                            interval:data.interval,
                            showScores: false});
        });

        /* Handler for countdown endround timers received from the server.
        @param data.timerMessage message to show in the endround dialog
        @param data.showCountdown Boolean of whether to show the digits counting down
        */
       this.socket.on('countdown-endround',(data) =>{
        console.debug('countdown-endround event: %o',data);
        this.setState({countdownData: data,
                        timerText:data.timerMessage, 
                        interval:data.interval,
                        showQuestion:false, 
                        showScores: true});
        });


        /* Handler for game-ended event from the server 
            @param data.winningPlayerArray The list of player(s) with the highest score
        */
        this.socket.on('game-ended',(data) =>{
            console.debug('event: game-end with data: %o',data);
            this.winningPlayerArray = data.winningPlayerArray;
            this.setState({showScores: false, showEndgame: true,countdownData: data});
       
    
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
        console.debug("DEBUG GamePlay render -> showScores:"+this.state.showScores+ " showQuestion: "+
            this.state.showQuestion+" showEndgame: "+this.state.showEndgame+ " leaveGame: "+this.state.leaveGame);

       if(this.state.leaveGame){
            console.log("GamePlay player "+this.gameConfig.player+" is leaving game "+this.gameConfig.roomname);
            return <Redirect to='/' />
          }

    
        if(this.state.showScores) {
            return(
                <Box>
                    <QuestionDialog showQuestion={this.state.showQuestion} 
                                    timerText={this.state.timerText} 
                                    dialogTitle={this.state.questionDialogTitle}
                                    count={(this.state.countdownData  && this.state.countdownData.count)?this.state.countdownData.count: 0}
                                    interval={this.state.interval?this.state.interval:1}
                                    showTimerText={true}
                                    showSeconds={false}
                                    leaveCallback={this.handleLeaveGame}
                                    >
                        <PlayerListScores players={this.state.players} 
                                        ref={this.playerListElement}
                                        showScore={true} />
                    </QuestionDialog>
                </Box> 
            );
           
        }

        if(this.state.showQuestion){
            return(
                <Box>
                    <QuestionDialog showQuestion={this.state.showQuestion} 
                                    timerText={this.state.timerText} 
                                    dialogTitle={this.state.questionDialogTitle} 
                                    count={(this.state.countdownData  && this.state.countdownData.count)?this.state.countdownData.count: 0}
                                    interval={this.state.interval?this.state.interval:1}
                                    showTimerText={true}
                                    showSeconds={this.state.showSeconds}
                                    leaveCallback={this.handleLeaveGame}
                                    >
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
                    <QuestionDialog showQuestion={this.state.showQuestion} 
                                    timerText={this.state.timerText} 
                                    dialogTitle={this.state.questionDialogTitle} 
                                    count={this.state.countdownData.count}
                                    interval={this.state.countdownData.interval}
                                    showTimerText={false}
                                    leaveCallback={this.handleLeaveGame}
                                    >
                        <WinnerList leaveGame={this.handleLeaveGame}  winners={this.winningPlayerArray} />
                    </QuestionDialog>
                </Box> 
                );
            
        }
       
        // If nothing else, show the opening dialog
        return(
            <Box>
            <QuestionDialog 
                showQuestion={this.state.showQuestion} 
                timerText={this.state.timerText} 
                dialogTitle={this.state.questionDialogTitle} 
                count={(this.state.countdownData && this.state.countdownData.count)?this.state.countdownData.count: 0}
                interval={this.state.interval?this.state.interval:1}
                showTimerText={false}
                showSeconds={false}
                leaveCallback={this.handleLeaveGame}
                >
            </QuestionDialog>
        </Box> 
        )
    };
}

