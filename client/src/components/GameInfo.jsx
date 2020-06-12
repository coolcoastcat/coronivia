import React from "react";
import "./game-info.css";
import Grid from '@material-ui/core/Grid';
import Box from '@material-ui/core/Box';
import { green } from '@material-ui/core/colors';

const label = {color: green['600'], justify: 'flex-end', fontWeight: 600,fontSize:'16px'};
const content = {border: '1px solid lightGray', justify:"flex-start" ,fontSize:'16px'};

export class GameInfo extends React.Component{
    constructor(props){
        super(props)
        console.log("GameInfo constructed with props: %o",props);
        this.gameConfig = props.gameConfig;
    }
    

    render(){
        return(
            <Grid container>

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
                <Grid   style={content}   container item xs={6}>
                    <Box p={1}>
                    {this.gameConfig.owner}
                    </Box>
                </Grid>            

            </Grid>
 
        );

    };
}

