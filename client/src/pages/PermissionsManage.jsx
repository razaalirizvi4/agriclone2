import React from "react";
import PermissionsTable from "../features/permissions/components/PermissionsTable";

function PermissionsManage() {
  return (
    <div className="container" style={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
      <h2>Permissions Management</h2>
      <PermissionsTable />
    </div>
  );
}

export default PermissionsManage;