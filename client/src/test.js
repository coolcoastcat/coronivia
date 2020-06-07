// used as a mock to test components
import React from 'react';
import WinnerList from './components/WinnerList';
import QuestionDialog from './components/QuestionDialog';
import io from "socket.io-client/lib";
import Box from '@material-ui/core/Box';


export class Test extends React.Component {
    constructor(props){
        super(props);
    
        this.SERVER_URI = "http://localhost:5000";
        this.socket = io(this.SERVER_URI);
        this.winningPlayerArray =[{name: 'Archer',score:77},{name: 'Launa', score:77}];
        this.state = {
          showQuestion: true,
          timerText: 'Game Over!',
          questionDialogTitle: 'Game Winner'  
        };

    
    }
    
    handleLeaveGame = ()=>{
        alert('called Test.handleLeaveGame');
    }

    render(){
    return (
     
            <Box>
                <QuestionDialog showQuestion={this.state.showQuestion} timerText={this.state.timerText} dialogTitle={this.state.questionDialogTitle} >
                    <WinnerList leaveGame={this.handleLeaveGame}  winners={this.winningPlayerArray} />
                </QuestionDialog>
            </Box> 
    );
    }
}
