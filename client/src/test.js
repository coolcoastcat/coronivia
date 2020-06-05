// used as a mock to test components
import React from 'react';
import Question from './components/Question';
import io from "socket.io-client/lib";


export function Test() {
    const SERVER_URI = "http://localhost:5000";
    const socket = io(SERVER_URI);
    const questionData = {
        category: "Science & Nature",
        type: "multiple",
        difficulty: "easy",
        question: "Which element has the highest melting point?",
        answers: ["Tungsten",
        "Carbon",
        "Platinum",
        "Osmium"]
    };

    const playerName = 'Archer';
    
    const testData = { 
        currentRoundNumber: 1, 
        questionNumber: 1, 
        totalQuestions: 1, 
        question: questionData };
    return (
      <div className="App">
      <header className="App-header">
       
        <div>
        <Question socket={socket} questionJSON={testData} thisPlayer={playerName}  /> 
        </div>
      
        </header>
      </div>
    );
  }
