import { combineReducers } from 'redux';
import eventStreamReducer from '../features/eventStream/eventStream.slice.js';
import locationReducer from '../features/locations/slices/location.slice.js';
import cropReducer from "../features/crops/slices/crop.slice";
import typeReducer from '../features/type/type.slice.js';
import permissionsReducer from '../features/permissions/slices/permissions.slice.js';
import userReducer from '../features/users/slices/users.slice.js';
import rolesReducer from '../features/roles/roles.slice.js';

const rootReducer = combineReducers({
  eventStream: eventStreamReducer,
  locations: locationReducer,
  crops: cropReducer,
  types: typeReducer,
  permissions: permissionsReducer,
  users: userReducer,
  roles: rolesReducer,
});

export default rootReducer;
