import { Box, Typography, Divider, Chip, Stack } from '@mui/material'

const HOURS = Array.from({ length: 24 }, (_, i) => i)
const STATUS_COLORS = {
  off_duty: '#e3f2fd',
  driving: '#c8e6c9',
  on_duty: '#fff9c4',
}
const STATUS_LABELS = {
  off_duty: 'Off Duty',
  driving: 'Driving',
  on_duty: 'On Duty (Not Driving)',
}
const ROW_ORDER = ['off_duty', 'driving', 'on_duty']
const GRID_WIDTH = 720   // px — represents 24 hours
const ROW_HEIGHT = 28
const HOUR_WIDTH = GRID_WIDTH / 24

function toX(hour) { return (hour / 24) * GRID_WIDTH }
function toWidth(start, end) { return ((end - start) / 24) * GRID_WIDTH }

function GridRow({ status, entries }) {
  const filtered = entries.filter((e) => e.status === status)
  return (
    <Box sx={{ position: 'relative', height: ROW_HEIGHT, borderBottom: '1px solid #bbb', bgcolor: '#fafafa' }}>
      {filtered.map((entry, i) => (
        <Box
          key={i}
          sx={{
            position: 'absolute',
            left: toX(entry.start),
            width: toWidth(entry.start, entry.end),
            height: '100%',
            bgcolor: STATUS_COLORS[status],
            borderRight: '1px solid #aaa',
            boxSizing: 'border-box',
          }}
        />
      ))}
      {/* Hour tick marks */}
      {HOURS.map((h) => (
        <Box key={h} sx={{ position: 'absolute', left: h * HOUR_WIDTH, height: '100%', borderLeft: '1px solid #ddd' }} />
      ))}
    </Box>
  )
}

function RemarksList({ entries }) {
  const remarks = entries.filter((e) => e.location)
  if (!remarks.length) return null
  return (
    <Box mt={1}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>REMARKS</Typography>
      <Stack spacing={0.25} mt={0.5}>
        {remarks.map((e, i) => (
          <Typography key={i} variant="caption" color="text.secondary">
            {e.start.toFixed(2).replace('.', ':')}h — {STATUS_LABELS[e.status]}: {e.location}
          </Typography>
        ))}
      </Stack>
    </Box>
  )
}

function DailyLog({ log }) {
  const totalOnDuty = log.entries
    .filter((e) => e.status !== 'off_duty')
    .reduce((sum, e) => sum + (e.end - e.start), 0)

  return (
    <Box sx={{ border: '1px solid #ccc', borderRadius: 2, p: 2, mb: 3, bgcolor: '#fff' }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>
            Day {log.day} — {log.date}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            U.S. Department of Transportation — Driver's Daily Log (24 hours)
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip size="small" label={`Driving: ${log.total_driving_hours}h`} color="success" variant="outlined" />
          <Chip size="small" label={`On Duty: ${totalOnDuty.toFixed(2)}h`} color="warning" variant="outlined" />
          <Chip size="small" label={`Cycle Used: ${log.cycle_hours_used}h`} color="primary" variant="outlined" />
        </Stack>
      </Stack>

      {/* Hour labels */}
      <Box sx={{ position: 'relative', width: GRID_WIDTH, ml: '90px', mb: 0.5, height: 14 }}>
        {[0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24].map((h) => (
          <Typography
            key={h}
            variant="caption"
            sx={{ position: 'absolute', left: (h / 24) * GRID_WIDTH - 4, fontSize: 9, color: '#666' }}
          >
            {h === 0 ? 'Mid' : h === 12 ? 'Noon' : h === 24 ? 'Mid' : h}
          </Typography>
        ))}
      </Box>

      {/* Grid rows */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        {/* Row labels */}
        <Box sx={{ width: 90, flexShrink: 0 }}>
          {ROW_ORDER.map((status) => (
            <Box key={status} sx={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center', borderBottom: '1px solid #bbb' }}>
              <Typography variant="caption" fontSize={9} lineHeight={1.2} color="text.secondary">
                {STATUS_LABELS[status]}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Grid */}
        <Box sx={{ width: GRID_WIDTH, border: '1px solid #bbb', borderBottom: 'none' }}>
          {ROW_ORDER.map((status) => (
            <GridRow key={status} status={status} entries={log.entries} />
          ))}
        </Box>

        {/* Total hours column */}
        <Box sx={{ width: 40, flexShrink: 0, ml: 1 }}>
          {ROW_ORDER.map((status) => {
            const total = log.entries
              .filter((e) => e.status === status)
              .reduce((sum, e) => sum + (e.end - e.start), 0)
            return (
              <Box key={status} sx={{ height: ROW_HEIGHT, display: 'flex', alignItems: 'center' }}>
                <Typography variant="caption" fontWeight={600} fontSize={9}>
                  {total.toFixed(2)}
                </Typography>
              </Box>
            )
          })}
        </Box>
      </Box>

      <Divider sx={{ my: 1.5 }} />
      <RemarksList entries={log.entries} />
    </Box>
  )
}

export default function LogSheet({ logsData }) {
  return (
    <Box>
      <Typography variant="h6" fontWeight={700} mb={2}>
        ELD Daily Log Sheets — {logsData.total_days} day{logsData.total_days > 1 ? 's' : ''}
      </Typography>
      {logsData.logs.map((log) => (
        <DailyLog key={log.day} log={log} />
      ))}
    </Box>
  )
}
