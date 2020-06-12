import React from "react";
import "./player.css";
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { green } from '@material-ui/core/colors';

//const label = {color: green['600'], justify: 'flex-end', fontWeight: 600,fontSize:'16px'};
//const content = {border: '1px solid lightGray', justify:"flex-start" ,fontSize:'16px'};

const styles = theme => ({

    label: {
        color: green[600],
        fontWeight: 600,
        fontSize: '20px',
        fontFamily: "Chelsea Market"
    },
    content: {
        fontSize: '18px',
        fontFamily: "Chelsea Market"
    },    
    contentGray: {
        fontSize: '18px',
        fontFamily: "Chelsea Market",
        background: 'lightGray'
    }
    
  });

class PlayerListScores extends React.Component{
    constructor(props){
        super(props)
        console.log("PlayerList constructed with props: %o",props);
        const playersArray = (!props.players || props.players.length === 0) ? ['Waiting for Players to join'] : props.players; 
        this.player = props.thisPlayer;
        this.state = {
            players: playersArray,
            showScore: props.showScore
        };
    }
    
    /* Method bound to Parent reference so that Parent can pass in updates to the playerArray and force a refresh 
        @param playerArray The updated player array to show.
    */
    updatePlayers(playerArray){
        this.setState({players: playerArray});
        console.log("PlayersList received players update %o",playerArray);
    }

    /* alternating row styling */
    getClass(index){
        const { classes } = this.props;
        return (index %2 == 0 )  ? classes.content : classes.contentGray;
    }

    render(){
        let playerItems = '';
        const { classes } = this.props;

        if(this.state.players){
            playerItems = this.state.players.map((player,index) => 
                        
                    [
                    <Grid className={this.getClass(index)} key={player.name} xs={4} item>{ player.name }{ player.name === this.player && <span> (you) </span> }</Grid>,
                    <Grid className={this.getClass(index)}  key={player.connected} xs={4} item>{ (player.connected)? 'Yes' : 'No' }</Grid>,
                    <Grid className={this.getClass(index)}  key={player.score} xs={4} item>{(this.state.showScore)?player.score : '' }</Grid>
                    ] 
                ) 
        }
        
        return(
           <Grid container>
                <Grid className={classes.label}  key={'title'} xs={4} item>Player</Grid>
                <Grid  className={classes.label}  key={'connected'} xs={4} item>Connected?</Grid>
                <Grid className={classes.label}  key={'score'} xs={4} item>{(this.state.showScore)? 'Score': ''}</Grid> 
                {playerItems}
            </Grid>
        );

    };
}

PlayerListScores.propTypes =  {
    classes: PropTypes.object.isRequired,
  };

export default withStyles(styles)(PlayerListScores);

