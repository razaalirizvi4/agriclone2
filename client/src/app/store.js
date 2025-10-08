// import { createStore, applyMiddleware } from 'redux';
// import createSagaMiddleware from 'redux-saga';
// import rootReducer from './rootReducer';
// import rootSaga from './rootSaga';

// const sagaMiddleware = createSagaMiddleware();

// const store = createStore(
//   rootReducer,
//   applyMiddleware(sagaMiddleware)
// );

// sagaMiddleware.run(rootSaga);

// export default store;
import { createStore, applyMiddleware } from 'redux';
import createSagaMiddleware from 'redux-saga';
import {thunk} from 'redux-thunk'; // ✅ add this
import rootReducer from './rootReducer';
import rootSaga from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

const store = createStore(
  rootReducer,
  applyMiddleware(thunk, sagaMiddleware) // ✅ thunk added before saga
);

sagaMiddleware.run(rootSaga);

export default store;
