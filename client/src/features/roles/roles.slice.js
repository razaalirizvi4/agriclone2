import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import rolesService from "../../services/roles.service";

export const fetchRoles = createAsyncThunk(
  "roles/fetchRoles",
  async (params, { rejectWithValue }) => {
    try {
      const response = await rolesService.getRoles(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const rolesSlice = createSlice({
  name: "roles",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default rolesSlice.reducer;