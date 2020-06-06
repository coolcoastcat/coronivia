import React from "react";
import "./game-play.css";
import Question from './Question';
import { PlayerListScores } from "./PlayerList";
import QuestionDialog from "./QuestionDialog";

export class GamePlay extends React.Component{
    constructor(props){
        super(props)
        console.log("GamePlay constructed with props: %o",props);
        this.gameConfig = props.gameConfig;
        this.socket = props.socket;
        this.state = {
            question: null,
            answer: null,
            showScores: false,
            players: [],
            timerText: '',
            questionDialogTitle: ''
        }
        this.setUpEventHandlers();
        this.playerListElement = React.createRef();
    }
    
    /* Sets up the event handlers for playing the game */
    setUpEventHandlers(){

        /* Handles a new question */
        this.socket.on('question',(data)=>{
            this.setState({question:data});
        });

        /* Handles a new question */
        this.socket.on('answer',(data)=>{
            this.setState({answer:data.answer});
        });

        this.socket.on('round-end',(playerArray) =>{
            this.setState({players: playerArray, showScores: true})
           // this.playerListElement.current.updatePlayers(this.state.players); // Update the child
            console.log('event: round-end with data: %o',playerArray);
          });

    }

    render(){
        if(this.showScores) {
            return(<PlayerListScores thisPlayer={this.gameConfig.player} players={this.state.players} ref={this.playerListElement} />)
        }
        return(
        <div>
            <hr />
            { this.state.question && 
                <QuestionDialog timerText={this.state.timerText} dialogTitle={this.state.questionDialogTitle} >
                    <Question gameRoomName={this.gameConfig.roomname} thisPlayer={this.gameConfig.player} socket={this.socket} questionJSON={this.state.question} /> 
                </QuestionDialog>
            }
        </div> 
        );

    };
}

