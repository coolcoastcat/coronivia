import React from "react";
import "./countdown.css";

export class Countdown extends React.Component{
    constructor(props){
        super(props)
        console.log("Countdown constructed with props: %o",props);
        
        this.state = {
            time: 0,
            showCountdown: false,
            timerMessage: ''
        };
    }

    /* Updates the countdown 
        @param data.count - The current timer digit
        @param data.timerMessage - Message to show above the countdown
        @showCountdown - Whether to show or hide the countdown number
    */
    updateCountdown(data){
        this.setState({time: data.count, timerMessage: data.timerMessage, showCountdown: data.showCountdown });
    }
    
    render(){
        
        return(
            <div>
                <p>{this.state.timerMessage}</p>
                <p> {this.state.showCountdown && 'Time remaining: '+ this.state.time }</p>
            </div>
        );
        
    }
}