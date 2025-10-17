import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import eventStreamService from "../../services/eventStream.service";

export const getEvents = createAsyncThunk(
  "eventStream/getEvents",
  async (params, {  rejectWithValue }) => {
    try {
      const response = await eventStreamService.getEvents(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateEventStatus = createAsyncThunk(
  "eventStream/updateEventStatus",
  async ({ eventId, data }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const response = await eventStreamService.updateEventStatus(
        eventId,
        data,
        auth.user.token
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const eventStreamSlice = createSlice({
  name: "eventStream",
  initialState: {
    events: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(getEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateEventStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateEventStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.events.findIndex(
          (event) => event._id === action.payload._id
        );
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(updateEventStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default eventStreamSlice.reducer;
