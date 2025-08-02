import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../../environments/environment';
import { GeoJSONLoader } from '../../../utils/parsers/GeoJson.parser';
import { RouteSimulation, RoutePoint } from './simulation';

export async function initMap(container: HTMLElement) {
  const loader = new Loader({
    apiKey: environment.googleMapsApiKey,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  await loader.importLibrary('maps');

  const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;

  // Load route from GeoJSON file
  const geoJsonLoader = new GeoJSONLoader();
  let routePoints: RoutePoint[] = [];
  let mapCenter = { lat: -25.854361, lng: 28.192019 }; // Default center
  
  try {
    const geoJson = await geoJsonLoader.loadFromUrl('/assets/map/momentum_parameter_walk.geojson');
    const lineStringCoords = geoJsonLoader.getFirstLineStringCoordinates();
    
    // Convert GeoJSON coordinates to RoutePoints with timestamps
    routePoints = lineStringCoords.map((coord, index) => ({
      lat: coord.lat,
      lng: coord.lon,
      timestamp: index * 1000, // 1 second intervals
      speed: 30 + (index * 5) // Gradually increasing speed
    }));
    
    // Set map center to first point of the route
    if (routePoints.length > 0) {
      mapCenter = { lat: routePoints[0].lat, lng: routePoints[0].lng };
    }
    
    console.log('Loaded route from GeoJSON:', routePoints.length, 'points');
  } catch (error) {
    console.error('Failed to load GeoJSON route, using fallback:', error);
    // Fallback route points (around Pretoria)
    routePoints = [
      { lat: -25.854361, lng: 28.192019, timestamp: 0, speed: 30 },
      { lat: -25.854500, lng: 28.192200, timestamp: 1000, speed: 35 },
      { lat: -25.854800, lng: 28.192500, timestamp: 2000, speed: 40 },
      { lat: -25.855100, lng: 28.192800, timestamp: 3000, speed: 45 },
      { lat: -25.855400, lng: 28.193100, timestamp: 4000, speed: 50 },
      { lat: -25.855700, lng: 28.193400, timestamp: 5000, speed: 55 },
      { lat: -25.856000, lng: 28.193700, timestamp: 6000, speed: 60 },
      { lat: -25.856300, lng: 28.194000, timestamp: 7000, speed: 65 },
      { lat: -25.856600, lng: 28.194300, timestamp: 8000, speed: 70 },
      { lat: -25.856900, lng: 28.194600, timestamp: 9000, speed: 75 }
    ];
  }

  const map = new Map(container, {
    center: mapCenter,
    zoom: 18,
    mapTypeControl: false,
    mapTypeId: 'roadmap',
  });

  // Initialize route simulation
  const simulation = new RouteSimulation(map, container, routePoints);
  simulation.initialize();

  // Add live center printing (For debugging purposes)
  let centerDisplay = document.createElement('div');
  centerDisplay.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 1000;
    pointer-events: none;
  `;
  container.appendChild(centerDisplay);

  // Function to update center display
  function updateCenterDisplay() {
    const center = map.getCenter();
    if (center) {
      centerDisplay.textContent = `Center: ${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}`;
    }
  }

  // Update on map events
  map.addListener('center_changed', updateCenterDisplay);
  map.addListener('zoom_changed', updateCenterDisplay);
  map.addListener('bounds_changed', updateCenterDisplay);
  
  // Initial display
  updateCenterDisplay();

  // Also log to console for debugging
  map.addListener('center_changed', () => {
    const center = map.getCenter();
    if (center) {
      console.log('Map Center:', center.lat().toFixed(6), center.lng().toFixed(6));
    }
  });

  return map;
}