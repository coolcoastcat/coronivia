import React from "react";
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { green } from '@material-ui/core/colors';

const label = {color: green['600'], justify: 'flex-end', fontWeight: 600,fontSize:'16px'};
const content = {border: '1px solid lightGray', justify:"flex-start" ,fontSize:'16px'};

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
                <Box p={1}>
                Status:
                </Box>
                </Grid>
                <Grid  style={content}   container item xs={6}>
                <Box p={1}>
                {this.gameConfig.gameStatus}
                </Box>
                </Grid>

                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box p={1}>
                        Rounds:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box p={1}>
                        {this.gameConfig.rounds}
                    </Box>
                </Grid>


                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box p={1}>
                    Questions per Round:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box p={1}>
                    {this.gameConfig.questions}
                    </Box>
                </Grid>

                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box p={1}>
                    Difficulty:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box p={1}>
                    {this.gameConfig.difficulty}
                    </Box>
                </Grid>

                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box p={1}>
                    Pause Between Rounds:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box p={1}>
                    {this.gameConfig.pauseBetweenRounds?'Yes':'No'}
                    </Box>
                </Grid>

                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box p={1}>
                    Room Name:
                    </Box>
                </Grid>
                <Grid   style={content}   container item xs={6}>
                    <Box p={1}>
                    {this.gameConfig.roomname}
                    </Box>
                </Grid>
                <Grid justify='flex-end'  style={label}  container item xs={6}>
                    <Box p={1}>
                    Owner:
                    </Box>
                </Grid>
                <Grid  style={content}   container item xs={6}>
                    <Box p={1}>
                    {this.truncatePlayerName(this.gameConfig.owner)}
                    </Box>
                </Grid>            

            </Grid>
 
        );

    };
}

