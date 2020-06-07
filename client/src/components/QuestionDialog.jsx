import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Box from '@material-ui/core/Box';



export default function QuestionDialog(props) {
  const [open, setOpen] = React.useState(true);
  const [leaveGame,setLeaveGame] = React.useState(false);

  const handleClose = () => {
    setOpen(false);    
  };

  const confirmLeaveGame = ()=>{
      console.log("User says they want to leave");
  }

  const cancelLeaveGame = ()=>{
    setLeaveGame(false); 
  }

  let leaveContent = null; 
      if(leaveGame) { 
        leaveContent = <Box>
                                Do you really want to leave the game?
                                <Button onClick={confirmLeaveGame}>Leave</Button>
                                <Button onClick={cancelLeaveGame}>Stay</Button>
                              </Box>;
      } 
  
    return (
    <Box>
      <Dialog 
              disableBackdropClick={true}
              disableEscapeKeyDown={true}
              fullWidth={true} 
              open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
        <DialogTitle id="form-dialog-title">{props.dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {props.timerText}
          </DialogContentText>
          {props.children}
        </DialogContent>
        <DialogActions>
          {leaveContent}
        </DialogActions>
      </Dialog>
    </Box>
  );
}