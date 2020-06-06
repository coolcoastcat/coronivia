import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';

const styles = theme => ({
    root: {
      background: 'linear-gradient(45deg, #32a852 30%, #d8e038 90%)',
      border: 0,
      borderRadius: 3,
      boxShadow: '0 3px 5px 2px rgba(245, 250, 155, .3)',
      color: 'white',
      height: 48,
      padding: '0 30px',
    },
    white: {
        color: 'white'
    },
    pad: {
        padding: '2px 5px'
    },
    label: {
        fontWeight: 600
    }
  });

class Question extends React.Component {
    constructor(props){
        super(props);
        /* questionData consists of:
            category: String,
            type: Multiple or Boolean,
            difficulty: easy|medium|hard,
            question: string,
            answers:[array] 
        */
        console.log("props: %o",props);
        this.category = props.questionJSON.question.category;
        this.type = props.questionJSON.question.type;
        this.difficulty = props.questionJSON.question.difficulty;
        this.question = props.questionJSON.question.question;
        this.answers = props.questionJSON.question.answers;
        this.currentRoundNumber= props.questionJSON.currentRoundNumber;
        this.questionNumber= props.questionJSON.questionNumber;
        this.totalQuestions= props.questionJSON.totalQuestions;
        this.player = props.thisPlayer;
        this.gameRoomName = props.gameRoomName;

        console.log("questionData: %o",this.questionData);
        this.state = {
            playerAnswer: null,
            submittedAnswer: false,
            pointsEarned: '...'
        };
        this.socket = props.socket;
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmitAnswer = this.handleSubmitAnswer.bind(this); 
    }

    handleChange(event){
        this.setState({playerAnswer: event.target.value});
    }
    
    handleSubmitAnswer(event){
        let sendData = {player: this.player, gameRoomName: this.gameRoomName, playerAnswer:this.state.playerAnswer};
        console.log("Sending answer to server: %o",sendData);
        this.socket.emit('player-answer',
                          sendData,
                            (data)=>{
                                if(data.success){
                                    this.setState({submittedAnswer: true, pointsEarned: data.points});
                                    
                                    console.log('Answer successfully received and earned points: '+data.points);
                                } else {
                                    this.setState({submittedAnswer: true});
                                    console.log('Error from server: '+data.error)
                                }
                            });
        

    }

    render(){
        const { classes } = this.props;
        let radios = '';

        if(this.state.submittedAnswer){
            return (
                    <Grid container>
                        <Grid item>
                            <Paper  className={classes.pad} elevation={3}>
                            <Grid   container spacing={3}>
                                <Grid className={classes.label}  item xs={3}>
                                Submitted:
                                </Grid>
                                <Grid item xs={9}>
                                     {this.state.playerAnswer}
                                </Grid> 
                                <Grid className={classes.label}  item xs={4}>
                                Points&nbsp;Earned: 
                                </Grid>
                                <Grid item xs={8}>
                                    {this.state.pointsEarned}
                                </Grid>
                            </Grid>
                            </Paper>
                        </Grid>
                    </Grid>
                    );
        }


        if(this.answers){

            radios = this.answers.map((answer)=>
                <FormControlLabel  key={answer} value={answer} control={<Radio  color="primary" />} label={answer} color="primary" />
            );
        }
        return(
            
            <Grid container>
                <Grid item>
                    <Box  p={3}>                
                    <FormControl component="fieldset">
                    <FormLabel component="legend" >{unescape(this.question)}</FormLabel>
                    <RadioGroup aria-label="playerAnswer" name="playerAnswer" value={this.state.playerAnswer} onChange={this.handleChange}>
                    {radios}
                    </RadioGroup>
                    <p></p>
                    <Button type="submit" size="small" variant="contained" className={classes.root}  onClick={this.handleSubmitAnswer}>
                    Submit Answer
                    </Button>
                    </FormControl>
                </Box>
            </Grid>
        </Grid>
        );
    }
}
Question.propTypes =  {
    classes: PropTypes.object.isRequired,
  };

export default withStyles(styles)(Question);