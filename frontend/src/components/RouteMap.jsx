import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons broken by Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const makeIcon = (color) =>
  new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  })

const COLORS = { current: 'blue', pickup: 'green', dropoff: 'red' }

export default function RouteMap({ routeData, logsData }) {
  const { waypoints, geometry, segments } = routeData
  const center = geometry[Math.floor(geometry.length / 2)]

  const labels = ['Current Location', 'Pickup', 'Dropoff']
  const markerColors = [COLORS.current, COLORS.pickup, COLORS.dropoff]

  return (
    <MapContainer center={center} zoom={5} style={{ height: '420px', width: '100%', borderRadius: 8 }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Polyline positions={geometry} color="#1976d2" weight={4} opacity={0.8} />

      {waypoints.map((wp, i) => (
        <Marker key={i} position={[wp.lat, wp.lon]} icon={makeIcon(markerColors[i])}>
          <Popup>
            <strong>{labels[i]}</strong><br />
            {wp.name}
            {i < segments.length && (
              <>
                <br /><br />
                <strong>Next segment:</strong><br />
                {segments[i].distance_miles.toLocaleString()} mi &nbsp;|&nbsp;
                {segments[i].duration_hours.toFixed(1)} hrs
              </>
            )}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
