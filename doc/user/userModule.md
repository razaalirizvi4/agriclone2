# User Module Documentation

This document outlines the implementation tasks for the user module, covering both frontend and backend aspects, including authentication and authorization.

## 1. Backend Implementation

### 1.1. Data Models

We will define three core models:

#### 1.1.1. `Permission` Model

Represents a specific action within a module that a user can or cannot perform.

```javascript
{
    name: "",    // Full name of permission (e.g., "View Dashboard", "Edit User").
    action: "",  // Permission action to match against (e.g., "view", "edit", "delete").
    module: "",  // Module it belongs to (e.g., "dashboard", "users", "products").
}
```

#### 1.1.2. `UserRole` Model

Defines a role with a set of associated permissions.

```javascript
{
    role: "",         // Display name of the role (e.g., "Admin", "Manager", "Farmer", "Farm Manager").
    roleId: "",       // Unique ID for the role, used for relation in the User model.
    permissions: []   // Array of permission IDs, relating to Permission objects for projection.
}
```

#### 1.1.3. `User` Model

Represents a user in the system with their details and role.

```javascript
{
    name: "",           // Display name of the user.
    email: "",          // Unique email address.
    hashPassword: "",   // Encrypted hashed password with salt.
    roleId: "",         // Relates to UserRole.
    permissions: [],    // Extracted permission IDs at runtime from userRole permissions for projection.
    contact: "",        // Optional contact information.
    isAdmin: false,     // Boolean to define system-related admin.
    active: true,       // Boolean to disable temporary and disable login access.
    isRemoved: false    // Boolean for soft deletion.
}
```

### 1.2. Authentication

*   **JWT Authentication:** JSON Web Tokens will be used for stateless authentication.
*   **Initial Admin:** An initial admin user will be added via `seed.js` for system setup.
*   **Session Management:** The frontend will maintain the session token. Each API call will pass this token in the `Authorization` header.
*   **`CheckAuth` Middleware:** An Express API middleware named `CheckAuth` will be implemented. If authentication is required for an API route, this middleware will verify the validity of the logged-in user and attach the user object to `req.user` for subsequent controller methods.

### 1.3. API Endpoints

*   `POST /api/auth/login`: Authenticate user and return JWT.
*   `POST /api/auth/register`: Register a new user (defaulting to 'Farmer' role).
*   `GET /api/user/profile`: Get authenticated user's profile.
*   `PUT /api/user/profile`: Update authenticated user's profile.
*   `POST /api/auth/logout`: Invalidate user session (if applicable, e.g., blacklist JWT).
*   `GET /api/permissions/check`: Endpoint to check specific permissions (optional, can be handled by middleware).

### 1.4. Permission Checking

A `permissionCheck` method will be created on both frontend and backend. This method will accept `action`, `module`, and the user's permissions object as arguments. It will then assess if the required permission is available in the user's permissions.

## 2. Frontend Implementation

### 2.1. Authentication Flow

*   **Login Page:** Users will log in via a dedicated page.
*   **Registration Page:** New users will register via a dedicated page.
*   **Logout:** A logout button in the Topbar will handle session termination.

### 2.2. UI Components

#### 2.2.1. Login Page

*   **Structure:** Simple centered layout with a login box.
*   **Content:**
    *   `Login` (heading)
    *   `Email Input`
    *   `Password Input`
    *   `Login Button`
*   **Redirection:** Upon successful login, redirect to the dashboard/home page.

#### 2.2.2. Register Page

*   **Structure:** Similar centered box layout as the login page.
*   **Content:**
    *   `Register (Farmer)` (heading)
    *   `Email` (required, valid email)
    *   `Password` (required)
    *   `Confirm Password` (required)
    *   `Contact` (optional)
*   **Default Role:** Users registered through this page will be assigned the 'Farmer' role by default on the backend.
*   **Redirection:** Upon successful registration, redirect to the login page.

### 2.3. Topbar Integration

*   **Logged-in State:** After login, the Topbar will display a `Logout` button and the signed-in user's name in the far-right area, as defined in the `frontend-layout.md` guide.
*   **Not Logged-in State:** For pages like Login and Register, the Topbar will be simpler, without the user-specific right-hand section.

### 2.4. Sidebar Integration

*   **Conditional Display:** The sidebar will not be shown on the Login and Register pages. This will be handled by the main page component (e.g., `CorePage`) based on the current route.

### 2.5. Generic API Call Method

A generic method for making API calls will be implemented on the frontend. This method will automatically pass the stored session token in the `Authorization` header for authenticated requests.

## 3. General Considerations

*   **Security:** Implement best practices for password hashing, input validation, and secure token handling.
*   **Conventions:** Adhere to existing project conventions for code style, naming, and directory structure.

## 4. Frontend - Protecting Authorized Routes

To prevent unauthenticated users from accessing authorized-only pages, a `ProtectedRoute` component will be implemented. This component will act as a wrapper around routes that require authentication.

**Key Points:**

*   **Centralized Logic:** All authentication checks for protected routes are handled in one place, making it easy to manage, update, and debug.
*   **Clean Route Definitions:** Your route definitions remain clean and focused on the component to render, without cluttering them with authentication checks.
*   **Reusability:** The `ProtectedRoute` can be reused for any number of routes that require authentication.
*   **User Experience:** It provides a seamless redirect experience for unauthenticated users, guiding them to the login page.
*   **Prevents Unauthorized Access:** It effectively prevents unauthenticated users from viewing protected content.

**Implementation Steps:**

1.  **Create `ProtectedRoute.jsx`:** A new component that checks `authService.getCurrentUser()`. If no user is found, it uses `react-router-dom`'s `Navigate` component to redirect to `/login`.
2.  **Wrap Protected Routes:** In `main.jsx` (or your main routing file), wrap the routes that require authentication with the `ProtectedRoute` component. Public routes (like `/login` and `/register`) should *not* be wrapped.
3.  **`Navigate` with `replace`:** Use `Navigate to="/login" replace` to ensure the login page replaces the unauthorized page in the history stack, preventing redirect loops when the user tries to go back.

This approach ensures that only authenticated users can access protected pages, enhancing the security and user experience of the application.

## 5. Frontend - Public Route Handling for Authenticated Users

To enhance user experience, if an already authenticated user tries to access the `/login` or `/register` pages, they should be automatically redirected to the home page (`/`). This prevents a logged-in user from being presented with login or registration forms unnecessarily.

**Implementation Steps:**

1.  **Create `PublicRoute.jsx`:** A new component that checks for an authenticated user.
2.  If a user is found, it redirects to the home page using `Navigate`.
3.  If no user is found, it renders the requested public component (e.g., `LoginPage` or `RegisterPage`).
4.  Wrap the public routes (`/login`, `/register`) with this `PublicRoute` component in the main router configuration.