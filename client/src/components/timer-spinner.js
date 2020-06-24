import React from 'react';
import PropTypes from 'prop-types';
import CircularProgress from '@material-ui/core/CircularProgress';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

export default function CircularProgressWithLabel(props) {
  console.debug("Props: %o",props);
  const percentRemain = (props.interval && props.value)? (props.value / props.interval) * 100 : 0;
  const currentCount = (props.value && props.value < 0) ? 0 : props.value;
  
  const countText = (props.showTimerText && currentCount)? Math.round(currentCount)+'s' : '';
  let colorStyle = (props.showTimerText) ? {color: 'green'} : {color: 'blue'};

  if(props.showTimerText && percentRemain < 50){
    colorStyle = (percentRemain > 25) ?  {color: '#FFD700'} :  {color: '#B22222'};  
  }

  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress style={colorStyle} variant="static" value={percentRemain} />
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

