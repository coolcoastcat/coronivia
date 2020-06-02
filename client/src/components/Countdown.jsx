import React from "react";
import "./countdown.css";

export class Countdown extends React.Component{
    constructor(props){
        super(props)
        console.log("Countdown constructed with props: %o",props);
        
        this.state = {
            time: props.time
        };
    }
    
    render(){
        return(
            <div>
            this.state.time
            </div>
        );
    }
}