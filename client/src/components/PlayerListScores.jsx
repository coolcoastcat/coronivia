import React from "react";
import { withStyles } from '@material-ui/core/styles';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
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
    },
    disconnected: {
        color: 'gray',
        fontStyle: 'italic'
    },
    none: {

    }
    
  });

class PlayerListScores extends React.Component{
    constructor(props){
        super(props)
        console.debug("PlayerList constructed with props: %o",props);
        this.player = props.thisPlayer;
        this.state = {
            players: (props.players) ? props.players : null,
            showScore: props.showScore
        };
        this.MAX_NAME_LENGTH = 11;
    }

    truncatePlayerName(str) {
        if(!str) { return null;}
        // If the length of str is less than or equal to num
        // just return str--don't truncate it.
        if (str.length <= this.MAX_NAME_LENGTH) {
          return str;
        }
        // Return str truncated with '...' concatenated to the end of str.
        return str.slice(0, (this.MAX_NAME_LENGTH - 3)) + '...';
      }
      
    
    /* Method bound to Parent reference so that Parent can pass in updates to the playerArray and force a refresh 
        @param playerArray The updated player array to show.
    */
    updatePlayers(playerArray){
        // Sort by player score
        playerArray.sort((a,b)=> (a.score < b.score)? 1: (a.score === b.score) ? ((a.player > b.player)? 1 : -1) : -1);
        this.setState({players: playerArray});
        console.debug("PlayersList received players update %o",playerArray);
    }

    /* alternating row styling */
    getClass(index){
        const { classes } = this.props;
        return (index %2 === 0 )  ? classes.contentGray : classes.content;
    }

    render(){
        let playerItems = '';
        const { classes } = this.props;

        console.debug("DEBUG: Players array: %o",this.state.players)
        if(this.state.players){
            playerItems = this.state.players.map((player,index) => {
                let connectedStyle = (!player.connected)? classes.disconnected : classes.none;
                return([
                    <Grid className={this.getClass(index)} key={player.name} xs={8} item><span className={connectedStyle}>{ this.truncatePlayerName(player.name) }</span>{ player.name === this.player && <span> (you) </span> }</Grid>,
                    <Grid className={this.getClass(index)}  key={player.score} xs={4} item>{(this.state.showScore)?player.score : '' }</Grid>
                    ])
                }
                ) 
        }
        
        return(
           <Grid container>
                <Grid className={classes.label}  key={'title'} xs={8} item>Players</Grid>
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

