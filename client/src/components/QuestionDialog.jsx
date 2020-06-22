import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Box from '@material-ui/core/Box';
import TimerSpinner from "./timer-spinner";



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
          <DialogContentText component={'span'}   style={{fontSize:'30px', verticalAlign: 'middle'}}>
            {props.timerText} <TimerSpinner value={props.count} interval={props.interval} showTimerText={props.showSeconds} />
          </DialogContentText>
        }
          <Box style={{ fontFamily: 'sans-serif'}}>
          {(props.children) ? props.children : "Thanks for joining in! Your screen will refresh on the next question."}
          </Box>
        </DialogContent>
        <DialogActions>
          {leaveContent}
        </DialogActions>
      </Dialog>
    </Box>
  );
}