import React from 'react';
import useTimelineViewModel from '../ViewModel/useTimelineViewModel';
import './Timeline.css';

const Timeline = ({ timelineName, events }) => {
  const processedEvents = useTimelineViewModel(events);

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <h2>{timelineName}</h2>
        <div className="timeline-legend">
          <div className="legend-item">
            <div className="legend-circle completed"></div>
            <span>Completed</span>
          </div>
          <div className="legend-item">
            <div className="legend-circle pending"></div>
            <span>Pending</span>
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
