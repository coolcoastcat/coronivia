import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { Button } from "./components/Button";
import {JoinGame } from "./components/JoinGame";
import {CreateGame} from "./components/CreateGame";
import InfoTwoToneIcon from '@material-ui/icons/InfoTwoTone';
import InfoDialog from "./components/InfoDialog";
import { green } from '@material-ui/core/colors';
import { Test } from "./test";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";
import Box from '@material-ui/core/Box';

let devMsg = '';
if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
  devMsg = '[development]';
}
const VERSION = 'v0.0.8';


/////////////  REACT ROUTES /////////////  
export default function App() {
  return (
    <div className="App">
    <header className="App-header">
      {/*  <img src={logo} className="App-logo" alt="logo" /> */}
    <Router>
      <div>
        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/join">
            <Join  />
          </Route>
          <Route path="/playing">
            <Playing  />
          </Route>
          <Route path="/oplaying">
            <OPlaying  />
          </Route>
          <Route path="/create">
            <Create />
          </Route>
          <Route path="/test">
            <TestRoute />
          </Route>
          <Route path="/">
            <Home />
          </Route>
        </Switch>
      </div>
    </Router>
    <div>  
      </div>
      </header>
    </div>
  );
}


function Home() {
  return <Landing />;
}

function Join() {
  return <JoinGame />;
}

function Playing(){ // An alias for Join with player params to handle page refresh to rejoin an existing game
  return <JoinGame />
}

function OPlaying(){ // An alias for CreateGame with Owner params to handle page refresh to rejoin an existing game
  return <CreateGame />
}

function Create() {
  return <CreateGame />;
}

function TestRoute() {
  return <Test />;
}




/////////////// CLASS DEFINTIONS /////////////


class Landing extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      showInfoDialog: false
    }
    console.log("Welcome to Coronivia!");
    console.log("This is an open source project and by looking in the console output, you're probably after some details!");
    console.log("Please visit the project page for details on this open source project:");
    console.log("https://github.com/coolcoastcat/coronivia");
    console.log("Set your console log level to Verbose (Chrome) or Debug (Firefox) to see all of the debug output.")
  }

  /* Handles the click of the info icon */
  handleInfoClick = () => {
    this.setState({showInfoDialog:true});
  }

   /* Handles the click of the info icon */
   handleCloseInfoClick = () => {
    this.setState({showInfoDialog:false});
  }

  render(){
    return(
      <Box>
        <Box>
          <h1 >Welcome to Coronivia! <InfoTwoToneIcon onClick={this.handleInfoClick} style={{ color: green[500] }} /> {devMsg}</h1>
        </Box>
         <Link to="/create">
           <Button onClick={() => {console.debug("Clicked on Create Game")}}
           type="button" 
           buttonSize="btn--medium"
           buttonStyle='btn--success--outline'>Create Game</Button>
        </Link>
        <Link to="/join">
          <Button onClick={() => {console.debug("Clicked on Join Game")}}
           type="submit" 
           buttonSize="btn--medium"
           buttonStyle='btn--success--solid'>Join Game</Button>
        </Link>
        <InfoDialog open={this.state.showInfoDialog} closeCallback={this.handleCloseInfoClick} />
        <Box p={2} style={{fontSize:'8px', color: 'white'}}>{VERSION}</Box>
      </Box>
    );
  }
};


// ========================================

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

