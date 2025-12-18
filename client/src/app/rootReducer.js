import { combineReducers } from 'redux';
import eventStreamReducer from '../features/eventStream/eventStream.slice.js';
import locationReducer from '../features/location/location.slice.js';
import cropReducer from '../features/cropModule/crop.slice.js';
import typeReducer from '../features/type/type.slice.js';
import permissionsReducer from '../features/permissions/permissions.slice.js';

const rootReducer = combineReducers({
  eventStream: eventStreamReducer,
  locations: locationReducer,
  crops: cropReducer,
  types: typeReducer,
  permissions: permissionsReducer,
});

export default rootReducer;
