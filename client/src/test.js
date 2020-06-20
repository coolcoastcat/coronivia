// used as a mock to test components
import React from 'react';
import TimerSpinner from "./components/timer-spinner";
import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import MultipleSelect from './test-multi-select-example'

export class Test extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            progress: 10,
            interval: 10,
            timerRunning: true,
            showText: true
        }
        this.timer = null;
  //      this.startTimer();
        
    
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.setState({progress: (this.state.progress <= 0) ? 10 : this.state.progress - 1} );
            console.log("Progress: "+this.state.progress);
          }, 800);
          console.log("Starting timer: %o",this.timer)
    }

    handleButton = ()=>{
        if(this.state.timerRunning){
            console.log("Stopping timer ");
            clearInterval(this.timer);
            this.setState({timerRunning: false});
        } else {
            console.log("Starting timer");
            this.setState({timerRunning: true});
            this.startTimer();
        }
    }
    toggleShowText = ()=>{
        this.setState({showText: !this.state.showText});
    }
    

    render(){

    return (
            <Box style={{background: 'white'}}>    
                <MultipleSelect />
                <br/>
    
            </Box> 
    );
    }
}

