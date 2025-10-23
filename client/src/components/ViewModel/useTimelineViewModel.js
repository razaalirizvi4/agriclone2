const useTimelineViewModel = (events = []) => {
  const defaultColor = '#cccccc'; // A default color for events without a specified color
  return events.map(event => {
    const color = event.color || defaultColor;
    
    // Set circle colors based on State field
    let circleBackground, circleBorder;
    if (event.State === 'Pending') {
      circleBackground = '#4CAF50'; // Green for pending
      circleBorder = '#4CAF50';
    } else if (event.State === 'Completed') {
      circleBackground = '#FFFFFF'; // White for completed
      circleBorder = '#999999'; // Darker grey border for better visibility
    } else {
      // Fallback to original color logic
      circleBackground = `${color}33`;
      circleBorder = color;
    }
    
    const cardStyle = {
      border: `2px solid ${color}`,
      background: `${color}33`,
      transition: 'background 0.4s ease',
    };

    const circleStyle = {
      borderColor: circleBorder,
      background: circleBackground,
      transition: 'background 0.4s ease',
    };
    
    const TextStyle = {
      color: color,
    };
    return {
      ...event,
      cardStyle,
      circleStyle,
      TextStyle,
    };
  });
};

export default useTimelineViewModel;
