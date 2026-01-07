import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPermissions,
  createPermission as createPermissionThunk,
  updatePermission as updatePermissionThunk,
  deletePermission as deletePermissionThunk,
} from "../slices/permissions.slice";

const usePermissionTableModel = () => {
  const dispatch = useDispatch();
  const {
    items: permissions = [],
    loading,
    error,
  } = useSelector((state) => state.permissions || {});

  useEffect(() => {
    dispatch(fetchPermissions());
  }, [dispatch]);

  const addPermission = useCallback(
    (permission) => {
      dispatch(createPermissionThunk(permission));
    },
    [dispatch]
  );

  const updatePermission = useCallback(
    (id, updates) => {
      dispatch(updatePermissionThunk({ id, data: updates }));
    },
    [dispatch]
  );

  const deletePermission = useCallback(
    (id) => {
      dispatch(deletePermissionThunk(id));
    },
    [dispatch]
  );

  return {
    permissions,
    loading,
    error,
    addPermission,
    updatePermission,
    deletePermission,
  };
};

export default usePermissionTableModel;
