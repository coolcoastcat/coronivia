import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

export default function CircularProgressWithLabel(props) {
  console.log("Props: %o",props);
  const percentRemain = (props.interval && props.value)? (props.value / props.interval) * 100 : 0;
  const countText = (props.showTimerText && props.interval)? Math.round(props.value,)+'s' : '';

  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress style={{color: 'green'}} variant="static" value={percentRemain} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography variant="caption" component="div" color="textSecondary">{countText}</Typography>
      </Box>
    </Box>
  );
}

CircularProgressWithLabel.propTypes = {
  /**
   * The value of the progress indicator for the determinate and static variants.
   * Value between 0 and 100.
   */
  value: PropTypes.number.isRequired,
};

