import { combineReducers } from 'redux';
import eventStreamReducer from '../features/eventStream/eventStream.slice.js';
import locationReducer from '../features/location/location.slice.js';
import cropReducer from '../features/cropModule/crop.slice.js';

const rootReducer = combineReducers({
  eventStream: eventStreamReducer,
  locations: locationReducer,
  crops: cropReducer,
});

export default rootReducer;
