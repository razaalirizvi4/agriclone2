
## we are going to define three models for it.
userRole,
user,
permissions.


# permission will have structure
= {
    name: "", // full name of permission that can be displayed.
    action :"", // permission action to match against.
    module: "", // permission module that it belongs to and would be matched against.
}

for checking permission on events, permissionCheck method would be created on frontend and backend which will accept:
action, module permission object which it wants to check as argument and the user permissions and then assess if its available in user.

# userRole structure
= {
    role : "", // display name of role. for now they are Admin, Manager, Farmer, Farm Manager.
    roleId: "", // unique id for role to be present in user as relation.
    permissions : [] // array of permission id to relation to permission object for projection.

}

# user structure
= {
    name: "" ,// display name
    email : "", // unique
    hashPassword : "", // encrypted hashed password with salt
    roleId: "", // relates to userRole
    permissions : [], // extracted permissionsIds at run time from userRole permissions as relation for projection.
    contact: "" // optional
    isAdmin : "" // to define system related admin
    active: "" // to disable temporary and disable login access
    timestamp: true, // for updatedAt and createdAt timestamps.
    isRemoved: boolean, // for soft deletion.
},

## Authentication
will be using jwt authentication. initial admin will be added by seed.js.
session will be mantained on frontend and each api call (generic method) will be passing stored session token in authorization header.
express api middleware will be passed CheckAuth method if auth is required on that api and will check for valid logged in user, and will pass the user object to actual controller method ahead in req.user. 

## Login page on frontend will have simple structure with centered layout login box containing
<Centered Box>
Login (heading)

Email Input
Password Input

Login Button.

</Centered Box>

Redirected to dashboard page/home page

## Register page will have similar box as login page layout just the information is additional.
<Centered Box>
Register  (Farmer)

Email (required valid email)
Password (required)
Confirm Password (required)
Contact (optional)

</Centered Box>

WIll be registered as farmer role by default on backend when registered through this page.
Redirected to login page.


## After login
Top bar will have a Logout button and signed in user name at most right area as defined in topbar layout (frontend-layout.md) file.


## Login & Register page layout (frontend-layout.md)
Should adhere to sidebar and topbar layout guide during these pages.
Both to not show sidebar and only show simpler topbar when opened.
(Should be handled through main page)


## Core Main page without logged in.
When not logged in and tried to access authorized only pages on frontend, it should redirect to login page.