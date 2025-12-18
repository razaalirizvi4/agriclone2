import { useState, useMemo, useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { initialUsers } from "../../data/users";
import { fetchPermissions } from "../../features/permissions/permissions.slice";

const useUserManageModel = () => {
  const dispatch = useDispatch();
  const { items: rolePermissions = [] } = useSelector(
    (state) => state.permissions || {}
  );

  const [users, setUsers] = useState(initialUsers);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [editingId, setEditingId] = useState(null); // null | "new" | string
  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "",
    contact: "",
  });

  const activeUsers = useMemo(() => users.filter((u) => !u.isRemoved), [users]);

  const selectedUser = useMemo(
    () => activeUsers.find((u) => u._id === selectedUserId) || null,
    [activeUsers, selectedUserId]
  );

  useEffect(() => {
    if (selectedUser && selectedUser.role) {
      dispatch(fetchPermissions({ role: selectedUser.role }));
    }
  }, [dispatch, selectedUser]);

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
      setForm({
        name: user.name,
        email: user.email,
        role: user.role,
        contact: user.contact,
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

  const saveUser = useCallback(() => {
    if (!form.name || !form.email || !form.role) {
      return false;
    }

    if (editingId === "new") {
      const now = new Date().toISOString();
      const newUser = {
        _id: `u-${Date.now()}`,
        name: form.name,
        email: form.email,
        hashPassword: "********",
        role: form.role,
        contact: form.contact,
        isRemoved: false,
        createdAt: now,
        updatedAt: now,
      };
      setUsers((prev) => [...prev, newUser]);
      setSelectedUserId(newUser._id);
    } else if (editingId != null) {
      setUsers((prev) =>
        prev.map((u) =>
          u._id === editingId
            ? {
                ...u,
                name: form.name,
                email: form.email,
                role: form.role,
                contact: form.contact,
                updatedAt: new Date().toISOString(),
              }
            : u
        )
      );
      setSelectedUserId(editingId);
    }

    setEditingId(null);
    setForm({
      name: "",
      email: "",
      role: "",
      contact: "",
    });

    return true;
  }, [editingId, form]);

  const softDeleteSelected = useCallback(() => {
    if (!selectedUserId) return;
    setUsers((prev) =>
      prev.map((u) =>
        u._id === selectedUserId ? { ...u, isRemoved: true } : u
      )
    );
    setSelectedUserId(null);
    setEditingId(null);
  }, [selectedUserId]);

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

  return {
    users: activeUsers,
    form,
    editingId,
    selectedUserId,
    selectedUser,
    rolePermissions,
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
