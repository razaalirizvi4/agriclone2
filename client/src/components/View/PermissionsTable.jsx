import React, { useState } from "react";
import { MdAddCircle, MdEditNote, MdDeleteForever } from "react-icons/md";
import { toast } from "react-toastify";
import usePermissionTableModel from "../ViewModel/usePermissionTableModel";
import ConfirmationModal from "./confirmationModal";
import "./PermissionsTable.css";

const emptyForm = {
  name: "",
  action: "",
  module: "",
};

const PermissionsTable = () => {
  const { permissions, addPermission, updatePermission, deletePermission } =
    usePermissionTableModel();

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null); // null | "new" | number
  const [selectedId, setSelectedId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLabel, setDeleteLabel] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRowSelect = (permId) => {
    // Do not change selection while adding a brand‑new row
    if (editingId === "new") return;

    // If we were editing an existing row, cancel edit when clicking another row
    if (editingId !== null) {
      handleCancelEdit();
    }

    setSelectedId(permId);
  };

  const handleAddClick = () => {
    setEditingId("new");
    setForm(emptyForm);
    setSelectedId(null);
  };

  const handleStartUpdate = () => {
    if (selectedId == null) return;
    const perm = permissions.find((p) => (p.id ?? p._id) === selectedId);
    if (!perm) return;
    const rowId = perm.id ?? perm._id;
    setEditingId(rowId);
    setForm({
      name: perm.name,
      action: perm.action,
      module: perm.module,
    });
  };

  const handleDeleteRequest = () => {
    if (selectedId == null) return;
    const perm = permissions.find((p) => (p.id ?? p._id) === selectedId);
    const label = perm ? `${perm.name} (${perm.action} - ${perm.module})` : "";
    setDeleteLabel(label);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedId == null) return;
    deletePermission(selectedId);
    setSelectedId(null);
    setEditingId(null);
    setForm(emptyForm);
    setIsDeleteModalOpen(false);
    setDeleteLabel("");
    toast.success("Permission deleted");
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
    setDeleteLabel("");
  };

  const handleSave = () => {
    if (!form.name || !form.action || !form.module) {
      // Basic guard – you can replace with nicer validation later
      toast.error("Please fill in Name, Action and Module.");
      return;
    }

    if (editingId === "new") {
      addPermission(form);
      toast.success("Permission added");
    } else if (editingId != null) {
      updatePermission(editingId, form);
      setSelectedId(editingId);
      toast.success("Permission updated");
    }

    setEditingId(null);
    setForm(emptyForm);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const renderEditableRow = (key) => (
    <tr key={key} className="permissions-row">
      <td>
        <input
          type="text"
          name="name"
          className="permissions-inline-input"
          placeholder="Permission name"
          value={form.name}
          onChange={handleChange}
        />
      </td>
      <td>
        <input
          type="text"
          name="action"
          className="permissions-inline-input"
          placeholder="Action (e.g. view, edit)"
          value={form.action}
          onChange={handleChange}
        />
      </td>
      <td>
        <div className="permissions-edit-wrapper">
          <input
            type="text"
            name="module"
            className="permissions-inline-input"
            placeholder="Module (e.g. farms)"
            value={form.module}
            onChange={handleChange}
          />
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
            onClick={handleCancelEdit}
            aria-label="Cancel"
          >
            ✕
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="permissions-card">
      <div className="permissions-header">
        <h3 className="permissions-title">Permissions</h3>
        <div className="permissions-actions">
          <MdAddCircle
            className="permissions-action-icon"
            size={22}
            color={editingId !== null ? "#b0bec5" : "#2e7d32"}
            onClick={editingId === null ? handleAddClick : undefined}
          />
          <MdEditNote
            className="permissions-action-icon"
            size={24}
            color={
              selectedId == null || editingId !== null ? "#b0bec5" : "#1976d2"
            }
            onClick={
              selectedId != null && editingId === null
                ? handleStartUpdate
                : undefined
            }
          />
          <MdDeleteForever
            className="permissions-action-icon"
            size={22}
            color={
              selectedId == null || editingId !== null ? "#b0bec5" : "#d32f2f"
            }
            onClick={
              selectedId != null && editingId === null
                ? handleDeleteRequest
                : undefined
            }
          />
        </div>
      </div>

      <table className="permissions-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Action</th>
            <th>Module</th>
          </tr>
        </thead>
        <tbody>
          {editingId === "new" && renderEditableRow("new")}
          {permissions.map((perm) => {
            const rowId = perm.id ?? perm._id;
            const isEditingThisRow = editingId === rowId;

            if (!rowId) {
              return null;
            }

            return isEditingThisRow ? (
              renderEditableRow(rowId)
            ) : (
              <tr
                key={rowId}
                className={`permissions-row${
                  selectedId === rowId ? " selected" : ""
                }`}
                onClick={() => handleRowSelect(rowId)}
              >
                <td>{perm.name}</td>
                <td>{perm.action}</td>
                <td>{perm.module}</td>
              </tr>
            );
          })}
          {permissions.length === 0 && editingId !== "new" && (
            <tr>
              <td colSpan="3" className="permissions-empty">
                No permissions defined.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete permission"
        description={
          deleteLabel
            ? `Are you sure you want to delete "${deleteLabel}"?`
            : "Are you sure you want to delete this permission?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default PermissionsTable;
