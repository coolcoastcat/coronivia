import React from "react";
import "./player.css";

export class PlayerListScores extends React.Component{
    constructor(props){
        super(props)
        console.log("PlayerList constructed with props: %o",props);
        const playersArray = (!props.players || props.players.length === 0) ? ['Waiting for Players to join'] : props.players; 
        this.player = props.thisPlayer;
        this.state = {
            players: playersArray
        };
    }
    
    /* Method bound to Parent reference so that Parent can pass in updates to the playerArray and force a refresh 
        @param playerArray The updated player array to show.
    */
    updatePlayers(playerArray){
        this.setState({players: playerArray});
        console.log("PlayersList received players update %o",playerArray);
    }

    render(){
        let playerItems = '';
        if(this.state.players){
            playerItems = this.state.players.map((player) =>  <div  id='player-content-body' key={player.name}>
                                <div id='player-labels-column'>{ player.name }{ player.name === this.player && <span> (you) </span> }</div>
                                <div id='player-data-column'>{ (player.connected)? 'Yes' : 'No' }</div>
                                <div id='player-data-column'>{ player.score }</div>
                                </div>);                             
        }
        
        return(
            <div id='player-body-wrapper'>
                <div id='player-body-table'>
                    <div id='player-content-body'>
                        <div id='player-labels-column-hd'>Player</div><div id='player-data-column-hd'>Connected?</div><div id='player-data-column-hd'>Score</div>
                    </div>
                    {playerItems}
                </div> 
            </div>
        );

    };
}

export class PlayerList extends React.Component{
    constructor(props){
        super(props)
        console.log("PlayerList constructed with props: %o",props);
        const playersArray = (!props.players || props.players.length === 0) ? ['Waiting for Players to join'] : props.players; 
        this.player = props.thisPlayer;
        this.state = {
            players: playersArray
        };
    }
    
    /* Method bound to Parent reference so that Parent can pass in updates to the playerArray and force a refresh 
        @param playerArray The updated player array to show.
    */
    updatePlayers(playerArray){
        this.setState({players: playerArray});
        console.log("PlayersList received players update %o",playerArray);
    }

    render(){
        let playerItems = '';
        if(this.state.players){
            playerItems = this.state.players.map((player) =>  <div key={player.name} id='player-content-body'>
                                <div id='player-labels-column'>{player.name}{player.name === this.player && <span> (you) </span> }</div>
                                </div>);                             
        }
        
        return(
            <div id='player-body-wrapper'>
                <div id='player-body-table'>
                    <div id='player-content-body'>
                        <div id='player-labels-column-hd'>Playing</div>
                    </div>
                    { playerItems }
                </div> 
            </div>
        );

    };
}

