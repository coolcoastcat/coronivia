import React from "react";
import "./game-play.css";
import Question from './Question';

export class GamePlay extends React.Component{
    constructor(props){
        super(props)
        console.log("GamePlay constructed with props: %o",props);
        this.gameConfig = props.gameConfig;
        this.socket = props.socket;
        this.state = {
            question: null
        }
        this.setUpEventHandlers();
    }
    
    /* Sets up the event handlers for playing the game */
    setUpEventHandlers(){

        /* Handles a new question */
        this.socket.on('question',(data)=>{
            this.setState({question:data});
        });
    }

    render(){
        return(
        <div>
            <hr />
            { this.state.question && <Question gameRoomName={this.gameConfig.roomname} thisPlayer={this.gameConfig.player} socket={this.socket} questionJSON={this.state.question} /> }
        </div> 
        );

    };
}

