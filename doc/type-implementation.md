# Type Module Implementation Plan

This document outlines the proposed implementation for the `type` Redux slice and service, following the established patterns seen in other modules like `eventStream`, `crop`, and `location`.

## `client/src/services/type.service.js`

This file will handle API calls related to types.

```javascript
import axios from "axios";

const API_URL = "http://localhost:5000/api/types"; // Assuming a /api/types endpoint

// Helper to attach token for authenticated requests
const getAuthHeader = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user && user.token) {
    return { Authorization: `Bearer ${user.token}` };
  }
  return {};
};

// Get all types
const getTypes = (params = {}) => {
  return axios.get(API_URL, {
    params,
    headers: getAuthHeader(),
  });
};

// Create a new type
const createType = (typeData) => {
  return axios.post(API_URL, typeData, {
    headers: getAuthHeader(),
  });
};

// Update an existing type
const updateType = (typeId, typeData) => {
  return axios.put(`${API_URL}/${typeId}`, typeData, {
    headers: getAuthHeader(),
  });
};

// Delete a type
const deleteType = (typeId) => {
  return axios.delete(`${API_URL}/${typeId}`, {
    headers: getAuthHeader(),
  });
};

const typeService = {
  getTypes,
  createType,
  updateType,
  deleteType,
};

export default typeService;
```

## `client/src/features/type/type.slice.js`

This file will define the Redux slice for managing type-related state.

```javascript
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
```
