import React from "react";
import "./game-info.css";

export class GameInfo extends React.Component{
    constructor(props){
        super(props)
        console.log("OwnerView constructed with props: %o",props);
        this.gameConfig = props.gameConfig;
    }
    

    render(){
        return(
        <div id='game-info-body-wrapper'>
            <div id='game-info-body-table'>
                <div id='game-info-body'>
                    <div id='game-info-labels-column-hd'>GAME </div>
                    <div id='game-info-data-column-hd'>INFO</div>
                </div>
                <div id='game-info-body'>
                    <div id='game-info-labels-column'>Status:</div>
                    <div id='game-info-data-column'>{this.gameConfig.gameStatus}</div>
                </div>
                <div id='game-info-body'>
                    <div id='game-info-labels-column'>Rounds:</div>
                    <div id='game-info-data-column'>{this.gameConfig.rounds}</div>
                </div>
                <div id='game-info-body'>
                    <div id='game-info-labels-column'>Questions per Round:</div>
                    <div id='game-info-data-column'>{this.gameConfig.questions}</div>
                </div>
                <div id='game-info-body'>
                    <div id='game-info-labels-column'>Difficulty:</div>
                    <div id='game-info-data-column'>{this.gameConfig.difficulty}</div>
                </div>
                <div id='game-info-body'>
                    <div id='game-info-labels-column'>Room Name:</div>
                    <div id='game-info-data-column'>{this.gameConfig.roomname}</div>
                </div>
                <div id='game-info-body'>
                    <div id='game-info-labels-column'>Owner:</div>
                    <div id='game-info-data-column'>{this.gameConfig.owner}</div>
                </div>
            </div>
        </div> 
        );

    };
}

