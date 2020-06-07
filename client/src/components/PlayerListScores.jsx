import React from "react";
import "./player.css";
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';

const styles = theme => ({

    label: {
        color: '#75fa83',
        fontWeight: 600,
        fontSize: '14px',
        fontFamily: "Chelsea Market"
    },
    content: {
        fontSize: '12px',
        fontFamily: "Chelsea Market"
    }
    
  });

class PlayerListScores extends React.Component{
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
        const { classes } = this.props;

        if(this.state.players){
            playerItems = this.state.players.map((player) => 
                                [
                                <Grid key={player.name} xs={4} item>{ player.name }{ player.name === this.player && <span> (you) </span> }</Grid>,
                                <Grid key={player.connected} xs={4} item>{ (player.connected)? 'Yes' : 'No' }</Grid>,
                                <Grid key={player.score} xs={4} item>{ player.score }</Grid>
                                ]
                                ) 
        }
        
        return(
           <Grid container>
                <Grid className={classes.label}  key={'title'} xs={4} item>Player</Grid>
                <Grid  className={classes.label}  key={'connected'} xs={4} item>Connected?</Grid>
                <Grid className={classes.label}  key={'score'} xs={4} item>Score</Grid>
                {playerItems}
            </Grid>
        );

    };
}

PlayerListScores.propTypes =  {
    classes: PropTypes.object.isRequired,
  };

export default withStyles(styles)(PlayerListScores);

