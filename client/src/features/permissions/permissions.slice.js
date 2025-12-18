import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import permissionsService from "../../services/permissions.service";

export const fetchPermissions = createAsyncThunk(
  "permissions/fetchPermissions",
  async (params, { rejectWithValue }) => {
    try {
      const response = await permissionsService.getPermissions(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const createPermission = createAsyncThunk(
  "permissions/createPermission",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await permissionsService.createPermission(payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const updatePermission = createAsyncThunk(
  "permissions/updatePermission",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await permissionsService.updatePermission(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deletePermission = createAsyncThunk(
  "permissions/deletePermission",
  async (id, { rejectWithValue }) => {
    try {
      await permissionsService.deletePermission(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const permissionsSlice = createSlice({
  name: "permissions",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // fetchPermissions
      .addCase(fetchPermissions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createPermission
      .addCase(createPermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createPermission.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updatePermission
      .addCase(updatePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePermission.fulfilled, (state, action) => {
        state.loading = false;
        const updated = action.payload;
        const updatedId = updated?.id ?? updated?._id;
        if (!updatedId) return;

        const index = state.items.findIndex((p) => {
          const itemId = p.id ?? p._id;
          return itemId === updatedId;
        });

        if (index !== -1) {
          state.items[index] = updated;
        }
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deletePermission
      .addCase(deletePermission.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.loading = false;
        const id = action.payload;
        state.items = state.items.filter(
          (p) => p.id !== id && p._id !== id
        );
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default permissionsSlice.reducer;


