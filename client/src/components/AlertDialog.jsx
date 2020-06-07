import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

export default function AlertDialog(props) {
  const [open, setOpen] = React.useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleContinue = () => {
    if (typeof props.callback === 'function') {
        props.callback();
    }
    setOpen(false);
  };



  return (
    <span>
      <Button variant="contained"  color="default" onClick={handleClickOpen}>
       {props.children}
      </Button>
      <Dialog
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
          <Button onClick={handleContinue} color="primary">
            {props.buttonContinueText}
          </Button>
          <Button onClick={handleCancel} color="primary" autoFocus>
            {props.buttonCancelText}
          </Button>
        </DialogActions>
      </Dialog>
    </span>
  );
}
