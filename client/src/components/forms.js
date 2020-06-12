import React from 'react';
import { Redirect } from 'react-router';
import './forms.css';
import _ from 'lodash';

import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import FormHelperText from '@material-ui/core/FormHelperText';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import { green } from '@material-ui/core/colors';
import {
  withStyles,
  makeStyles,
} from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 170,
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
  }
}));

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

export function CreateGameForm(props) {
    const classes = useStyles();

    const MAX_ROUNDS = 10;
    const MAX_QUESTIONS_PER_ROUND = 50;
    const DIFFICULTIES = ["any","easy","medium","hard"];
    const [rounds, setRounds] = React.useState(1);
    const [difficulty, setDifficulty] = React.useState('any');
    const [questions, setQuestions] = React.useState(1);
    const [owner, setOwner] = React.useState('');
    const [goHome,setGoHome] = React.useState(false);
    const [ownerNameHelper, setOwnerHelper] = React.useState('');
  
    const createGameResponse = '';

    function handleRoundsChange(event) {
      setRounds(event.target.value);
      console.log('set rounds to: '+event.target.value);
    }
    
    function handleQuestionsChange(event) {
      setQuestions(event.target.value);
      console.log('set questions to: '+event.target.value);
    }
  
    function handleDifficultyChange(event) {
      setDifficulty(event.target.value);
      console.log('set difficulty to: '+event.target.value);
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
        owner: owner
      };
      
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
        <Grid  container>
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
    const [player, setPlayer] = React.useState('');
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
      if(roomname.length == 4){
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
