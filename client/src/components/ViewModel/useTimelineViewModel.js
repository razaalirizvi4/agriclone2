const useTimelineViewModel = (events = []) => {
  const defaultColor = '#cccccc'; // A default color for events without a specified color
  return events.map(event => {
    const color = event.color || defaultColor;
    const cardStyle = {
      border: `2px solid ${color}`,
      background: `${color}33`,
      transition: 'background 0.4s ease',
    };

    const circleStyle = {
      borderColor: color,
      background: `${color}33`,
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
