import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';


export default function InfoDialog(props) {
  const [open, setOpen] = React.useState(props.open);

  React.useEffect(() => {
   setOpen(props.open);
    },[props.open]);

  const handleClose = () => {
    props.closeCallback();
  };


  
 
    console.debug("invoked and open: "+open+" props.open: "+props.open);
    return (
    <Box>
      <Dialog fullWidth={true} open={open} onClose={handleClose} >
        <DialogTitle id="dialog-title"></DialogTitle>
        <DialogContent>
          <DialogContentText component={'span'}  style={{fontSize:'14px', verticalAlign: 'middle'}}>
            <Paper >
                <Box  m={3}>
                Coronivia is an open source, online trivia game that friends can play casual 
                trivia games while Zoom-ing, Teams-ing, GotoMeeting, Hangouts-ing, Webex-ing, etc. The name, 
                Coronivia, is a nod to the special times and circumstances that led to the strong need for 
                online distractions with friends, families and colleagues. There are currently no questions about
                COVID-19!
                </Box>
                <Box m={3}>
                Coronivia is a game for 1 to 1 million players (I'm still looking for sponsored hosting for the million player games ;).
                Load testing is still pending so your mileage may vary with very large groups. Playing is simple: an owner creates a room
                with rounds and questions and sends prospective players a link.  The user enters a player name and joins the game. 
                The owner kicks the game off and trivia is played!
                </Box>
                <Box m={3}>
                This application uses questions from the <a href='http://opentdb.com/' target="_blank"  rel="noopener noreferrer">Open Triva Database project</a>.
                Because that project is no longer under active maitenance, I've extracted the questions and organized them into categories and sub-categories for
                a nicer playing experience. The questions and this entire project are released under the same 
                <a href='http://creativecommons.org/licenses/by-sa/4.0/' target='_blank' rel="noopener noreferrer">license</a> used in the Open Trivia Database project.
                </Box>
                <Box m={3}>
                This game was created using React and Material-UI for the application client and ExpressJS for the server. It uses socket.io
                for synchronous communication with the server and is deployed on Google Cloud Platform App Engine. Visit 
                the <a  href="https://github.com/coolcoastcat/coronivia" target="_blank"  rel="noopener noreferrer"> GitHub repo</a> to review
                the latest source. Contributions are welcome! If you have a hankering to add to the feature list of fix some bugs, 
                please review the <a href='https://github.com/coolcoastcat/coronivia/blob/master/CONTRIBUTING.md' target='_blank' rel="noopener noreferrer">Contributor's Guide</a>.
                If you find an issue or have an enhancement request, please review the current list and, if it's new, log 
                it <a  href="https://github.com/coolcoastcat/coronivia/issues" target="_blank" rel="noopener noreferrer"> here</a>.  
                </Box>
                <Box component={'span'} variant={'body2'} m={3}>
                This work is licensed under a <a href='http://creativecommons.org/licenses/by-sa/4.0/' target='_blank' rel="noopener noreferrer">Creative Commons Attribution-ShareAlike 4.0 International License</a>.
                <a href='http://creativecommons.org/licenses/by-sa/4.0/' target='_blank' rel="noopener noreferrer"><br /><img alt='' src='https://camo.githubusercontent.com/e170e276291254896665fa8f612b99fe5b7dd005/68747470733a2f2f692e6372656174697665636f6d6d6f6e732e6f72672f6c2f62792d73612f342e302f38387833312e706e67' /></a>
                </Box>
                <Box component={'span'} variant={'body2'} m={3}>
                - Russell Neville
                </Box>
            </Paper>
          </DialogContentText>
          {props.children}
        </DialogContent>
        <DialogActions>
        <Button onClick={handleClose}>OK</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}