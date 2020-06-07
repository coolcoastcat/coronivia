import React from "react";

import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';

export default function WinnerList(props){

    function handleLeaveGame(){
        props.leaveGame();
    }
        const winners = props.winners;
        let winnerOutput = '';
        if(winners.length > 1){
            
            winnerOutput =             
            winners.map((winner,index)=>
                    [
                    <Grid key={winner.name} item xs={3}> {winner.name}</Grid>,
                    <Grid key={winner.score} item xs={9}> {winner.score}</Grid>
                    ]
                );
        } else {
            winnerOutput = <Grid item xs={12}>{winners[0].name} won the game with {winners[0].score} points!</Grid>
        }
        
    return(
        <Grid container spacing={2} >
            {(winners.length > 1)?<Grid  item xs={12}>It Was A Tie!</Grid>:''}
            {winnerOutput}
            <Grid item xs={12} ><Button variant='contained' color='primary' onClick={handleLeaveGame} >The End</Button></Grid>
        </Grid>
    );

}