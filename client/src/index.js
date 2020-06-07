import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import { Button } from "./components/Button";
import { CreateGame, JoinGame } from "./components/Game";
import { Test } from "./test";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

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
  
  render() {
    return(
      <div>
        <div>
          <h1 >Welcome to Coronivia!</h1>
        </div>
         <Link to="/create">
           <Button onClick={() => {console.log("Clicked on Create Game")}}
           type="button" 
           buttonSize="btn--medium"
           buttonStyle='btn--success--outline'>Create Game</Button>
        </Link>
        <Link to="/join">
          <Button onClick={() => {console.log("Clicked on Join Game")}}
           type="button" 
           buttonSize="btn--medium"
           buttonStyle='btn--success--solid'>Join Game</Button>
        </Link>
      </div>
    );
  }
};


// ========================================

ReactDOM.render(
  <App />,
  document.getElementById('root')
);

