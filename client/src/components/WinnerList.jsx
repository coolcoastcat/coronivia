import React from "react";

import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import { makeStyles } from '@material-ui/core/styles';
import { green } from '@material-ui/core/colors';
import StarTwoToneIcon from '@material-ui/icons/StarTwoTone';

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
    const MAX_NAME_LENGTH = 11;

    function truncatePlayerName(str) {
        if(!str) { return null;}
        // If the length of str is less than or equal to num
        // just return str--don't truncate it.
        if (str.length <= MAX_NAME_LENGTH) {
          return str;
        }
        // Return str truncated with '...' concatenated to the end of str.
        return str.slice(0, (MAX_NAME_LENGTH - 3)) + '...';
      }

    function handleLeaveGame(){
        props.leaveGame();
    }
        const winners = props.winners;
        let winnerOutput = '';
        if(winners.length > 1){
            
            winnerOutput =
            winners.map((winner,index)=>
                    [
                    <Grid className={classes.winnerList} key={winner.name} item xs={8}> {truncatePlayerName(winner.name)}</Grid>,
                    <Grid className={classes.winnerList} key={winner.score} item xs={4}> {winner.score}</Grid>
                    ]
                );
        } else {
            const pointText = (winners[0].score === 1)? 'point': 'points';
            winnerOutput = <Grid className={classes.tieTitle} item xs={12}>{winners[0].name} won the game with {winners[0].score} {pointText}!</Grid>
        }
        
    return(
        <Grid container spacing={2} >
            <Grid style={{textAlign: 'center'}} item xs={12}>
                <StarTwoToneIcon fontSize='large' style={{ color: green[500] }} />
                <StarTwoToneIcon fontSize='large' style={{ color: green[500] }} />
                <StarTwoToneIcon fontSize='large' style={{ color: green[500] }} />
                <StarTwoToneIcon fontSize='large' style={{ color: green[500] }} />
                <StarTwoToneIcon fontSize='large' style={{ color: green[500] }} />
            </Grid>
            {(winners.length > 1)?<Grid className={classes.tieTitle}  item xs={12}>It Was A Tie!</Grid>:''}
            {(winners.length > 1)?<Grid className={classes.winnerListHead} item xs={8}>Player</Grid>:''}
            {(winners.length > 1)?<Grid className={classes.winnerListHead}item xs={4}>Score</Grid>:''}
            {winnerOutput}
        </Grid>
    );

}