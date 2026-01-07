import React from "react";
import UserManagement from "../features/users/components/UserManagement";

function UserManage() {
  return (
    <div
      className="container"
      style={{ paddingTop: "1rem", paddingBottom: "1rem" }}
    >
      <h2>User Management</h2>
      <UserManagement />
    </div>
  );
}

export default UserManage;
