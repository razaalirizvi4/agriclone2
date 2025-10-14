const useTimelineViewModel = (events) => {
  const defaultColor = '#cccccc'; // A default color for events without a specified color

  return events.map(event => {
    const color = event.color || defaultColor;
    
    const cardStyle = {
      borderTop: `5px solid ${color}`,
    };

    const circleStyle = {
      borderColor: color,
    };

    return {
      ...event,
      cardStyle,
      circleStyle,
    };
  });
};

export default useTimelineViewModel;
