import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Box from '@material-ui/core/Box';
import Paper from '@material-ui/core/Paper';

export default function AlertDialog(props) {
  const [open, setOpen] = React.useState(true);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    if (props.cancelCallback && typeof props.cancelCallback === 'function') {
      props.cancelCallback();
  }
    setOpen(false);
  };

  const handleContinue = () => {
    if (props.callback && typeof props.callback === 'function') {
        props.callback();
    }
    setOpen(false);
  };

  console.log("should be returning a dialog...");
  return (
    <Box>
      <Paper>
      <Dialog
        disableBackdropClick={true}
        disableEscapeKeyDown={true}
        open={open}
        onClose={handleCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{props.dialogTitle}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {props.dialogText}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          
          <Button onClick={handleContinue} variant="outlined" >
            {props.buttonContinueText}
          </Button>
          { props.buttonCancelText && 
          <Button onClick={handleCancel} color="primary" autoFocus>
            {props.buttonCancelText}
          </Button>
          }
        </DialogActions>
      </Dialog>
      </Paper>
    </Box>
  );
}
