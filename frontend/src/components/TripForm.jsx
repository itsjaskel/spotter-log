import { useState, useEffect } from 'react'
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

function newCaptcha() {
  const a = Math.floor(Math.random() * 10) + 1
  const b = Math.floor(Math.random() * 10) + 1
  return { a, b, answer: String(a + b) }
}

export default function TripForm() {
  const dispatch = useDispatch()
  const { status, error } = useSelector((state) => state.trip)
  const [form, setForm] = useState(INITIAL)
  const [submitted, setSubmitted] = useState(false)
  const [captcha, setCaptcha] = useState(newCaptcha)
  const [captchaInput, setCaptchaInput] = useState('')

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const captchaCorrect = captchaInput.trim() === captcha.answer

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
    const cycleVal = parseFloat(form.current_cycle_hours)
    const isValid = form.current_location.trim() &&
                    form.pickup_location.trim() &&
                    form.dropoff_location.trim() &&
                    form.current_cycle_hours !== '' &&
                    cycleVal >= 0 && cycleVal <= 70
    if (!isValid || !captchaCorrect) {
      if (!captchaCorrect) setCaptcha(newCaptcha())
      setCaptchaInput('')
      return
    }
    dispatch(fetchTrip({ ...form, current_cycle_hours: parseFloat(form.current_cycle_hours) }))
  }

  const handleReset = () => {
    setForm(INITIAL)
    setSubmitted(false)
    setCaptcha(newCaptcha())
    setCaptchaInput('')
    dispatch(resetTrip())
  }

  useEffect(() => {
    if (status === 'success') {
      setCaptcha(newCaptcha())
      setCaptchaInput('')
    }
  }, [status])

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
          error={submitted && !form.current_location.trim()}
          helperText={submitted && !form.current_location.trim() ? 'This field is required' : ''}
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
          error={submitted && !form.pickup_location.trim()}
          helperText={submitted && !form.pickup_location.trim() ? 'This field is required' : ''}
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
          error={submitted && !form.dropoff_location.trim()}
          helperText={submitted && !form.dropoff_location.trim() ? 'This field is required' : ''}
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
          error={submitted && (form.current_cycle_hours === '' || parseFloat(form.current_cycle_hours) < 0 || parseFloat(form.current_cycle_hours) > 70)}
          helperText={submitted && form.current_cycle_hours === '' ? 'This field is required' : submitted && (parseFloat(form.current_cycle_hours) < 0 || parseFloat(form.current_cycle_hours) > 70) ? 'Must be between 0 and 70' : ''}
          InputProps={{ startAdornment: <InputAdornment position="start"><AccessTimeIcon fontSize="small" color="action" /></InputAdornment> }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
            What is {captcha.a} + {captcha.b}?
          </Typography>
          <TextField
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            size="small"
            type="number"
            inputProps={{ min: 0 }}
            sx={{ width: 80 }}
            error={submitted && !captchaCorrect}
            helperText={submitted && !captchaCorrect ? 'Incorrect answer' : ''}
          />
        </Box>

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
