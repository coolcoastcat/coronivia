import React from 'react';
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import renderHTML from 'react-render-html';
import Fade from '@mui/material/Fade';

const questionFiveTitles = [
    "No idea.",
    "Smkdwn, this one's for you.",
    "If only Geech, the shmell-hound, were here.",
    "No clue.",
    "Say what?",
    "Duuuuude, how should I know?😎",
    "Five! Five! Five!",
    "I'm going to close my my eyes and pick...",
    "Random answer please.",
    "These questions are friggin' hard!",
    "Who picked these questions?",
    "I'll take Five for $500, Alex...",
    "¯\\_(ツ)_/¯",
    "Roll the bones!",
    "I got nothing.",
    "Bubkes, is my answer.",
    "I PICK...FIVE!!!!",
    "Yeaaaaaaahhh, I'm out.",
    "🙈 👉🏽",
    "🤷🏻‍",
    "🎯 Throwing a dart here.",
    "You can pound sand, my man.",
    "Do you think they should make iPhones for babies? Cuz I do.",
    "Hey, my man. Just pick anything.",
    "The cross between a helicoptor an elephant and a rhino (heliphino ;).",
    "Let the gods decide...",
    "Seriously?",
    "civrot probably knows...",
    "bobhrs says...",
    "It's all gibberish. Gimme somthing random.",
    "Serenity now!!"
]

/* Get a random funny error phrase to prefix dialogs */
function getQuestionFiveTitle(){
return questionFiveTitles[Math.floor(Math.random() * questionFiveTitles.length)];
}


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
        margin: '10px 0px',
        background: '#edf7ed'
    },
    incorrect: {
        margin: '10px 0px',
        background: '#fdedeb'
    },
    none: {

    },
    question: {
        fontSize: '18px',
        // background: 'lightGray',
        padding: '4px 4px',
        background: 'linear-gradient(45deg, #b1fac5 30%, #f9fcbd 90%)',
        fontFamily: 'sans-serif'
    },
    questionPad: {
        margin: '10px 0px',
    },
    questionDataHd: {
        fontSize: '14px',
        fontWeight: 600
    },
    sans: {
        fontFamily: 'sans-serif'     
    },
    sent: {
        margin: '2px 0px',
        fontWeight:"fontWeightBold",
        background: '#f0f8ff'
    },
    notsent: {
        margin: '2px 0px',
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
            totalQuestions: 0,
            disabled: true,
            randomAnswer: null,
            randomAnswerLabel: null,
            randomAnswerVisible: null,
            answerVisible: [true,true,true,true]

        };
        this.radios = [];
        this.questionFive = props.questionFive;
        this.socket = props.socket;
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
                        pointsEarned: 0,
                        disabled: true,
                        answerVisible: [true,true,true,true],
                        questionObject: questionJSON.question, 
                        currentRoundNumber: questionJSON.currentRoundNumber,
                        questionNumber: questionJSON.questionNumber,
                        totalQuestions: questionJSON.totalQuestions,
                        showQuestion: true,
                        randomAnswer: null,
                        randomAnswerLabel: '',
                        randomAnswerVisible: true
                    });

        console.debug("Set question to: %o",questionJSON.question);
        console.debug("Question state is: %o",this.state);
    }

    /* Sets up the event handlers for playing the game */
    setupEventHandlers(){
        /* Handles the answer from the server */
        this.socket.on('answer',(data)=>{
            this.setState({answer:data.answer, showAnswer:true});
        });

        /* Handles a request to remove an answer */
        this.socket.on('answer-remove',(data)=>{
            console.debug('Received event: answer-remove with data %o',data)
            let answerVisible = this.state.answerVisible;
            this.state.questionObject.answers.forEach((answer,idx)=>{
                if(answer === data.removeAnswer){
                    answerVisible[idx] = false;
                }
            });
            this.setState({answerVisible: answerVisible,randomAnswerVisible: false});
        });
    }

    
    handleSubmitAnswer= (event)=>{
        this.setState({playerAnswer: event.target.value, disabled:false, randomAnswerVisible: false});
        let sendData = {player: this.player, gameRoomName: this.gameRoomName, playerAnswer:event.target.value};
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

        if(this.state.showAnswer){
            let answerStyle = classes.none;
            const qObj = this.state.questionObject;
             if(this.state.showAnswer){
                answerStyle = this.state.answerisCorrect ? classes.correct: classes.incorrect;
             }
            return (
                    <Grid container>
                   <Grid className={classes.sans} item xs={12}><Box className={classes.questionDataHd} component="span">Category:</Box> {renderHTML(qObj.category)} - {renderHTML(qObj.sub_category)}</Grid>
                    <Grid className={classes.sans} item xs={12}><Box className={classes.questionDataHd} component="span">Difficulty:</Box> {qObj.difficulty}</Grid>
                        <Grid item xs={12}>
                            <Grid  className={answerStyle} container>
                                <Grid xs={12} className={classes.question} item >{(qObj && qObj.question)? renderHTML(qObj.question) : 'Loading question...'}</Grid>
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

                this.radios = qObj.answers.map((answer,idx)=> {
                    let style = (this.state.playerAnswer && this.state.playerAnswer === answer) ? classes.sent:classes.notsent;
                        return <Fade in={this.state.answerVisible[idx]} key={idx}><FormControlLabel className={style}  value={answer} control={<Radio  color="primary" />} label={renderHTML(answer)} color="primary" /></Fade>
                }
                );
                if(this.questionFive){ // select a random answer from the qObj.answers array and assign it as the value for a questionFive
                    
                    if(!this.state.randomAnswer || this.state.randomAnswerLabel === ''){ // if a random answer hasn't been initialized, do so
                        this.setState({randomAnswerLabel: getQuestionFiveTitle()});
                        this.setState({randomAnswer: qObj.answers[Math.floor(Math.random() * qObj.answers.length)] });
                    }
                    // For every state refresh, re-add this option to the answer array
                    this.radios.push(<Fade in={this.state.randomAnswerVisible} key={'rand_'+this.state.randomAnswer}><FormControlLabel value={this.state.randomAnswer} control={<Radio  color="primary" />} label={this.state.randomAnswerLabel} color="primary" /></Fade>);
                }
            }
            return(
                
                <Grid container>
                    <Grid className={classes.sans} item xs={12}><Box className={classes.questionDataHd} component="span">Category:</Box> {renderHTML(qObj.category)} - {renderHTML(qObj.sub_category)}</Grid>
                    <Grid className={classes.sans} item xs={12}><Box className={classes.questionDataHd} component="span">Difficulty:</Box> {qObj.difficulty}</Grid>
                    <Grid item xs={12} >
                        <Box className={classes.questionPad} >                
                        <FormControl component="fieldset">
                        <FormLabel className={classes.question} component="legend" >{renderHTML(qObj.question)}</FormLabel>
                        <RadioGroup aria-label="playerAnswer" name="playerAnswer" value={this.state.playerAnswer} onChange={this.handleSubmitAnswer}>
                        {this.radios}
                        </RadioGroup>
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
