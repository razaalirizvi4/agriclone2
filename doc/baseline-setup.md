# Baseline Setup Tasks

This document outlines the initial setup tasks for the client and backend of the AgriPro project.

## Client (React.js with Vite)

### 1. Project Initialization
- Use Vite to create a new React project:
  ```bash
  npm create vite@latest client -- --template react
  ```
- Navigate into the new directory:
  ```bash
  cd client
  ```

### 2. Dependency Installation
- Install core libraries for routing, state management, and API calls:
  ```bash
  npm install react-router-dom react-redux redux redux-saga redux-thunk
  ```

### 3. Recommended Folder Structure
```
/src
|-- /app
|   |-- store.js         # Redux store configuration
|   |-- rootSaga.js      # Root saga for redux-saga
|   |-- rootReducer.js   # Root reducer for redux
|-- /components
|   |-- /layout          # Layout components (CorePage, Topbar, Sidebar)
|-- /features            # Feature-based modules (e.g., /users, /products)
|   |-- /user
|   |   |-- userSlice.js # Redux slice (actions, reducer)
|   |   |-- userSaga.js  # Sagas for async actions
|   |   |-- User.jsx     # Component
|-- /pages               # Top-level page components
|-- /router              # React Router configuration
|   |-- index.js
|-- /services            # API call logic
|-- main.jsx             # Application entry point
```

### 4. Initial Setup Files

- **`server.js` (or `index.js`)**:
  - Entry point of the application.
  - Initializes Express, connects to the database, registers middleware, and mounts the API routes.

- **`.env`**:
  - Store environment variables like `PORT`, `MONGO_URI`, etc.

### 5. Local MongoDB Setup
- Ensure a local MongoDB server is running. The default connection string is typically `mongodb://localhost:27017/agripro`.

### 4. Frontend Routing and Layout Setup

This section outlines the updated frontend routing and layout structure. We will use a single router file (`client/src/router/index.jsx`) to define all routes, including nested routes for layout management. A new `CorePage` component will handle the overall application layout, including conditional rendering of a sidebar and topbar.

For detailed information on the core component layout (CorePage, Topbar, Sidebar), refer to [Frontend Layout Documentation](frontend-layout.md).

-   **`client/src/router/index.jsx`**:
    This file will now combine route definitions and the `createBrowserRouter` configuration. It will also define nested routes to integrate the `CorePage` layout.



-   **`client/main.jsx`**:
    The main entry point of the React application will use the `RouterProvider` to provide the configured router to the application.

## Backend (Node.js with Express)

### 1. Project Initialization
- Navigate into the backend directory and initialize a new Node.js project:
  ```bash
  cd backend
  npm init -y
  ```

### 2. Dependency Installation
- Install Express, Mongoose for MongoDB, and other essential packages:
  ```bash
  npm install express mongoose cors dotenv multer
  ```
- Install development dependencies:
  ```bash
  npm install -D nodemon
  ```

### 3. Folder Structure & Configuration

- **`/serverSetup`**:
  - `config.js`: Centralized configuration for port, database URI, JWT secrets, etc. Use `dotenv` to manage environment variables.
  - `database.js`: Handles MongoDB connection using Mongoose.

- **`/api`**:
  - `routes/`: Define API routes here (e.g., `userRoutes.js`). All routes should be prefixed with `/api/:collectionName` (e.g., `/api/users`).
  - `controllers/`: Logic to handle requests and send responses.
  - `models/`: Mongoose schemas for database collections.

- **`/services`**:
  - `serviceRegistry.js`: A simple singleton object to register and provide services, models, and other modules across the application to avoid circular dependencies and excessive imports.

- **`/seed`**:
  - Contains scripts to populate the database with initial data (e.g., `seed.js`).

- **`/public/uploads`**:
  - A folder to store static files and resources uploaded via `multer`.

### 4. Initial Setup Files

- **`server.js` (or `index.js`)**:
  - Entry point of the application.
  - Initializes Express, connects to the database, registers middleware, and mounts the API routes.

- **`.env`**:
  - Store environment variables like `PORT`, `MONGO_URI`, etc.

### 5. Local MongoDB Setup
- Ensure a local MongoDB server is running. The default connection string is typically `mongodb://localhost:27017/agripro`.
