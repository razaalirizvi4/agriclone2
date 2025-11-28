import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import typeService from "../../services/type.service";

// Async Thunks for API interactions

export const getTypes = createAsyncThunk(
  "type/getTypes",
  async (params, { rejectWithValue }) => {
    try {
      const response = await typeService.getTypes(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createType = createAsyncThunk(
  "type/createType",
  async (typeData, { rejectWithValue }) => {
    try {
      const response = await typeService.createType(typeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateType = createAsyncThunk(
  "type/updateType",
  async ({ typeId, typeData }, { rejectWithValue }) => {
    try {
      const response = await typeService.updateType(typeId, typeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteType = createAsyncThunk(
  "type/deleteType",
  async (typeId, { rejectWithValue }) => {
    try {
      await typeService.deleteType(typeId);
      return typeId; // Return the ID of the deleted type for state update
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const typeSlice = createSlice({
  name: "type",
  initialState: {
    types: [],
    loading: false,
    error: null,
  },
  reducers: {
    // Synchronous reducers if needed
  },
  extraReducers: (builder) => {
    builder
      // getTypes
      .addCase(getTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.types = action.payload;
      })
      .addCase(getTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createType
      .addCase(createType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createType.fulfilled, (state, action) => {
        state.loading = false;
        state.types.push(action.payload);
      })
      .addCase(createType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // updateType
      .addCase(updateType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateType.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.types.findIndex((type) => type._id === action.payload._id);
        if (index !== -1) {
          state.types[index] = action.payload;
        }
      })
      .addCase(updateType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteType
      .addCase(deleteType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteType.fulfilled, (state, action) => {
        state.loading = false;
        state.types = state.types.filter((type) => type._id !== action.payload);
      })
      .addCase(deleteType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default typeSlice.reducer;
