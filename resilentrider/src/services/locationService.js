import api from '../api/axios';

const SEND_INTERVAL_MS = 5000;

let watchId = null;
let sendTimer = null;
let lastPosition = null;

const ERROR_MESSAGES = {
  [GeolocationPositionError.PERMISSION_DENIED]: 'Location permission denied.',
  [GeolocationPositionError.POSITION_UNAVAILABLE]: 'Position unavailable.',
  [GeolocationPositionError.TIMEOUT]: 'Location request timed out.',
};

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

function onPositionUpdate(position) {
  lastPosition = {
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    speed: position.coords.speed ?? 0,
  };
}

function onPositionError(error) {
  const message = ERROR_MESSAGES[error.code] ?? 'Unknown location error.';
  console.error(`[locationService] ${message}`);
}

async function sendLocation() {
  if (!lastPosition) return;
  try {
    await api.post('/location/update', lastPosition);
  } catch (error) {
    console.error('[locationService] Failed to send location:', error.message);
  }
}

export function startTracking() {
  if (!navigator.geolocation) {
    console.error('[locationService] Geolocation is not supported by this browser.');
    return;
  }

  if (watchId !== null) return; // already tracking

  watchId = navigator.geolocation.watchPosition(
    onPositionUpdate,
    onPositionError,
    GEO_OPTIONS
  );

  sendTimer = setInterval(sendLocation, SEND_INTERVAL_MS);
}

export function stopTracking() {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }

  if (sendTimer !== null) {
    clearInterval(sendTimer);
    sendTimer = null;
  }

  lastPosition = null;
}
