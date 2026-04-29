import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTrip, resetTrip } from '../store/tripSlice'
import {
  Box, Button, TextField, Typography, CircularProgress, Alert, Stack, InputAdornment
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import PlaceIcon from '@mui/icons-material/Place'
import FlagIcon from '@mui/icons-material/Flag'
import AccessTimeIcon from '@mui/icons-material/AccessTime'

const INITIAL = { current_location: '', pickup_location: '', dropoff_location: '', current_cycle_hours: '' }

export default function TripForm() {
  const dispatch = useDispatch()
  const { status, error } = useSelector((state) => state.trip)
  const [form, setForm] = useState(INITIAL)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    dispatch(fetchTrip({ ...form, current_cycle_hours: parseFloat(form.current_cycle_hours) }))
  }

  const handleReset = () => {
    setForm(INITIAL)
    dispatch(resetTrip())
  }

  const isLoading = status === 'loading'
  const isDone = status === 'success'

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <LocalShippingIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={700}>Trip Details</Typography>
        </Stack>

        <TextField
          label="Current Location"
          name="current_location"
          value={form.current_location}
          onChange={handleChange}
          required
          fullWidth
          placeholder="e.g. Chicago, IL"
          InputProps={{ startAdornment: <InputAdornment position="start"><MyLocationIcon fontSize="small" color="action" /></InputAdornment> }}
        />

        <TextField
          label="Pickup Location"
          name="pickup_location"
          value={form.pickup_location}
          onChange={handleChange}
          required
          fullWidth
          placeholder="e.g. Dallas, TX"
          InputProps={{ startAdornment: <InputAdornment position="start"><PlaceIcon fontSize="small" color="action" /></InputAdornment> }}
        />

        <TextField
          label="Dropoff Location"
          name="dropoff_location"
          value={form.dropoff_location}
          onChange={handleChange}
          required
          fullWidth
          placeholder="e.g. Miami, FL"
          InputProps={{ startAdornment: <InputAdornment position="start"><FlagIcon fontSize="small" color="action" /></InputAdornment> }}
        />

        <TextField
          label="Current Cycle Used (hrs)"
          name="current_cycle_hours"
          value={form.current_cycle_hours}
          onChange={handleChange}
          required
          fullWidth
          type="number"
          inputProps={{ min: 0, max: 70, step: 0.5 }}
          placeholder="e.g. 20"
          InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" color="action" /></InputAdornment> }}
        />

        {error && <Alert severity="error">{error}</Alert>}

        <Stack direction="row" spacing={2}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading}
            size="large"
            startIcon={isLoading ? <CircularProgress size={18} color="inherit" /> : <LocalShippingIcon />}
          >
            {isLoading ? 'Calculating...' : 'Generate Trip Log'}
          </Button>

          {isDone && (
            <Button variant="outlined" fullWidth size="large" onClick={handleReset}>
              New Trip
            </Button>
          )}
        </Stack>
      </Stack>
    </Box>
  )
}
