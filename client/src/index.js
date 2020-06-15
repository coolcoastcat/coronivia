import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { Button } from "./components/Button";
import {JoinGame } from "./components/Game";
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
           <Button onClick={() => {console.log("Clicked on Create Game")}}
           type="button" 
           buttonSize="btn--medium"
           buttonStyle='btn--success--outline'>Create Game</Button>
        </Link>
        <Link to="/join">
          <Button onClick={() => {console.log("Clicked on Join Game")}}
           type="submit" 
           buttonSize="btn--medium"
           buttonStyle='btn--success--solid'>Join Game</Button>
        </Link>
        <InfoDialog open={this.state.showInfoDialog} closeCallback={this.handleCloseInfoClick} />
      </Box>
    );
  }
};


// ========================================

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

