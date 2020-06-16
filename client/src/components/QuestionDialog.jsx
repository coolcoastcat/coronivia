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
  console.log("DEBUG - QuestionDialog props: %o",props);
  const [open, setOpen] = React.useState(true);
  const [leaveGame,setLeaveGame] = React.useState(props.leaveGame);

  const handleClose = () => {
    setOpen(false);    
  };

  let leaveContent = null; 
      if(leaveGame) { 
        leaveContent = <Box>
                                <Button onClick={props.leaveCallback}>Leave</Button>
                                <Button onClick={props.stayCallback}>Stay</Button>
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
          {props.children}
        </DialogContent>
        <DialogActions>
          {leaveContent}
        </DialogActions>
      </Dialog>
    </Box>
  );
}