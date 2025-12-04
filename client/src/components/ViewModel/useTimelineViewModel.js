const useTimelineViewModel = (events = []) => {
  const defaultColor = '#60a5fa'; // A default blue color
  
  // Helper to get color opacity for background
  const getColorWithOpacity = (color, opacity = 0.1) => {
    // If color is hex, convert to rgba
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  };
  
  return events.map(event => {
    const color = event.color || defaultColor;
    
    // Set circle colors based on State field
    let circleBackground, circleBorder;
    if (event.State === 'Pending') {
       circleBackground = '#FFFFFF'; // White for pending
       circleBorder = '#999999';
    } else if (event.State === 'Completed') {
      circleBackground = '#4CAF50'; // Green for completed
      circleBorder = '#4CAF50';
    } else {
      // Fallback to original color logic
      circleBackground = getColorWithOpacity(color, 0.3);
      circleBorder = color;
    }
    
    // Enhanced card styling with gradient and better colors
    const cardStyle = {
      border: `2px solid ${color}`,
      background: `linear-gradient(135deg, ${getColorWithOpacity(color, 0.08)} 0%, ${getColorWithOpacity(color, 0.15)} 100%)`,
      transition: 'all 0.3s ease',
      '--card-accent-color': color, // CSS variable for hover effects
    };

    const circleStyle = {
      borderColor: circleBorder,
      background: circleBackground,
      transition: 'all 0.3s ease',
      boxShadow: `0 2px 4px ${getColorWithOpacity(color, 0.3)}`,
    };
    
    const TextStyle = {
      color: color,
      fontWeight: '600',
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
