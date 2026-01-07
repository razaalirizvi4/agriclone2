import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getEvents, updateEventStatus } from '../../eventStream/eventStream.slice';
import { formatDateYYYYMMDD } from '../../../utils/date';

const EventStream = () => {
  const dispatch = useDispatch();
  const { events, loading, error } = useSelector((state) => state.eventStream);

  useEffect(() => {
    dispatch(getEvents());
  }, [dispatch]);

  const handleStatusChange = (eventId, userId, status) => {
    dispatch(updateEventStatus({ eventId, data: { userId, status } }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1>Event Stream</h1>
      {events.map((event) => (
        <div key={event._id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
          <h3>{event.Feature_Type} - {event.Module_Action}</h3>
          <p>State: {event.State}</p>
          <p>Date: {formatDateYYYYMMDD(event.Date)}</p>
          <div>
            <h4>Related Users:</h4>
            <ul>
              {event.RelatedUsers.map((user) => (
                <li key={user._id}>
                  {user.name} ({user.email}) - Status: {user.status}
                  <button onClick={() => handleStatusChange(event._id, user._id, 'Read')}>Mark as Read</button>
                  <button onClick={() => handleStatusChange(event._id, user._id, 'ActionTaken')}>Mark as Action Taken</button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EventStream;
