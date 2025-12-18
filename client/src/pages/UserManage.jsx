import React from "react";
import UserManagement from "../components/View/UserManagement";

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
