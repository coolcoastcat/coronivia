// used as a mock to test components
import React from 'react';
import Question from './components/Question';
import QuestionDialog from './components/QuestionDialog';
import RoundDialog from './components/RoundDialog';
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
        "A really long answer that should allow me to test how the dialogs are going to work"]
    };

    const playerName = 'Archer';
    const roomName = 'XXXX';
    const timerText = 'Time remaining: 3';
    const dialogTitle = 'Question 1 of 5';
    
    const testData = { 
        currentRoundNumber: 1, 
        questionNumber: 1, 
        totalQuestions: 1, 
        question: questionData };
    return (
      <div className="App">
      <header className="App-header">
       
        <div>
        
        <QuestionDialog timerText={timerText} dialogTitle={dialogTitle} >
            <Question socket={socket} questionJSON={testData} thisPlayer={playerName} gameRoomName={roomName}  />
        </QuestionDialog>
        
        </div>
      
        </header>
      </div>
    );
  }
