import { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../slices/users.slice";
import { fetchRoles } from "../../roles/roles.slice";

const useUserManageModel = () => {
  const dispatch = useDispatch();
  
  // Selectors
  const { items: users = [] } = useSelector(
    (state) => state.users || {}
  );
  const { items: roles = [] } = useSelector(
    (state) => state.roles || {}
  );

  // Local state for UI interactions
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingId, setEditingId] = useState(null); // null | "new" | string
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    contact: "",
  });

  // Fetch users and roles on mount
  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchRoles());
  }, [dispatch]);

  const activeUsers = useMemo(() => users.filter((u) => !u.isRemoved), [users]);

  const selectedUser = useMemo(
    () => activeUsers.find((u) => u._id === selectedUserId) || null,
    [activeUsers, selectedUserId]
  );


  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }, []);

  const startAdd = useCallback(() => {
    setEditingId("new");
    setForm({
      name: "",
      email: "",
      role: "",
      contact: "",
    });
    setSelectedUserId(null);
  }, []);

  const startEdit = useCallback(
    (id) => {
      const user = activeUsers.find((u) => u._id === id);
      if (!user) return;
      setEditingId(id);
      
      // Handle populated roleId
      const roleName = user.roleId?.roleId || user.roleId || ""; // Using roleId (e.g., 'admin') for editing as we send roleId to backend
      
      setForm({
        name: user.name,
        email: user.email,
        role: roleName,
        contact: user.contact || "",
      });
    },
    [activeUsers]
  );

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setForm({
      name: "",
      email: "",
      role: "",
      contact: "",
    });
  }, []);

  const saveUser = useCallback(async () => {
    if (!form.name || !form.email || !form.role) {
      return false;
    }

    try {
      if (editingId === "new") {
        const newUserPayload = {
          name: form.name,
          email: form.email,
          roleId: form.role.toLowerCase(), // Ensure lowercase match for backend ID
          contact: form.contact,
          password: "password123", // Default temp password
        };
        await dispatch(createUser(newUserPayload)).unwrap();
      } else if (editingId != null) {
        const updatePayload = {
          name: form.name,
          email: form.email,
          roleId: form.role.toLowerCase(),
          contact: form.contact,
        };
        await dispatch(updateUser({ id: editingId, data: updatePayload })).unwrap();
      }
      
      setEditingId(null);
      setForm({
        name: "",
        email: "",
        role: "",
        contact: "",
      });
      return true;
    } catch (err) {
      console.error("Failed to save user:", err);
      // Ideally show toast error here or let component handle it via returned false
      return false; // Indicating failure
    }
  }, [dispatch, editingId, form]);

  const softDeleteSelected = useCallback(async () => {
    if (!selectedUserId) return;
    try {
        await dispatch(deleteUser(selectedUserId)).unwrap();
        setSelectedUserId(null);
        setEditingId(null);
    } catch (err) {
        console.error("Failed to delete user:", err);
    }
  }, [dispatch, selectedUserId]);

  const selectUser = useCallback(
    (id) => {
      if (editingId === "new") return;
      if (editingId !== null) {
        cancelEdit();
      }
      setSelectedUserId(id);
    },
    [editingId, cancelEdit]
  );

  // Transform users for display if needed
  // The View component expects user.role to be a string.
  // Backend returns roleId as object { role: "Admin", roleId: "admin" ... }
  const displayUsers = useMemo(() => {
     return users.map(u => ({
         ...u,
         role: u.roleId?.role || u.roleId || "Unknown" // Display friendly name if available
     }));
  }, [users]);

  return {
    users: displayUsers,
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
  };
};

export default useUserManageModel;
