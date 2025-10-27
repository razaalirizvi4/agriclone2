import React, { useState } from 'react';
import useTimelineViewModel from '../ViewModel/useTimelineViewModel';
import './Timeline.css';

const Timeline = ({ componentName, events }) => {
  const [filter, setFilter] = useState('All'); // 'All', 'Pending', 'Completed'
  
  // Filter events based on selected filter
  const filteredEvents = events.filter(event => {
    if (filter === 'All') return true;
    return event.State === filter;
  });
  
  const processedEvents = useTimelineViewModel(filteredEvents);

return (
  <div className="container">
    <div className="timeline-header">
      <h3>{componentName}</h3>
      <div className="timeline-legend">
        <div 
          className={`legend-item filter-button ${filter === 'All' ? 'active' : ''}`}
          onClick={() => setFilter('All')}
        >
          <div className="legend-circle all"></div>
          <span>Show All</span>
        </div>
        <div 
          className={`legend-item filter-button ${filter === 'Pending' ? 'active' : ''}`}
          onClick={() => setFilter('Pending')}
        >
          <div className="legend-circle pending"></div>
          <span>Pending</span>
        </div>
        <div 
          className={`legend-item filter-button ${filter === 'Completed' ? 'active' : ''}`}
          onClick={() => setFilter('Completed')}
        >
          <div className="legend-circle completed"></div>
          <span>Completed</span>
        </div>
      </div>
    </div>
    <div className="timeline">
      {processedEvents.map((event, index) => (
        <div className="timeline-event" key={index}>
          <div className="timeline-circle" style={event.circleStyle}></div>
          <div className="timeline-card" style={event.cardStyle}>
            <div className="card-header">
              <span>{event.date}</span>
              <img src={event.icon} alt="" className="card-icon" />
            </div>
            <div className="card-body">
              <p>{event.details}</p>
            </div>
          </div>
          <div className="event-name" style={event.TextStyle}>{event.name}</div>
        </div>
      ))}
    </div>
  </div>
);
};

export default Timeline;
