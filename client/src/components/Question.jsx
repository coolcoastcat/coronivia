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
import renderHTML from 'react-render-html';

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
       // fontFamily: "Chelsea Market"
    },
    correct: {
        background: '#edf7ed'
    },
    incorrect: {
        background: '#fdedeb'
    },
    none: {

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

        this.player = props.thisPlayer;
        this.gameRoomName = props.gameRoomName;

        console.log("questionData: %o",this.questionData);
        this.state = {
            playerAnswer: null,
            submittedAnswer: false,
            pointsEarned: 0,
            answer: '',
            showAnswer: false,
            showQuestion: false,
            answerisCorrect: false,
            questionObject: null, // contains answers[], category, type, difficulty, question
            currentRoundNumber: 0,
            questionNumber: 0,
            totalQuestions: 0

        };
        this.socket = props.socket;
        this.handleChange = this.handleChange.bind(this);
        this.handleSubmitAnswer = this.handleSubmitAnswer.bind(this); 
        this.setupEventHandlers();
    }
    
    /* Allows parent to call to display the question form again 
        @param questionJSON.question The question object containing question, category, type, difficulty, answers[]
        @param questionJSON.questionNumber The number of this question in the round.
        @param questionJSON.totalQuestions The total number of questions in the round.
        @param questionJSON.currentRoundNumber The current round number
    */
    setQuestion(questionJSON){
        this.setState({showAnswer: false, submittedAnswer: false, playerAnswer: null, answer: ''});
        this.setState({questionObject: questionJSON.question, 
                        currentRoundNumber: questionJSON.currentRoundNumber,
                        questionNumber: questionJSON.questionNumber,
                        totalQuestions: questionJSON.totalQuestions,
                        showQuestion: true
                    });
        console.log("Set question to: %o",questionJSON.question);
    }

    /* Sets up the event handlers for playing the game */
    setupEventHandlers(){
        /* Handles the answer from the server */
        this.socket.on('answer',(data)=>{
            this.setState({answer:data.answer, showAnswer:true});
        });
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
                                    let isCorrect = (data.points > 0)? true :false;
                                    this.setState({answerisCorrect:isCorrect});
                                    
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

        if(this.state.submittedAnswer || this.state.showAnswer){
            let answerStyle = classes.none;
             if(this.state.showAnswer){
                answerStyle = this.state.answerisCorrect ? classes.correct: classes.incorrect;
             }
            return (
                    <Grid container>
                        <Grid item xs={12}>
                            <Grid  className={answerStyle}   container spacing={3}>
                                <Grid className={classes.label}  item xs={4}>
                                Submitted:
                                </Grid>
                                <Grid item xs={8}>
                                     {(this.state.playerAnswer)? renderHTML(this.state.playerAnswer) : '<no answer>'}
                                </Grid>
                                <Grid item xs={12}>
                        {this.state.showAnswer &&
                            <Grid container>
                                <Grid className={classes.label}  item xs={4}>
                                Correct Answer:
                                </Grid>
                                <Grid item xs={8}>
                                    {renderHTML(this.state.answer)}
                                </Grid>
                                <Grid className={classes.label}  item xs={4}>
                                Points&nbsp;Earned: 
                                </Grid>
                                <Grid item xs={8}>
                                    {this.state.pointsEarned}
                                </Grid>
                            </Grid>
                        }
                            </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    );
        }

        if(this.state.showQuestion){
            const qObj = this.state.questionObject;
            if(qObj.answers){

                radios = qObj.answers.map((answer)=>
                    <FormControlLabel  key={answer} value={answer} control={<Radio  color="primary" />} label={renderHTML(answer)} color="primary" />
                );
            }
            return(
                
                <Grid container>
                    <Grid item xs={6}>Category: {qObj.category}</Grid><Grid item xs={6}>Difficulty: {qObj.difficulty} </Grid>
                    <Grid item xs={12} >
                        <Box  p={3}>                
                        <FormControl component="fieldset">
                        <FormLabel component="legend" >{renderHTML(qObj.question)}</FormLabel>
                        <RadioGroup aria-label="playerAnswer" name="playerAnswer" value={this.state.playerAnswer} onChange={this.handleChange}>
                        {radios}
                        </RadioGroup>
                        <Box  p={3}> 
                            <Button type="submit" size="small" variant="contained" className={classes.root}  onClick={this.handleSubmitAnswer}>
                            Submit Answer
                            </Button>
                        </Box>
                        </FormControl>
                    </Box>
                </Grid>
            </Grid>
            );
        }

        // default return
        return ("Loading Question...");
    } // end render
}
Question.propTypes =  {
    classes: PropTypes.object.isRequired,
  };

export default withStyles(styles)(Question);