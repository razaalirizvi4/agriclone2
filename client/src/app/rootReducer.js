import { combineReducers } from 'redux';
import eventStreamReducer from '../features/eventStream/eventStream.slice.js';

const rootReducer = combineReducers({
  eventStream: eventStreamReducer,
});

export default rootReducer;
