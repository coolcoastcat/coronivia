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
        fontWeight: 600,
       fontFamily: "sans-serif",
       fontSize: '20px'
    },
    content: {
        fontFamily: "sans-serif",
        fontSize: '20px'
    },
    correct: {
        background: '#edf7ed'
    },
    incorrect: {
        background: '#fdedeb'
    },
    none: {

    },
    question: {
        fontSize: '25px',
        // background: 'lightGray',
        background: 'linear-gradient(45deg, #b1fac5 30%, #f9fcbd 90%)',
        padding: '4px 5px',
        fontFamily: 'sans-serif'
    },
    questionDataHd: {
        fontSize: '14px',
        fontWeight: 600,
   
    },
    sans: {
        fontFamily: 'sans-serif'     
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
        console.debug("props: %o",props);

        this.player = props.thisPlayer;
        this.gameRoomName = props.gameRoomName;

        console.debug("questionData: %o",this.questionData);
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
        this.setState({showAnswer: false, 
                        submittedAnswer: false, 
                        playerAnswer: null, 
                        answer: '',
                        answerisCorrect:false, 
                        pointsEarned: 0}); // Reset answer state
        this.setState({questionObject: questionJSON.question, 
                        currentRoundNumber: questionJSON.currentRoundNumber,
                        questionNumber: questionJSON.questionNumber,
                        totalQuestions: questionJSON.totalQuestions,
                        showQuestion: true
                    });
        console.debug("Set question to: %o",questionJSON.question);
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
        console.debug("Sending answer to server: %o",sendData);
        this.socket.emit('player-answer',
                          sendData,
                            (data)=>{
                                if(data.success){
                                    this.setState({submittedAnswer: true, pointsEarned: data.points});
                                    let isCorrect = (data.points > 0)? true :false;
                                    this.setState({answerisCorrect:isCorrect});
                                    
                                    console.debug('Answer successfully received and earned points: '+data.points);
                                } else {
                                    this.setState({submittedAnswer: true, playerAnswer: data.error});
                                    console.error('Error from server: '+data.error)
                                }
                            });
        

    }

    render(){
        const { classes } = this.props;
        let radios = '';

        if(this.state.submittedAnswer || this.state.showAnswer){
            let answerStyle = classes.none;
            const qObj = this.state.questionObject;
             if(this.state.showAnswer){
                answerStyle = this.state.answerisCorrect ? classes.correct: classes.incorrect;
             }
            return (
                    <Grid container>
                        <Grid item xs={12}>
                            <Grid  className={answerStyle} container>
                                <Grid className={classes.question} item >{renderHTML(qObj.question)}</Grid>
                                <Grid className={classes.label}  item xs={4}>
                                <Box p={1} >
                                    Sent:
                                </Box>
                                </Grid>
                                <Grid   className={classes.content} item xs={8}>
                                <Box p={1} >
                                    {(this.state.submittedAnswer)? renderHTML(this.state.playerAnswer) : '<no answer>'}
                                </Box>
                                </Grid>
                                <Grid item xs={12}>
                        {this.state.showAnswer &&
                            <Grid container>
                                <Grid className={classes.label}  item xs={4}>
                                    <Box p={1} >
                                        Answer:
                                    </Box>
                                </Grid>
                                <Grid  className={classes.content} item xs={8}>
                                <Box p={1} >
                                    {renderHTML(this.state.answer)}
                                </Box>
                                </Grid>
                                <Grid className={classes.label}  item xs={4}>
                                <Box p={1} >
                                    Points: 
                                </Box>
                                </Grid>
                                <Grid  className={classes.content} item xs={8}>
                                    <Box p={1}>
                                    {this.state.pointsEarned}
                                    </Box>
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
                    <Grid className={classes.sans} item xs={6}><Box className={classes.questionDataHd} component="span">Category:</Box> {qObj.category}</Grid><Grid className={classes.sans}  item xs={6}><Box className={classes.questionDataHd} component="span">Difficulty: {qObj.difficulty} </Box></Grid>
                    <Grid item xs={12} >
                        <Box  p={3}>                
                        <FormControl component="fieldset">
                        <FormLabel className={classes.question} component="legend" >{renderHTML(qObj.question)}</FormLabel>
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