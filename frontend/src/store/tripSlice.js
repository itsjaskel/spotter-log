import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { submitTrip } from '../api'

// Async thunk: calls the backend and returns the trip data
export const fetchTrip = createAsyncThunk('trip/fetch', async (formData, { rejectWithValue }) => {
  try {
    const response = await submitTrip(formData)
    return response.data
  } catch (err) {
    return rejectWithValue(err.response?.data?.error || 'Something went wrong')
  }
})

const tripSlice = createSlice({
  name: 'trip',
  initialState: {
    status: 'idle',   // 'idle' | 'loading' | 'success' | 'error'
    data: null,
    error: null,
  },
  reducers: {
    resetTrip: (state) => {
      state.status = 'idle'
      state.data = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrip.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(fetchTrip.fulfilled, (state, action) => {
        state.status = 'success'
        state.data = action.payload
      })
      .addCase(fetchTrip.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.payload
      })
  },
})

export const { resetTrip } = tripSlice.actions
export default tripSlice.reducer
