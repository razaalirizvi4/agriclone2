# Event Stream Implementation Plan

This document outlines the tasks required to implement the event stream feature as described in `prompts/eventLogOnAgriculture.md`.

## 1. Backend (Node.js/Express.js)

### 1.1. Create EventStream Model
- Create a new file `backend/api/models/eventStream/eventStream.model.js`.
- Define the Mongoose schema for the `EventStream` collection with the following fields:
    - `Feature_Type`: String
    - `Module_Action`: String
    - `Date`: Date
    - `State`: String
    - `Meta_Data`: Object
    - `RelationIds`: Object
    - `RelatedUsers`: Array of objects with `_id`, `email`, `name`, `status`.

### 1.2. Create EventStream Data Layer
- Create a new file `backend/api/dataLayer/eventStream.dataLayer.js`.
- Implement the following methods:
    - `getEvents(queryParams)`: Retrieves events based on optional `feature`, `moduleAction`, or `relationIds`.
    - `updateEventStatus(eventId, userId, status)`: Updates the status of a related user in an event.
    - `pushEvent(eventData)`: (Internal use only) Creates a new event. This will be used by other services.

### 1.3. Create EventStream Service
- Create a new file `backend/services/eventStream.service.js`.
- This service will act as a bridge between the controller and the data layer.
- Implement the following methods:
    - `getEvents(queryParams)`: Calls the corresponding data layer method.
    - `updateEventStatus(eventId, userId, status)`: Calls the corresponding data layer method.
    - `pushEvent(eventData)`: (Internal use only) Calls the corresponding data layer method.

### 1.4. Create EventStream Controller
- Create a new file `backend/api/controllers/eventStream/eventStream.controller.js`.
- Implement the following methods:
    - `getEvents(req, res)`: Handles the GET request to fetch events.
    - `pullEvent(req, res)`: Handles the PUT/PATCH request to update the event status.

### 1.5. Create EventStream Routes
- Create a new file `backend/api/routes/eventStream/eventStream.routes.js`.
- Define the following routes:
    - `GET /api/eventstream`: Maps to `eventStream.controller.getEvents`.
    - `PUT /api/eventstream/pull/:eventId`: Maps to `eventStream.controller.pullEvent`.

### 1.6. Update Service Registry
- Register the `eventStream.service.js` in `backend/services/serviceRegistry.js`.

## 2. Frontend (React)

### 2.1. Create EventStream Service
- Create a new file `client/src/services/eventStream.service.js`.
- Implement methods to communicate with the backend API:
    - `getEvents(params)`: Fetches events from the backend.
    - `updateEventStatus(eventId, userId, status)`: Updates the event status.

### 2.2. Create EventStream Redux/Zustand Slice (State Management)
- Create a new file `client/src/features/eventStream/eventStream.slice.js`.
- Manage the state of the event stream, including loading, events, and errors.

### 2.3. Create EventStream Component
- Create a new component `client/src/components/EventStream.jsx`.
- Display the list of events.
- Allow users to interact with events (e.g., change status).

### 2.4. Integrate EventStream Component
- Add the `EventStream` component to a relevant page (e.g., a new `EventStreamPage.jsx` or an existing dashboard).
- Create a new route in the router for the event stream page.
