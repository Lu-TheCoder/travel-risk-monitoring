import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../../environments/environment';
import { EventEmitter } from '@angular/core';

export interface RiskPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
  geofence?: google.maps.Circle;
}

export async function initCommunityMap(
  container: HTMLElement, 
  locationSelected: EventEmitter<{ lat: number; lng: number; locationName: string }>,
  onRiskPointsChange?: EventEmitter<RiskPoint[]>
) {
  const loader = new Loader({
    apiKey: environment.googleMapsApiKey,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  await loader.importLibrary('maps');
  await loader.importLibrary('marker');

  const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

  // Default center (Pretoria)
  const mapCenter = { lat: -25.854361, lng: 28.192019 };

  const map = new Map(container, {
    center: mapCenter,
    zoom: 12,
    mapTypeControl: false,
    mapTypeId: 'roadmap',
    mapId: environment.googleMapsMapId,
  });

  // Store risk points with their markers
  const riskPoints: RiskPoint[] = [];
  const markerStorage: { [key: string]: any } = {}; // Store markers by ID
  
  // Function to emit risk points change
  function emitRiskPointsChange() {
    if (onRiskPointsChange) {
      onRiskPointsChange.emit([...riskPoints]);
    }
  }

  // Create risk point marker
  function createRiskPointMarker(riskPoint: RiskPoint, AdvancedMarkerElement: any) {
    const content = document.createElement('div');
    content.innerHTML = `
      <div class="risk-marker ${riskPoint.riskLevel}" style="
        background: ${getRiskColor(riskPoint.riskLevel).background};
        border-color: ${getRiskColor(riskPoint.riskLevel).border};
        border: 2px solid ${getRiskColor(riskPoint.riskLevel).border};
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${getRiskIcon(riskPoint.riskLevel)}
      </div>
    `;

    const marker = new AdvancedMarkerElement({
      map: map,
      position: { lat: riskPoint.lat, lng: riskPoint.lng },
      content: content,
      title: riskPoint.title
    });

    // Create info window
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 15px; min-width: 250px;">
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${riskPoint.title}</h3>
          <div style="margin-bottom: 10px;">
            <span style="
              background: ${getRiskColor(riskPoint.riskLevel).background};
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            ">${riskPoint.riskLevel} Risk</span>
          </div>
          <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">${riskPoint.description}</p>
          <div style="font-size: 12px; color: #999;">
            <div>Location: ${riskPoint.lat.toFixed(6)}, ${riskPoint.lng.toFixed(6)}</div>
            <div>Reported: ${riskPoint.timestamp.toLocaleString()}</div>
            <div>Geofence Radius: 4km</div>
          </div>
          <div style="margin-top: 15px; text-align: center;">
            <button id="removePoint" style="
              background: #dc3545;
              color: white;
              border: none;
              padding: 8px 16px;
              border-radius: 4px;
              cursor: pointer;
              font-size: 12px;
            ">Remove Point</button>
          </div>
        </div>
      `
    });

    // Add click listener
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
      
      // Add remove button listener after info window opens
      setTimeout(() => {
        const removeButton = document.getElementById('removePoint');
        if (removeButton) {
          removeButton.addEventListener('click', () => {
            removeRiskPoint(riskPoint.id);
            infoWindow.close();
          });
        }
      }, 100);
    });

    return marker;
  }

  // Remove risk point function
  function removeRiskPoint(riskPointId: string) {
    const index = riskPoints.findIndex(point => point.id === riskPointId);
    if (index !== -1) {
      const riskPoint = riskPoints[index];
      
      // Remove geofence from map
      if (riskPoint.geofence) {
        riskPoint.geofence.setMap(null);
      }
      
      // Remove marker from map
      const marker = markerStorage[riskPointId];
      if (marker) {
        marker.map = null; // Remove from map
        delete markerStorage[riskPointId]; // Remove from storage
      }
      
      // Remove from array
      riskPoints.splice(index, 1);
      
      // Emit change
      emitRiskPointsChange();
      
      console.log('Risk point removed:', riskPointId);
    }
  }

  // Clear all risk points function
  function clearAllRiskPoints() {
    // Remove all geofences
    riskPoints.forEach(point => {
      if (point.geofence) {
        point.geofence.setMap(null);
      }
    });
    
    // Remove all markers
    Object.values(markerStorage).forEach((marker: any) => {
      marker.map = null;
    });
    
    // Clear arrays
    riskPoints.length = 0;
    Object.keys(markerStorage).forEach(key => delete markerStorage[key]);
    
    // Emit change
    emitRiskPointsChange();
    
    console.log('All risk points cleared');
  }

  // Create 4km radius geofence
  function createGeofence(riskPoint: RiskPoint) {
    const colors = getRiskColor(riskPoint.riskLevel);
    
    const circle = new google.maps.Circle({
      strokeColor: colors.border,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: colors.background,
      fillOpacity: 0.1,
      map: map,
      center: { lat: riskPoint.lat, lng: riskPoint.lng },
      radius: 4000, // 4km radius
    });

    return circle;
  }

  // Get risk level colors
  function getRiskColor(riskLevel: 'low' | 'medium' | 'high') {
    const colors = {
      low: { background: '#4CAF50', border: '#2E7D32' },
      medium: { background: '#FF9800', border: '#E65100' },
      high: { background: '#F44336', border: '#B71C1C' }
    };
    return colors[riskLevel];
  }

  // Get risk level icon
  function getRiskIcon(riskLevel: 'low' | 'medium' | 'high') {
    const icons = {
      low: '⚠️',
      medium: '🚨',
      high: '🚨'
    };
    return icons[riskLevel];
  }

  // Add map click listener for marking risk points
  map.addListener('click', (event: google.maps.MapMouseEvent) => {
    if (!event.latLng) return;

    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    // Create a temporary risk point for demonstration
    const tempRiskPoint: RiskPoint = {
      id: `risk-${Date.now()}`,
      lat: lat,
      lng: lng,
      title: 'New Risk Point',
      description: 'Click to edit this risk point description',
      riskLevel: 'medium',
      timestamp: new Date()
    };

    // Create geofence
    const geofence = createGeofence(tempRiskPoint);
    tempRiskPoint.geofence = geofence;

    // Create marker
    const marker = createRiskPointMarker(tempRiskPoint, AdvancedMarkerElement);
    
    // Store marker reference
    markerStorage[tempRiskPoint.id] = marker;

    // Add to risk points array
    riskPoints.push(tempRiskPoint);

    // Emit location selected event
    locationSelected.emit({
      lat: lat,
      lng: lng,
      locationName: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
    });

    // Emit risk points change
    emitRiskPointsChange();

    console.log('Risk point added:', tempRiskPoint);
  });

  // Add instructions overlay
  const instructionsDiv = document.createElement('div');
  instructionsDiv.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 12px;
    border-radius: 6px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 1000;
    max-width: 250px;
  `;
  instructionsDiv.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: bold;">Community Risk Map</div>
    <div style="font-size: 11px; line-height: 1.4;">
      <div>• Click anywhere on the map to mark a risk point</div>
      <div>• Each point creates a 4km radius geofence</div>
      <div>• Click markers to view details & remove points</div>
      <div>• Green = Low Risk, Orange = Medium, Red = High</div>
      <div>• Multiple locations supported</div>
    </div>
  `;
  container.appendChild(instructionsDiv);

  // Add center display for debugging
  let centerDisplay = document.createElement('div');
  centerDisplay.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 11px;
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
  
  // Initial display
  updateCenterDisplay();

  return {
    map,
    clearAllPoints: clearAllRiskPoints
  };
} 