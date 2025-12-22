import React from "react";
import { MdAddCircle, MdEditNote, MdDeleteForever } from "react-icons/md";
import { toast } from "react-toastify";
import useUserManageModel from "../ViewModel/useUserManageModel";
import "./PermissionsTable.css";

const UserManagement = () => {
  const {
    users,
    roles,
    form,
    editingId,
    selectedUserId,
    selectedUser,
    handleChange,
    startAdd,
    startEdit,
    cancelEdit,
    saveUser,
    softDeleteSelected,
    selectUser,
  } = useUserManageModel();

  const handleSave = async () => {
    const ok = await saveUser();
    if (!ok) {
      toast.error("Please fill in Name, Email and Role.");
      return;
    }
    if (editingId === "new") {
      toast.success("User added");
    } else {
      toast.success("User updated");
    }
  };

  const handleDelete = () => {
    if (!selectedUserId) return;
    softDeleteSelected();
    toast.success("User removed");
  };

  const renderEditableRow = (idKey) => (
    <tr key={idKey} className="permissions-row">
      <td>
        <input
          type="text"
          name="name"
          className="permissions-inline-input"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />
      </td>
      <td>
        <input
          type="email"
          name="email"
          className="permissions-inline-input"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />
      </td>
      <td>
        <div className="permissions-edit-wrapper">
          <select
            name="role"
            className="permissions-inline-input"
            value={form.role}
            onChange={handleChange}
          >
            <option value="">Select Role</option>
            {roles.map((role) => (
              <option key={role._id} value={role.roleId}>
                {role.role}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="permissions-icon-button"
            onClick={handleSave}
            aria-label="Save"
          >
            ✓
          </button>
          <button
            type="button"
            className="permissions-icon-button"
            onClick={cancelEdit}
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>
      </td>
      <td>
        <input
          type="text"
          name="contact"
          className="permissions-inline-input"
          placeholder="Contact"
          value={form.contact}
          onChange={handleChange}
        />
      </td>
    </tr>
  );

  return (
    <div className="permissions-card">
      <div className="permissions-header">
        <h3 className="permissions-title">Users</h3>
        <div className="permissions-actions">
          <MdAddCircle
            className="permissions-action-icon"
            size={22}
            color={editingId !== null ? "#b0bec5" : "#2e7d32"}
            onClick={editingId === null ? startAdd : undefined}
          />
          <MdEditNote
            className="permissions-action-icon"
            size={24}
            color={
              selectedUserId == null || editingId !== null
                ? "#b0bec5"
                : "#1976d2"
            }
            onClick={
              selectedUserId != null && editingId === null
                ? () => startEdit(selectedUserId)
                : undefined
            }
          />
          <MdDeleteForever
            className="permissions-action-icon"
            size={22}
            color={
              selectedUserId == null || editingId !== null
                ? "#b0bec5"
                : "#d32f2f"
            }
            onClick={
              selectedUserId != null && editingId === null
                ? handleDelete
                : undefined
            }
          />
        </div>
      </div>

      <table className="permissions-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Contact</th>
          </tr>
        </thead>
        <tbody>
          {editingId === "new" && renderEditableRow("new")}
          {users.map((user) => {
            const rowId = user._id;
            const isEditing = editingId === rowId;

            return isEditing ? (
              renderEditableRow(rowId)
            ) : (
              <tr
                key={rowId}
                className={`permissions-row${
                  selectedUserId === rowId ? " selected" : ""
                }`}
                onClick={() => selectUser(rowId)}
              >
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
                <td>{user.contact}</td>
              </tr>
            );
          })}
          {users.length === 0 && editingId !== "new" && (
            <tr>
              <td colSpan="4" className="permissions-empty">
                No users defined.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {selectedUser && (
        <div style={{ marginTop: "1rem" }}>
          <h4>
            Permissions for user: <strong>{selectedUser.name}</strong>
          </h4>
          {selectedUser.roleId && selectedUser.roleId.permissions && selectedUser.roleId.permissions.length > 0 ? (
            <ul
              style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}
            >
              {selectedUser.roleId.permissions.map((perm) => (
                <li key={perm.id ?? perm._id}>
                  {perm.name} ({perm.action} - {perm.module})
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ fontSize: "0.9rem", color: "#666" }}>
              No permissions assigned to this role.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default UserManagement;
