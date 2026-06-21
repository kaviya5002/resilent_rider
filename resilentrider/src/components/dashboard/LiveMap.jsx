import { useEffect, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import markerIcon   from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import './LiveMap.css';

// Fix Leaflet's broken default icon paths when bundled with Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl:       markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl:     markerShadow,
});

// Custom accent-coloured marker matching --accent: #E0B88F
const riderIcon = L.divIcon({
  className: '',
  html: `
    <div class="lm-marker-outer">
      <div class="lm-marker-inner"></div>
    </div>`,
  iconSize:   [28, 28],
  iconAnchor: [14, 14],
});

const POLL_MS   = 5000;
const TILE_URL  = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Inner component: smoothly pans map + moves marker when position changes
function LiveMarker({ position }) {
  const map       = useMap();
  const markerRef = useRef(null);

  useEffect(() => {
    if (!position) return;
    map.panTo(position, { animate: true, duration: 0.8 });
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
    }
  }, [position, map]);

  if (!position) return null;

  return (
    <Marker
      position={position}
      icon={riderIcon}
      ref={markerRef}
    />
  );
}

function LiveMap() {
  const { user }   = useAuth();
  const pollRef    = useRef(null);

  const [position, setPosition] = useState(null);
  const [lastSeen, setLastSeen] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchLocation = useCallback(async () => {
    if (!user?._id) return;
    try {
      const { data } = await api.get(`/location/latest/${user._id}`);
      if (data.success && data.data) {
        const { latitude, longitude, timestamp } = data.data;
        setPosition([latitude, longitude]);
        setLastSeen(new Date(timestamp).toLocaleTimeString());
        setError(null);
      }
    } catch {
      setError('Unable to fetch location data.');
    } finally {
      setLoading(false);
    }
  }, [user?._id]);

  // Use browser geolocation as instant fallback while backend fetch loads
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setPosition(prev => prev ?? [coords.latitude, coords.longitude]);
        setLoading(false);
      },
      () => {}, // silent — backend fetch is the source of truth
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  useEffect(() => {
    fetchLocation();
    pollRef.current = setInterval(fetchLocation, POLL_MS);
    return () => clearInterval(pollRef.current);
  }, [fetchLocation]);

  return (
    <div className="live-map-card">

      {/* ── Header ── */}
      <div className="live-map__header">
        <h2 className="section-title">📍 Live Location</h2>
        <div className="live-map__meta">
          <span className={`live-map__dot ${position ? 'active' : 'inactive'}`} />
          <span className="live-map__status">
            {loading ? 'Locating…' : position ? 'Tracking active' : 'No data yet'}
          </span>
          {lastSeen && <span className="live-map__time">· {lastSeen}</span>}
        </div>
      </div>

      {/* ── Body ── */}
      <div className="live-map__body">

        {loading && (
          <div className="live-map__placeholder">
            <div className="live-map__spinner" />
            <span>Fetching your location…</span>
          </div>
        )}

        {!loading && error && (
          <div className="live-map__placeholder live-map__placeholder--error">
            ⚠ {error}
          </div>
        )}

        {!loading && !error && !position && (
          <div className="live-map__placeholder">
            No location history found. Start a ride to see your position.
          </div>
        )}

        {!loading && position && (
          <div className="live-map__map-wrap">
            <MapContainer
              center={position}
              zoom={15}
              scrollWheelZoom={false}
              zoomControl={true}
              style={{ width: '100%', height: '320px' }}
              className="live-map__leaflet"
            >
              <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
              <LiveMarker position={position} />
            </MapContainer>
          </div>
        )}
      </div>

      {/* ── Coords footer ── */}
      {position && (
        <div className="live-map__coords">
          <span>Lat: {position[0].toFixed(5)}</span>
          <span>Lng: {position[1].toFixed(5)}</span>
        </div>
      )}

    </div>
  );
}

export default LiveMap;
