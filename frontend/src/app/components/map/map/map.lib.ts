import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../../environments/environment';
import { GeoJSONLoader } from '../../../utils/parsers/GeoJson.parser';
import { create_circle_fence, is_point_inside_circle } from '../../../utils/geometry/geometry';

// Route simulation types
interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
}

interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  circle?: google.maps.Circle;
  polygon?: google.maps.Polygon;
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

interface SimulationState {
  isRunning: boolean;
  currentIndex: number;
  startTime: number;
  vehicleMarker?: google.maps.Marker;
  routePolyline?: google.maps.Polyline;
  speedMultiplier: number;
  geofences: Geofence[];
  activeGeofences: Set<string>;
  geofenceHistory: Array<{
    geofenceId: string;
    action: 'enter' | 'exit';
    timestamp: number;
    position: { lat: number; lng: number };
  }>;
}

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

  // Simulation state
  const simulationState: SimulationState = {
    isRunning: false,
    currentIndex: 0,
    startTime: 0,
    speedMultiplier: 1,
    geofences: [],
    activeGeofences: new Set(),
    geofenceHistory: []
  };

  // Create route polyline
  const routePath = routePoints.map(point => ({ lat: point.lat, lng: point.lng }));
  simulationState.routePolyline = new google.maps.Polyline({
    path: routePath,
    geodesic: true,
    strokeColor: '#FF0000',
    strokeOpacity: 1.0,
    strokeWeight: 3,
    map: map
  });

  // Create geofences along the route
  function createGeofences() {
    const geofenceColors = {
      low: { fill: '#4CAF50', stroke: '#2E7D32' },
      medium: { fill: '#FF9800', stroke: '#E65100' },
      high: { fill: '#F44336', stroke: '#B71C1C' }
    };

    // Create geofences at key points along the route
    const geofencePoints = [
      { 
        point: routePoints[0], 
        name: 'Start Point', 
        riskLevel: 'low' as const,
        description: 'Route starting point'
      },
      { 
        point: routePoints[Math.floor(routePoints.length * 0.25)], 
        name: 'Quarter Point', 
        riskLevel: 'medium' as const,
        description: '25% of route completed'
      },
      { 
        point: routePoints[Math.floor(routePoints.length * 0.5)], 
        name: 'Mid Point', 
        riskLevel: 'high' as const,
        description: 'High risk area - construction zone'
      },
      { 
        point: routePoints[Math.floor(routePoints.length * 0.75)], 
        name: 'Three Quarter Point', 
        riskLevel: 'medium' as const,
        description: '75% of route completed'
      },
      { 
        point: routePoints[routePoints.length - 1], 
        name: 'End Point', 
        riskLevel: 'low' as const,
        description: 'Route destination'
      }
    ];

    geofencePoints.forEach((geofenceData, index) => {
      const colors = geofenceColors[geofenceData.riskLevel];
      const circle = create_circle_fence(
        100, // 100 meter radius
        { lat: geofenceData.point.lat, lon: geofenceData.point.lng },
        colors.fill,
        colors.stroke,
        map
      );

      const geofence: Geofence = {
        id: `geofence-${index}`,
        name: geofenceData.name,
        type: 'circle',
        circle: circle,
        isActive: true,
        riskLevel: geofenceData.riskLevel,
        description: geofenceData.description
      };

      simulationState.geofences.push(geofence);
    });

    console.log('Created', simulationState.geofences.length, 'geofences');
  }

  // Initialize geofences
  createGeofences();

  // Create vehicle marker
  simulationState.vehicleMarker = new google.maps.Marker({
    position: routePoints[0],
    map: map,
    title: 'Vehicle',
    icon: {
      path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 6,
      fillColor: '#4285F4',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    }
  });

  // Route simulation functions
  function startSimulation() {
    if (simulationState.isRunning) return;
    
    simulationState.isRunning = true;
    simulationState.currentIndex = 0;
    simulationState.startTime = Date.now();
    
    console.log('Starting route simulation...');
    updateSimulation();
  }

  function stopSimulation() {
    simulationState.isRunning = false;
    console.log('Route simulation stopped');
  }

  function resetSimulation() {
    stopSimulation();
    simulationState.currentIndex = 0;
    simulationState.activeGeofences.clear();
    simulationState.geofenceHistory = [];
    if (simulationState.vehicleMarker) {
      simulationState.vehicleMarker.setPosition(routePoints[0]);
    }
    updateGeofenceDisplay();
    console.log('Route simulation reset');
  }

  function updateSimulation() {
    if (!simulationState.isRunning) return;

    const currentTime = Date.now() - simulationState.startTime;
    const adjustedTime = currentTime * simulationState.speedMultiplier;

    // Find current position based on time
    let currentPoint = routePoints[0];
    let nextPoint = routePoints[1];

    for (let i = 0; i < routePoints.length - 1; i++) {
      if (adjustedTime >= routePoints[i].timestamp && adjustedTime < routePoints[i + 1].timestamp) {
        currentPoint = routePoints[i];
        nextPoint = routePoints[i + 1];
        simulationState.currentIndex = i;
        break;
      }
    }

    // Interpolate position between points
    const progress = (adjustedTime - currentPoint.timestamp) / (nextPoint.timestamp - currentPoint.timestamp);
    const interpolatedLat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * progress;
    const interpolatedLng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * progress;

    // Update vehicle position
    if (simulationState.vehicleMarker) {
      const newPosition = { lat: interpolatedLat, lng: interpolatedLng };
      simulationState.vehicleMarker.setPosition(newPosition);
      
      // Calculate heading for vehicle orientation
      const heading = google.maps.geometry.spherical.computeHeading(
        new google.maps.LatLng(currentPoint.lat, currentPoint.lng),
        new google.maps.LatLng(nextPoint.lat, nextPoint.lng)
      );
      
      simulationState.vehicleMarker.setIcon({
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 6,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        rotation: heading
      });
    }

    // Check geofence detection
    checkGeofenceDetection({ lat: interpolatedLat, lon: interpolatedLng });

    // Check if simulation is complete
    if (adjustedTime >= routePoints[routePoints.length - 1].timestamp) {
      stopSimulation();
      console.log('Route simulation completed');
      return;
    }

    // Continue simulation
    requestAnimationFrame(updateSimulation);
  }

  // Geofence detection function
  function checkGeofenceDetection(vehiclePosition: { lat: number; lon: number }) {
    simulationState.geofences.forEach(geofence => {
      if (!geofence.isActive || !geofence.circle) return;

      const isInside = is_point_inside_circle(vehiclePosition, geofence.circle);
      const wasInside = simulationState.activeGeofences.has(geofence.id);

      if (isInside && !wasInside) {
        // Vehicle entered geofence
        simulationState.activeGeofences.add(geofence.id);
        simulationState.geofenceHistory.push({
          geofenceId: geofence.id,
          action: 'enter',
          timestamp: Date.now(),
          position: { lat: vehiclePosition.lat, lng: vehiclePosition.lon }
        });

        console.log(`🚨 ENTERED ${geofence.riskLevel.toUpperCase()} RISK ZONE: ${geofence.name}`);
        console.log(`📍 ${geofence.description}`);
        
        // Show visual alert
        showGeofenceAlert(geofence, 'enter');
      } else if (!isInside && wasInside) {
        // Vehicle exited geofence
        simulationState.activeGeofences.delete(geofence.id);
        simulationState.geofenceHistory.push({
          geofenceId: geofence.id,
          action: 'exit',
          timestamp: Date.now(),
          position: { lat: vehiclePosition.lat, lng: vehiclePosition.lon }
        });

        console.log(`✅ EXITED ${geofence.riskLevel.toUpperCase()} RISK ZONE: ${geofence.name}`);
        
        // Show visual alert
        showGeofenceAlert(geofence, 'exit');
      }
    });
  }

  // Visual alert for geofence events
  function showGeofenceAlert(geofence: Geofence, action: 'enter' | 'exit') {
    const alertDiv = document.createElement('div');
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800', 
      high: '#F44336'
    };
    
    alertDiv.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: ${colors[geofence.riskLevel]};
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      z-index: 2000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: fadeInOut 3s ease-in-out;
    `;
    
    alertDiv.textContent = `${action.toUpperCase()}: ${geofence.name}`;
    container.appendChild(alertDiv);
    
    // Update geofence display
    updateGeofenceDisplay();
    
    // Remove alert after animation
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  }

  // Update geofence display in controls
  function updateGeofenceDisplay() {
    const activeGeofencesElement = document.getElementById('activeGeofences');
    const totalEventsElement = document.getElementById('totalEvents');
    const geofenceLogElement = document.getElementById('geofenceLog');
    
    if (activeGeofencesElement) {
      activeGeofencesElement.textContent = simulationState.activeGeofences.size.toString();
    }
    
    if (totalEventsElement) {
      totalEventsElement.textContent = simulationState.geofenceHistory.length.toString();
    }
    
    if (geofenceLogElement) {
      // Show last 3 events
      const recentEvents = simulationState.geofenceHistory.slice(-3);
      geofenceLogElement.innerHTML = recentEvents.map(event => {
        const geofence = simulationState.geofences.find(g => g.id === event.geofenceId);
        const actionIcon = event.action === 'enter' ? '🚨' : '✅';
        const time = new Date(event.timestamp).toLocaleTimeString();
        return `<div>${actionIcon} ${geofence?.name || 'Unknown'} (${time})</div>`;
      }).join('');
    }
  }

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

  // Add simulation controls
  const controlsDiv = document.createElement('div');
  controlsDiv.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 10px;
    border-radius: 4px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 1000;
  `;
  
  controlsDiv.innerHTML = `
    <div style="margin-bottom: 8px;">
      <button id="startSim" style="margin-right: 5px; padding: 4px 8px;">Start</button>
      <button id="stopSim" style="margin-right: 5px; padding: 4px 8px;">Stop</button>
      <button id="resetSim" style="padding: 4px 8px;">Reset</button>
    </div>
    <div style="margin-bottom: 8px;">
      <label>Speed: </label>
      <input type="range" id="speedSlider" min="0.1" max="5" step="0.1" value="1" style="width: 80px;">
      <span id="speedValue">1x</span>
    </div>
    <div style="font-size: 10px; margin-bottom: 8px;">
      <div>Active Geofences: <span id="activeGeofences">0</span></div>
      <div>Total Events: <span id="totalEvents">0</span></div>
    </div>
    <div style="font-size: 9px; max-height: 60px; overflow-y: auto;">
      <div id="geofenceLog" style="color: #ccc;"></div>
    </div>
  `;
  
  container.appendChild(controlsDiv);

  // Add event listeners to controls
  document.getElementById('startSim')?.addEventListener('click', startSimulation);
  document.getElementById('stopSim')?.addEventListener('click', stopSimulation);
  document.getElementById('resetSim')?.addEventListener('click', resetSimulation);
  
  const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
  const speedValue = document.getElementById('speedValue');
  
  speedSlider?.addEventListener('input', (e) => {
    const value = parseFloat((e.target as HTMLInputElement).value);
    simulationState.speedMultiplier = value;
    if (speedValue) speedValue.textContent = value + 'x';
  });

  // Also log to console for debugging
  map.addListener('center_changed', () => {
    const center = map.getCenter();
    if (center) {
      console.log('Map Center:', center.lat().toFixed(6), center.lng().toFixed(6));
    }
  });

  return map;
}