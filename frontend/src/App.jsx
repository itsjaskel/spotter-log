import { useSelector } from 'react-redux'
import {
  Box, Container, Typography, Paper, Grid, Divider, Stack, Chip
} from '@mui/material'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import TripForm from './components/TripForm'
import RouteMap from './components/RouteMap'
import LogSheet from './components/LogSheet'

function TripSummary({ data }) {
  const { route_data, logs_data, current_location, pickup_location, dropoff_location, current_cycle_hours } = data
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap mb={2}>
      <Chip label={`From: ${current_location}`} size="small" />
      <Chip label={`Pickup: ${pickup_location}`} size="small" color="success" />
      <Chip label={`Dropoff: ${dropoff_location}`} size="small" color="error" />
      <Chip label={`${route_data.total_miles.toLocaleString()} mi total`} size="small" color="primary" variant="outlined" />
      <Chip label={`${logs_data.total_days} days`} size="small" color="primary" variant="outlined" />
      <Chip label={`Cycle started at ${current_cycle_hours}h`} size="small" variant="outlined" />
    </Stack>
  )
}

export default function App() {
  const { status, data } = useSelector((state) => state.trip)
  const hasResult = status === 'success' && data

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'primary.main', color: 'white', py: 2, px: 3, boxShadow: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <LocalShippingIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={800} letterSpacing={-0.5}>SpotterLog</Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              ELD Log Generator — FMCSA HOS Compliant
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Grid container spacing={3}>
          {/* Left panel — form */}
          <Grid size={{ xs: 12, md: hasResult ? 3 : 5 }} sx={{ mx: hasResult ? 0 : 'auto' }}>
            <Paper elevation={2} sx={{ p: 3, borderRadius: 3, position: 'sticky', top: 24 }}>
              <TripForm />
            </Paper>
          </Grid>

          {/* Right panel — results */}
          {hasResult && (
            <Grid size={{ xs: 12, md: 9 }}>
              <TripSummary data={data} />

              <Paper elevation={2} sx={{ p: 2, borderRadius: 3, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5}>Route Map</Typography>
                <RouteMap routeData={data.route_data} logsData={data.logs_data} />
              </Paper>

              <Divider sx={{ my: 3 }} />

              <LogSheet logsData={data.logs_data} />
            </Grid>
          )}
        </Grid>
      </Container>
    </Box>
  )
}
