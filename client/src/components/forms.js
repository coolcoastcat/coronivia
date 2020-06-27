import React from 'react';
import { Redirect } from 'react-router';
import _ from 'lodash';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Select from '@material-ui/core/Select';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import { green } from '@material-ui/core/colors';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import {
  withStyles,
  makeStyles,
} from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 170,
    maxWidth: 250
  },
  selectEmpty: {
    marginTop: theme.spacing(2),
  },
  root: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  margin: {
    margin: theme.spacing(1),
    minWidth: 120
  },
  colorfulButton: {
    background: 'linear-gradient(45deg, #32a852 30%, #d8e038 90%)',
    border: 0,
    borderRadius: 3,
    boxShadow: '0 3px 5px 2px rgba(245, 250, 155, .3)',
    color: 'white',
    height: 48,
    padding: '0 30px',
  },
  boxWhite: {
    background: 'white'
  },
  borderIt: {
    width: '50%'
  },
  heading: {
    
  },
  panel: {
    maxWidth: 300,
    textAlign: 'center'
  },
  fill: {
    flexGrow: 1
  }
}));

const GreenCheckbox = withStyles({
  root: {
    color: green[400],
    '&$checked': {
      color: green[600],
    },
  },
  checked: {},
})((props) => <Checkbox color="default" {...props} />);


const ValidationTextField = withStyles({
  root: {
    '& input:valid + fieldset': {
      borderColor: green[400],
      borderWidth: 2,
    },
    '& input:invalid + fieldset': {
      borderColor: green[700],
      borderWidth: 2,
    },
    '& input:valid:focus + fieldset': {
      borderLeftWidth: 6,
      padding: '4px !important', // override inline-style
    },
  },
})(TextField);

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const categoryList = [
                      { category_id: 9, category: 'General Knowledge' },
                      { category_id: 10, category: 'Entertainment' },
                      { category_id: 17, category: 'Science' },
                      { category_id: 20, category: 'Art & Mythology' },
                      { category_id: 21, category: 'Sports' },
                      { category_id: 22, category: 'Geography' },
                      { category_id: 23, category: 'History' },
                      { category_id: 24, category: 'Politics' },
                      { category_id: 31, category: 'Animation & Manga' },
                      { category_id: 15, category: 'Video Games' }
                      ];
const selectedCategoryArray = ['General Knowledge','Entertainment','Science','Art & Mythology', 
                          'Sports', 'Geography', 'History','Politics'];
const selectedCategoryIDs = [9,10,17,20,21,22,23,24];

export function CreateGameForm(props) {
    const classes = useStyles();

    const MAX_ROUNDS = 10;
    const MAX_QUESTIONS_PER_ROUND = 10;
    const DIFFICULTIES = ["any","easy","medium","hard"];
    const [rounds, setRounds] = React.useState(1);
    const [difficulty, setDifficulty] = React.useState('any');
    const [questions, setQuestions] = React.useState(5);
    const [owner, setOwner] = React.useState('');
    const [goHome,setGoHome] = React.useState(false);
    const [ownerNameHelper, setOwnerHelper] = React.useState('');
    const [categories, setCategories] = React.useState(selectedCategoryArray);
    const [category_ids, setCategoryIDs] = React.useState(selectedCategoryIDs);
    const [pauseBetweenRounds, setPauseBetweenRounds] = React.useState(true);
    const [questionFive, setQuestionFive] = React.useState(false);

    const handlePauseChange = (event) => {
      console.debug("received event: %o",event.target.checked);
      setPauseBetweenRounds(event.target.checked);
    };

    const handleQuestionFive = (event) => {
      console.debug("received questionFive event, checked? %o",event.target.checked);
      setQuestionFive(event.target.checked);
    };

    const handleCategoriesChange = (event) => {
      const catArray = event.target.value;
      console.debug ('Received cats: '+catArray);
      let catIDArray = [];
      catArray.forEach(category=>{
        categoryList.forEach((cat)=>{
          if(cat.category === category){
            catIDArray.push(cat.category_id);
          }
        });
      });
  
      setCategories(catArray);
      setCategoryIDs(catIDArray);
    };
  

    function handleRoundsChange(event) {
      setRounds(event.target.value);
      console.debug('set rounds to: '+event.target.value);
    }
    
    function handleQuestionsChange(event) {
      setQuestions(event.target.value);
      console.debug('set questions to: '+event.target.value);
    }
  
    function handleDifficultyChange(event) {
      setDifficulty(event.target.value);
      console.debug('set difficulty to: '+event.target.value);
    }
  
    function handleOwnerChange(event) {
      let tmpPlayerName = event.target.value.trim();
      if(tmpPlayerName.length <= 20){ 
        setOwner(tmpPlayerName);
      } else {
        setOwnerHelper('20 character max');
      }
    }
  
    function handleSubmit(event) {
      var submission = {
        questions: questions,
        rounds: rounds,
        difficulty: difficulty,
        owner: owner,
        categories: category_ids,
        pauseBetweenRounds: pauseBetweenRounds,
        questionFive: questionFive
      };
      console.debug("CreateGame submission: %o",submission);
      props.handleFormSubmit(submission);  
      event.preventDefault();
    }
    
    if(goHome){
      return <Redirect to="/" />;
    }

      return (
        <Box   p={2} >
        <Box >Create A Game</Box>

        <Paper>
        <Box  p={2}>
        <form onSubmit={handleSubmit}>
        <Grid   justify="center" container>
        <Grid item xs={12}>
            <ValidationTextField
              className={classes.margin}
              label="Player Name"
              required
              variant="outlined"
              id="validation-outlined-input"
              value={owner} 
              onChange={handleOwnerChange}
              margin="dense"
              helperText={ownerNameHelper}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl className={classes.formControl}>
            <InputLabel id="rounds-select-label">Rounds</InputLabel>
            <Select
              labelId="rounds-select-label"
              id="rounds-select"
              value={rounds}
              onChange={handleRoundsChange}
            >
              { _.range(1, MAX_ROUNDS + 1).map(value =><MenuItem key={value} value={value}>{value}</MenuItem>) }
            </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl className={classes.formControl}>
            <InputLabel id="questions-select-label">Questions Per Round</InputLabel>
            <Select
              labelId="questions-select-label"
              id="questions-select"
              value={questions}
              onChange={handleQuestionsChange}
            >
              { _.range(1, MAX_QUESTIONS_PER_ROUND + 1).map(value =><MenuItem key={value} value={value}>{value}</MenuItem>) }
            </Select>
            </FormControl>
          </Grid>

    

          <Grid  className={classes.panel} item xs={12}>
           <ExpansionPanel>
            <ExpansionPanelSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography className={classes.heading}>Advanced Options</Typography>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
            <Grid container>

              <Grid item xs={12}>
                <FormControl className={classes.formControl}>
                <InputLabel id="difficulty-select-label">Question Difficulty</InputLabel>
                <Select
                  labelId="difficulty-select-label"
                  id="difficulty-select"
                  value={difficulty}
                  onChange={handleDifficultyChange}
                >
                  { DIFFICULTIES.map(difficulty => <MenuItem key={difficulty} value={difficulty}>{difficulty}</MenuItem>) }  
                </Select>
                </FormControl>
              </Grid>
            
              <Grid className={classes.formControl}  item sm={12}>
                  <FormControl required className={classes.formControl}>
                    <InputLabel id="demo-mutiple-checkbox-label">Categories</InputLabel>
                    <Select
                      labelId="categories-label"
                      id="categories-mutiple-checkbox"
                      multiple
                      value={categories}
                      onChange={handleCategoriesChange}
                      input={<Input />}
                      renderValue={(selected) => selected.join(', ')}
                      MenuProps={MenuProps}
                    >
                      {categoryList.map((tmpCat) => (
                        <MenuItem key={tmpCat.category_id} value={tmpCat.category}>
                          <Checkbox checked={categories.indexOf(tmpCat.category) > -1} />
                          <ListItemText primary={tmpCat.category} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
    
              <Grid item sm={12}>
                  <FormControlLabel
              control={<GreenCheckbox checked={pauseBetweenRounds} onChange={handlePauseChange} name="pauseBetweenRounds" />}
              label="Pause beteween rounds"
              />
               
              </Grid>
              <Grid item sm={12}>
                  <FormControlLabel
              control={<GreenCheckbox checked={questionFive} onChange={handleQuestionFive} name="questionFive" />}
              label="Enable Question Five"
              />
               
              </Grid>
      
            </Grid>
            </ExpansionPanelDetails>
           </ExpansionPanel>
          </Grid>
           
          <Grid item xs={12}>
          <Box p={1}>
                <Button onClick={() => {}}
                  type="submit" 
                  variant="contained" className={classes.colorfulButton} 
                  >Create Game</Button>
          &nbsp;
          <Button onClick={() => setGoHome(true)}
                  type="button" 
                  variant="outlined" 
                  >Back</Button>
          </Box>
        </Grid>
           </Grid>
        </form>
        </Box>
        </Paper>
        </Box>
      );
  
  }

  export function JoinGameForm(props){
    const classes = useStyles();
    const [player, setPlayer] = React.useState((props.player) ? props.player : '');
    const [playerNameHelper, setPlayerHelper] = React.useState('');
    const [joinRoomHelper, setJoinRoomHelper] = React.useState('');
    const [roomname,setRoomname] = React.useState((props.roomname) ? props.roomname : '');
    const [goHome,setGoHome] = React.useState(false);

  
    function handleRoomnameChange(event) {
      if(event.target.value.length <= 4){ 
        setRoomname(event.target.value);
      } else {
        setJoinRoomHelper('4 characters')
      }
      
    }

    function handlePlayerChange(event) {
      let tmpPlayerName = event.target.value.trim();
      if(tmpPlayerName.length <= 20){ 
        setPlayer(tmpPlayerName);
      } else {
        setPlayerHelper('20 character max');
      }
    }
  
    function handleSubmit(event) {
      if(roomname.length === 4){
      console.log('A Player: '+player+ 'is joining roomname: ' + roomname);
        var submission = {
          roomname: roomname,
          player: player
        };
        
        props.handleFormSubmit(submission);  
       
      } else {
        setJoinRoomHelper('Must be 4 characters');
      }
      event.preventDefault();
    }

    if(goHome){
      return <Redirect to="/" />;
    }

      return (
        <Box p={2} >
        <Box >Join A Game</Box>

        <Paper>
        <Box p={2}>
        <form onSubmit={handleSubmit}>
        <Grid container>
          <Grid item xs={12}>
            <ValidationTextField
              className={classes.margin}
              label="Player Name"
              required
              variant="outlined"
              id="validation-outlined-input"
              value={player} 
              onChange={handlePlayerChange}
              margin="dense"
              helperText={playerNameHelper}
            />
          </Grid>
          <Grid item xs={12}>
            <ValidationTextField
                className={classes.margin}
                label="Room Code"
                required
                variant="outlined"
                id="validation-outlined-input"
                value={roomname} 
                onChange={handleRoomnameChange}
                margin="dense"
                helperText={joinRoomHelper}
              />
          </Grid>
          <Grid item xs={12}>
       
          <Button onClick={() => {}}
                  type="submit" 
                  variant="contained" className={classes.colorfulButton} 
                  >Join Game</Button>
          &nbsp;
          <Button onClick={() => setGoHome(true)}
                  type="button" 
                  variant="outlined" 
                  >Back</Button>
          </Grid>
        </Grid> 
        </form>
        </Box>
        </Paper>
    
        </Box>
      );
  }
