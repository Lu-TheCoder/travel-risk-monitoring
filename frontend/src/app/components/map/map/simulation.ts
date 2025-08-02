import { create_circle_fence, is_point_inside_circle } from '../../../utils/geometry/geometry';

// Types
export interface RoutePoint {
  lat: number;
  lng: number;
  timestamp: number;
  speed?: number;
}

export interface Geofence {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  circle?: google.maps.Circle;
  polygon?: google.maps.Polygon;
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  description: string;
}

export interface SimulationState {
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

export class RouteSimulation {
  private map: google.maps.Map;
  private container: HTMLElement;
  private routePoints: RoutePoint[];
  private state: SimulationState;
  private onGeofenceEvent?: (geofence: Geofence, action: 'enter' | 'exit') => void;

  constructor(map: google.maps.Map, container: HTMLElement, routePoints: RoutePoint[]) {
    this.map = map;
    this.container = container;
    this.routePoints = routePoints;
    this.state = {
      isRunning: false,
      currentIndex: 0,
      startTime: 0,
      speedMultiplier: 1,
      geofences: [],
      activeGeofences: new Set(),
      geofenceHistory: []
    };
  }

  // Initialize simulation
  initialize(): void {
    this.createRoutePolyline();
    this.createVehicleMarker();
    this.createGeofences();
    this.createControls();
  }

  // Set callback for geofence events
  onGeofenceEventCallback(callback: (geofence: Geofence, action: 'enter' | 'exit') => void): void {
    this.onGeofenceEvent = callback;
  }

  // Create route polyline
  private createRoutePolyline(): void {
    const routePath = this.routePoints.map(point => ({ lat: point.lat, lng: point.lng }));
    this.state.routePolyline = new google.maps.Polyline({
      path: routePath,
      geodesic: true,
      strokeColor: '#FF0000',
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: this.map
    });
  }

  // Create vehicle marker
  private createVehicleMarker(): void {
    this.state.vehicleMarker = new google.maps.Marker({
      position: this.routePoints[0],
      map: this.map,
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
  }

  // Create geofences along the route
  private createGeofences(): void {
    const geofenceColors = {
      low: { fill: '#4CAF50', stroke: '#2E7D32' },
      medium: { fill: '#FF9800', stroke: '#E65100' },
      high: { fill: '#F44336', stroke: '#B71C1C' }
    };

    // Create geofences at key points along the route
    const geofencePoints = [
      { 
        point: this.routePoints[0], 
        name: 'Start Point', 
        riskLevel: 'low' as const,
        description: 'Route starting point'
      },
      { 
        point: this.routePoints[Math.floor(this.routePoints.length * 0.25)], 
        name: 'Quarter Point', 
        riskLevel: 'medium' as const,
        description: '25% of route completed'
      },
      { 
        point: this.routePoints[Math.floor(this.routePoints.length * 0.5)], 
        name: 'Mid Point', 
        riskLevel: 'high' as const,
        description: 'High risk area - construction zone'
      },
      { 
        point: this.routePoints[Math.floor(this.routePoints.length * 0.75)], 
        name: 'Three Quarter Point', 
        riskLevel: 'medium' as const,
        description: '75% of route completed'
      },
      { 
        point: this.routePoints[this.routePoints.length - 1], 
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
        this.map
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

      this.state.geofences.push(geofence);
    });

    console.log('Created', this.state.geofences.length, 'geofences');
  }

  // Create simulation controls
  private createControls(): void {
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
    
    this.container.appendChild(controlsDiv);

    // Add event listeners to controls
    document.getElementById('startSim')?.addEventListener('click', () => this.start());
    document.getElementById('stopSim')?.addEventListener('click', () => this.stop());
    document.getElementById('resetSim')?.addEventListener('click', () => this.reset());
    
    const speedSlider = document.getElementById('speedSlider') as HTMLInputElement;
    const speedValue = document.getElementById('speedValue');
    
    speedSlider?.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.state.speedMultiplier = value;
      if (speedValue) speedValue.textContent = value + 'x';
    });
  }

  // Start simulation
  start(): void {
    if (this.state.isRunning) return;
    
    this.state.isRunning = true;
    this.state.currentIndex = 0;
    this.state.startTime = Date.now();
    
    console.log('Starting route simulation...');
    this.updateSimulation();
  }

  // Stop simulation
  stop(): void {
    this.state.isRunning = false;
    console.log('Route simulation stopped');
  }

  // Reset simulation
  reset(): void {
    this.stop();
    this.state.currentIndex = 0;
    this.state.activeGeofences.clear();
    this.state.geofenceHistory = [];
    if (this.state.vehicleMarker) {
      this.state.vehicleMarker.setPosition(this.routePoints[0]);
    }
    this.updateGeofenceDisplay();
    console.log('Route simulation reset');
  }

  // Main simulation update loop
  private updateSimulation(): void {
    if (!this.state.isRunning) return;

    const currentTime = Date.now() - this.state.startTime;
    const adjustedTime = currentTime * this.state.speedMultiplier;

    // Find current position based on time
    let currentPoint = this.routePoints[0];
    let nextPoint = this.routePoints[1];

    for (let i = 0; i < this.routePoints.length - 1; i++) {
      if (adjustedTime >= this.routePoints[i].timestamp && adjustedTime < this.routePoints[i + 1].timestamp) {
        currentPoint = this.routePoints[i];
        nextPoint = this.routePoints[i + 1];
        this.state.currentIndex = i;
        break;
      }
    }

    // Interpolate position between points
    const progress = (adjustedTime - currentPoint.timestamp) / (nextPoint.timestamp - currentPoint.timestamp);
    const interpolatedLat = currentPoint.lat + (nextPoint.lat - currentPoint.lat) * progress;
    const interpolatedLng = currentPoint.lng + (nextPoint.lng - currentPoint.lng) * progress;

    // Update vehicle position
    if (this.state.vehicleMarker) {
      const newPosition = { lat: interpolatedLat, lng: interpolatedLng };
      this.state.vehicleMarker.setPosition(newPosition);
      
      // Calculate heading for vehicle orientation
      const heading = google.maps.geometry.spherical.computeHeading(
        new google.maps.LatLng(currentPoint.lat, currentPoint.lng),
        new google.maps.LatLng(nextPoint.lat, nextPoint.lng)
      );
      
      this.state.vehicleMarker.setIcon({
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
    this.checkGeofenceDetection({ lat: interpolatedLat, lon: interpolatedLng });

    // Check if simulation is complete
    if (adjustedTime >= this.routePoints[this.routePoints.length - 1].timestamp) {
      this.stop();
      console.log('Route simulation completed');
      return;
    }

    // Continue simulation
    requestAnimationFrame(() => this.updateSimulation());
  }

  // Geofence detection
  private checkGeofenceDetection(vehiclePosition: { lat: number; lon: number }): void {
    this.state.geofences.forEach(geofence => {
      if (!geofence.isActive || !geofence.circle) return;

      const isInside = is_point_inside_circle(vehiclePosition, geofence.circle);
      const wasInside = this.state.activeGeofences.has(geofence.id);

      if (isInside && !wasInside) {
        // Vehicle entered geofence
        this.state.activeGeofences.add(geofence.id);
        this.state.geofenceHistory.push({
          geofenceId: geofence.id,
          action: 'enter',
          timestamp: Date.now(),
          position: { lat: vehiclePosition.lat, lng: vehiclePosition.lon }
        });

        console.log(`🚨 ENTERED ${geofence.riskLevel.toUpperCase()} RISK ZONE: ${geofence.name}`);
        console.log(`📍 ${geofence.description}`);
        
        // Show visual alert
        this.showGeofenceAlert(geofence, 'enter');
        
        // Call callback if provided
        if (this.onGeofenceEvent) {
          this.onGeofenceEvent(geofence, 'enter');
        }
      } else if (!isInside && wasInside) {
        // Vehicle exited geofence
        this.state.activeGeofences.delete(geofence.id);
        this.state.geofenceHistory.push({
          geofenceId: geofence.id,
          action: 'exit',
          timestamp: Date.now(),
          position: { lat: vehiclePosition.lat, lng: vehiclePosition.lon }
        });

        console.log(`✅ EXITED ${geofence.riskLevel.toUpperCase()} RISK ZONE: ${geofence.name}`);
        
        // Show visual alert
        this.showGeofenceAlert(geofence, 'exit');
        
        // Call callback if provided
        if (this.onGeofenceEvent) {
          this.onGeofenceEvent(geofence, 'exit');
        }
      }
    });
  }

  // Visual alert for geofence events
  private showGeofenceAlert(geofence: Geofence, action: 'enter' | 'exit'): void {
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
    this.container.appendChild(alertDiv);
    
    // Update geofence display
    this.updateGeofenceDisplay();
    
    // Remove alert after animation
    setTimeout(() => {
      if (alertDiv.parentNode) {
        alertDiv.parentNode.removeChild(alertDiv);
      }
    }, 3000);
  }

  // Update geofence display in controls
  private updateGeofenceDisplay(): void {
    const activeGeofencesElement = document.getElementById('activeGeofences');
    const totalEventsElement = document.getElementById('totalEvents');
    const geofenceLogElement = document.getElementById('geofenceLog');
    
    if (activeGeofencesElement) {
      activeGeofencesElement.textContent = this.state.activeGeofences.size.toString();
    }
    
    if (totalEventsElement) {
      totalEventsElement.textContent = this.state.geofenceHistory.length.toString();
    }
    
    if (geofenceLogElement) {
      // Show last 3 events
      const recentEvents = this.state.geofenceHistory.slice(-3);
      geofenceLogElement.innerHTML = recentEvents.map(event => {
        const geofence = this.state.geofences.find(g => g.id === event.geofenceId);
        const actionIcon = event.action === 'enter' ? '🚨' : '✅';
        const time = new Date(event.timestamp).toLocaleTimeString();
        return `<div>${actionIcon} ${geofence?.name || 'Unknown'} (${time})</div>`;
      }).join('');
    }
  }

  // Get simulation state
  getState(): SimulationState {
    return this.state;
  }

  // Get geofence history
  getGeofenceHistory(): SimulationState['geofenceHistory'] {
    return this.state.geofenceHistory;
  }
} 