import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Box from '@material-ui/core/Box';
import TimerSpinner from "./timer-spinner";
import Grid from '@material-ui/core/Grid';



export default function QuestionDialog(props) {
  console.debug("DEBUG - QuestionDialog props: %o",props);
  const [open, setOpen] = React.useState(true);
  const [leaveGame,setLeaveGame] = React.useState(false);

  const handleClose = () => {
    setOpen(false);    
  };

  React.useEffect(()=>console.debug("Updated QuestionDialog with props: %o",props));


  function localHandleLeave(){
    setLeaveGame(true);
  }

  function cancelLeave(){
    setLeaveGame(false);
  }


  let leaveContent =  <Box> <Button onClick={localHandleLeave}>Leave Game</Button></Box>;
  

  if (leaveGame) {
    leaveContent = <Box style={{ fontFamily: 'sans-serif', fontWeight: 600 }}> Do you really want to leave the game?
                    <Button onClick={props.leaveCallback}>Yes, I'm done.</Button>&nbsp;<Button onClick={cancelLeave}>I'll stay!</Button>
                  </Box>;
  }

  return (
    <Box>
      <Dialog 
              disableBackdropClick={true}
              disableEscapeKeyDown={true}
              fullWidth={true} 
              open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        {(props.dialogTitle !== '') && <DialogTitle id="form-dialog-title">{props.dialogTitle}</DialogTitle> }
        <DialogContent>
        {(props.timerText !== '') &&
          <DialogContentText component={'span'}  >
            <Grid container spacing={2} justify="center">
              <Grid  style={{fontSize:'25px'}} item xs={10}>{props.timerText}</Grid> 
              <Grid item xs={2}><TimerSpinner value={props.count} interval={props.interval} showTimerText={props.showSeconds} pointsCountdown={props.pointsCountdown} points={props.points} /></Grid>
            </Grid>
          </DialogContentText>
        }
          <Box style={{ fontFamily: 'sans-serif'}}>
          {(props.children) ? props.children : "Thanks for playing! Awaiting the next question."}
          </Box>
        </DialogContent>
        <DialogActions>
          {leaveContent}
        </DialogActions>
      </Dialog>
    </Box>
  );
}