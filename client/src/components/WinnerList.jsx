import React from "react";

import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';

  const useStyles = makeStyles((theme) => ({
    tieTitle: {
        fontSize: '25px',
        fontWeight: 600,
        fontFamily: "Chelsea Market",
    },
    winnerListHead: {
        fontSize: '18px',
        fontWeight: 600,
        fontFamily: "sans-serif",
    },
    winnerList: {
        fontSize: '18px',
        fontWeight: 500,
        fontFamily: "sans-serif",
    },
    colorfulButton: {
        background: 'linear-gradient(45deg, #32a852 30%, #d8e038 90%)',
        border: 0,
        borderRadius: 3,
        boxShadow: '0 3px 5px 2px rgba(245, 250, 155, .3)',
        color: 'white',
        height: 48,
        padding: '0 30px',
      }
  }));

export default function WinnerList(props){
    const classes = useStyles();

    function handleLeaveGame(){
        props.leaveGame();
    }
        const winners = props.winners;
        let winnerOutput = '';
        if(winners.length > 1){
            
            winnerOutput =
            winners.map((winner,index)=>
                    [
                    <Grid className={classes.winnerList} key={winner.name} item xs={3}> {winner.name}</Grid>,
                    <Grid className={classes.winnerList} key={winner.score} item xs={9}> {winner.score}</Grid>
                    ]
                );
        } else {
            const pointText = (winners[0].score == 1)? 'point': 'points';
            winnerOutput = <Grid className={classes.tieTitle} item xs={12}>{winners[0].name} won the game with {winners[0].score} {pointText}!</Grid>
        }
        
    return(
        <Grid container spacing={2} >
            {(winners.length > 1)?<Grid className={classes.tieTitle}  item xs={12}>It Was A Tie!</Grid>:''}
            {(winners.length > 1)?<Grid className={classes.winnerListHead} item xs={3}>Player</Grid>:''}
            {(winners.length > 1)?<Grid className={classes.winnerListHead}item xs={9}>Score</Grid>:''}
            {winnerOutput}
            <Grid style={{fontSize:'16px'}} item xs={12} ><Button className={classes.colorfulButton}  onClick={handleLeaveGame} >The End</Button></Grid>
        </Grid>
    );

}