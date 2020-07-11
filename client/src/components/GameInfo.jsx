import React from "react";
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { green } from '@material-ui/core/colors';

const label = {color: green['600'], fontWeight: 600,fontSize:'12px'};
const content = { paddingLeft: '5px', fontSize:'12px'};

export class GameInfo extends React.Component{
    constructor(props){
        super(props)
        console.debug("GameInfo constructed with props: %o",props);
        this.gameConfig = props.gameConfig;
        this.MAX_NAME_LENGTH = 10;
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

    render(){
        return(
            <Grid   justify="center" container>
                <Grid item xs={12}>
                GAME INFO
                </Grid>


                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box>
                    Room Name:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box>
                    {this.gameConfig.roomname}
                    </Box>
                </Grid>
                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box>
                    Owner:
                    </Box>
                </Grid>
                <Grid  style={content}   container item xs={6}>
                    <Box>
                    {this.truncatePlayerName(this.gameConfig.owner)}
                    </Box>
                </Grid>
                <Grid justify='flex-end'  style={label}  container item xs={6}>
                <Box>
                Status:
                </Box>
                </Grid>
                <Grid  style={content}   container item xs={6}>
                <Box>
                {this.gameConfig.gameStatus}
                </Box>
                </Grid>

                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box >
                        Rounds:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box >
                        {this.gameConfig.rounds}
                    </Box>
                </Grid>


                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box >
                    Questions per Round:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box >
                    {this.gameConfig.questions}
                    </Box>
                </Grid>

                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box >
                    Difficulty:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box >
                    {this.gameConfig.difficulty}
                    </Box>
                </Grid>

                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box >
                    Pause Between Rounds:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box >
                    {this.gameConfig.pauseBetweenRounds?'Yes':'No'}
                    </Box>
                </Grid>  

                 <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box >
                    Points Countdown:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box >
                    {this.gameConfig.pointsCountdown?'Yes':'No'}
                    </Box>
                </Grid>          

                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box >
                    Remove Questions:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box >
                    {this.gameConfig.removeAnswers?'Yes':'No'}
                    </Box>
                </Grid>          
                
                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box >
                    Question Five:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box >
                    {this.gameConfig.questionFive?'Yes':'No'}
                    </Box>
                </Grid>


            </Grid>
 
        );

    };
}

