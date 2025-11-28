import { combineReducers } from 'redux';
import eventStreamReducer from '../features/eventStream/eventStream.slice.js';
import locationReducer from '../features/location/location.slice.js';
import cropReducer from '../features/cropModule/crop.slice.js';
import typeReducer from '../features/type/type.slice.js';

const rootReducer = combineReducers({
  eventStream: eventStreamReducer,
  locations: locationReducer,
  crops: cropReducer,
  types: typeReducer,
});

export default rootReducer;
