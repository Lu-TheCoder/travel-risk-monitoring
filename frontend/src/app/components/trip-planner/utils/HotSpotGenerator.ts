import { create_circle_fence, is_point_inside_circle } from '../../../utils/geometry/geometry';

export interface HotspotZone {
  id: string;
  name: string;
  type: 'circle' | 'polygon';
  circle?: google.maps.Circle;
  polygon?: google.maps.Polygon;
  isActive: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  position: { lat: number; lng: number };
  radius: number;
  color: string;
  strokeColor: string;
  opacity: number;
}

export interface HotspotEvent {
  zoneId: string;
  zoneName: string;
  action: 'enter' | 'exit';
  timestamp: number;
  position: { lat: number; lng: number };
  riskLevel: string;
  description: string;
}

export class HotSpotGenerator {
  private map: google.maps.Map;
  private zones: HotspotZone[] = [];
  private activeZones: Set<string> = new Set();
  private eventHistory: HotspotEvent[] = [];
  private notificationContainer!: HTMLElement;
  private onZoneEvent?: (event: HotspotEvent) => void;
  private isDebugMode: boolean = false;

  constructor(map: google.maps.Map) {
    this.map = map;
    this.createNotificationContainer();
  }

  // Initialize the hotspot generator
  initialize(debugMode: boolean = false): void {
    this.isDebugMode = debugMode;
    if (debugMode) {
      this.createDebugControls();
    }
    console.log('HotSpot Generator initialized');
  }

  // Generate hotspots along a route
  generateHotspotsAlongRoute(route: any, numHotspots: number = 5): HotspotZone[] {
    this.clearAllZones();
    
    if (!route || !route.path || route.path.length === 0) {
      console.warn('No valid route provided for hotspot generation');
      return [];
    }

    const routePath = route.path;
    const hotspots: HotspotZone[] = [];

    // Generate random hotspots along the route
    for (let i = 0; i < numHotspots; i++) {
      const hotspot = this.generateRandomHotspot(routePath, i);
      if (hotspot) {
        hotspots.push(hotspot);
        this.zones.push(hotspot);
      }
    }

    console.log(`Generated ${hotspots.length} hotspots along the route`);
    return hotspots;
  }

  // Generate a single random hotspot
  private generateRandomHotspot(routePath: google.maps.LatLng[], index: number): HotspotZone | null {
    if (routePath.length < 2) return null;

    // Pick a random point along the route (avoiding start and end points)
    const startIndex = Math.floor(routePath.length * 0.1);
    const endIndex = Math.floor(routePath.length * 0.9);
    const randomIndex = Math.floor(Math.random() * (endIndex - startIndex)) + startIndex;
    
    const basePoint = routePath[randomIndex];
    
    // Add some randomness to the position (within 500m of the route)
    const offsetLat = (Math.random() - 0.5) * 0.005; // ~500m offset
    const offsetLng = (Math.random() - 0.5) * 0.005;
    
    const position = {
      lat: basePoint.lat() + offsetLat,
      lng: basePoint.lng() + offsetLng
    };

    // Generate random risk level with weighted distribution
    const riskLevel = this.generateRandomRiskLevel();
    
    // Generate zone properties based on risk level
    const zoneProps = this.getZoneProperties(riskLevel);
    
    // Create the zone
    const zone: HotspotZone = {
      id: `hotspot-${index}-${Date.now()}`,
      name: this.generateZoneName(riskLevel, index),
      type: 'circle',
      isActive: true,
      riskLevel,
      description: this.generateZoneDescription(riskLevel),
      position,
      radius: zoneProps.radius,
      color: zoneProps.color,
      strokeColor: zoneProps.strokeColor,
      opacity: zoneProps.opacity
    };

    // Create the visual circle on the map
    zone.circle = create_circle_fence(
      zone.radius,
      { lat: position.lat, lon: position.lng },
      zone.color,
      zone.strokeColor,
      this.map
    );

    // Add click listener for zone info
    this.addZoneClickListener(zone);

    return zone;
  }

  // Generate random risk level with weighted distribution
  private generateRandomRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
    const random = Math.random();
    if (random < 0.4) return 'low';      // 40% chance
    if (random < 0.7) return 'medium';   // 30% chance
    if (random < 0.9) return 'high';     // 20% chance
    return 'critical';                   // 10% chance
  }

  // Get zone properties based on risk level
  private getZoneProperties(riskLevel: string): {
    radius: number;
    color: string;
    strokeColor: string;
    opacity: number;
  } {
    const properties = {
      low: {
        radius: 150,
        color: '#4CAF50',
        strokeColor: '#2E7D32',
        opacity: 0.3
      },
      medium: {
        radius: 200,
        color: '#FF9800',
        strokeColor: '#E65100',
        opacity: 0.4
      },
      high: {
        radius: 250,
        color: '#F44336',
        strokeColor: '#B71C1C',
        opacity: 0.5
      },
      critical: {
        radius: 300,
        color: '#9C27B0',
        strokeColor: '#4A148C',
        opacity: 0.6
      }
    };

    return properties[riskLevel as keyof typeof properties] || properties.low;
  }

  // Generate zone name
  private generateZoneName(riskLevel: string, index: number): string {
    const prefixes = {
      low: ['Safe Zone', 'Low Risk Area', 'Normal Zone'],
      medium: ['Caution Zone', 'Medium Risk Area', 'Watch Zone'],
      high: ['High Risk Zone', 'Danger Area', 'Alert Zone'],
      critical: ['Critical Zone', 'Extreme Risk', 'Emergency Area']
    };

    const prefix = prefixes[riskLevel as keyof typeof prefixes] || prefixes.low;
    const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
    return `${randomPrefix} ${index + 1}`;
  }

  // Generate zone description
  private generateZoneDescription(riskLevel: string): string {
    const descriptions = {
      low: 'Normal traffic conditions. Proceed with caution.',
      medium: 'Moderate risk area. Increased attention required.',
      high: 'High risk zone. Exercise extreme caution.',
      critical: 'Critical risk area. Immediate action may be required.'
    };

    return descriptions[riskLevel as keyof typeof descriptions] || descriptions.low;
  }

  // Add click listener to zone
  private addZoneClickListener(zone: HotspotZone): void {
    if (!zone.circle) return;

    zone.circle.addListener('click', () => {
      this.showZoneInfo(zone);
    });
  }

  // Show zone information popup
  private showZoneInfo(zone: HotspotZone): void {
    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div style="padding: 10px; min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #333;">${zone.name}</h3>
          <div style="margin-bottom: 10px;">
            <span style="
              background: ${zone.color};
              color: white;
              padding: 4px 8px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: bold;
              text-transform: uppercase;
            ">
              ${zone.riskLevel} Risk
            </span>
          </div>
          <p style="margin: 0; color: #666; font-size: 14px;">${zone.description}</p>
          <div style="margin-top: 10px; font-size: 12px; color: #999;">
            Radius: ${zone.radius}m
          </div>
        </div>
      `
    });

    infoWindow.setPosition(zone.position);
    infoWindow.open(this.map);
  }

  // Check if a position is inside any zones
  checkPositionInZones(position: { lat: number; lng: number }): void {
    this.zones.forEach(zone => {
      if (!zone.isActive || !zone.circle) return;

      const isInside = is_point_inside_circle(
        { lat: position.lat, lon: position.lng },
        zone.circle
      );
      const wasInside = this.activeZones.has(zone.id);

      if (isInside && !wasInside) {
        // Entered zone
        this.activeZones.add(zone.id);
        this.handleZoneEvent(zone, 'enter', position);
      } else if (!isInside && wasInside) {
        // Exited zone
        this.activeZones.delete(zone.id);
        this.handleZoneEvent(zone, 'exit', position);
      }
    });
  }

  // Handle zone events
  private handleZoneEvent(zone: HotspotZone, action: 'enter' | 'exit', position: { lat: number; lng: number }): void {
    const event: HotspotEvent = {
      zoneId: zone.id,
      zoneName: zone.name,
      action,
      timestamp: Date.now(),
      position,
      riskLevel: zone.riskLevel,
      description: zone.description
    };

    this.eventHistory.push(event);
    
    // Show notification
    this.showNotification(event);
    
    // Log to console
    const actionIcon = action === 'enter' ? '🚨' : '✅';
    const riskEmoji = this.getRiskEmoji(zone.riskLevel);
    console.log(`${actionIcon} ${riskEmoji} ${action.toUpperCase()}: ${zone.name} (${zone.riskLevel} risk)`);
    
    // Call callback if provided
    if (this.onZoneEvent) {
      this.onZoneEvent(event);
    }
  }

  // Get risk level emoji
  private getRiskEmoji(riskLevel: string): string {
    const emojis = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
      critical: '🟣'
    };
    return emojis[riskLevel as keyof typeof emojis] || '⚪';
  }

  // Create notification container
  private createNotificationContainer(): void {
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      max-width: 350px;
      pointer-events: none;
    `;
    document.body.appendChild(this.notificationContainer);
  }

  // Show notification popup
  private showNotification(event: HotspotEvent): void {
    const notification = document.createElement('div');
    const colors = {
      low: '#4CAF50',
      medium: '#FF9800',
      high: '#F44336',
      critical: '#9C27B0'
    };

    const color = colors[event.riskLevel as keyof typeof colors] || '#666';
    const actionIcon = event.action === 'enter' ? '🚨' : '✅';
    const riskEmoji = this.getRiskEmoji(event.riskLevel);

    notification.style.cssText = `
      background: ${color};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      font-family: Arial, sans-serif;
      font-size: 14px;
      font-weight: bold;
      animation: slideInRight 0.3s ease-out;
      pointer-events: auto;
      cursor: pointer;
      max-width: 100%;
    `;

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">${actionIcon} ${riskEmoji}</span>
        <div>
          <div style="margin-bottom: 4px;">${event.action.toUpperCase()}: ${event.zoneName}</div>
          <div style="font-size: 12px; opacity: 0.9;">${event.riskLevel.toUpperCase()} RISK</div>
        </div>
      </div>
    `;

    // Add click to dismiss
    notification.addEventListener('click', () => {
      notification.style.animation = 'slideOutRight 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    });

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }
    }, 5000);

    this.notificationContainer.appendChild(notification);
  }

  // Create debug controls
  private createDebugControls(): void {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      z-index: 1000;
      min-width: 200px;
    `;
    
    controlsDiv.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold;">Hotspot Generator Debug</div>
      <div style="margin-bottom: 8px;">
        <label>Number of Hotspots: </label>
        <input type="number" id="numHotspots" min="1" max="20" value="5" style="width: 60px; margin-left: 5px;">
      </div>
      <div style="margin-bottom: 8px;">
        <button id="generateHotspots" style="margin-right: 5px; padding: 4px 8px;">Generate</button>
        <button id="clearHotspots" style="padding: 4px 8px;">Clear</button>
      </div>
      <div style="margin-bottom: 8px;">
        <div>Active Zones: <span id="activeZonesCount">0</span></div>
        <div>Total Events: <span id="totalEventsCount">0</span></div>
      </div>
      <div style="font-size: 10px; max-height: 80px; overflow-y: auto; border-top: 1px solid #444; padding-top: 5px;">
        <div id="eventLog" style="color: #ccc;"></div>
      </div>
    `;
    
    this.map.getDiv().appendChild(controlsDiv);

    // Add event listeners
    document.getElementById('generateHotspots')?.addEventListener('click', () => {
      const numHotspots = parseInt((document.getElementById('numHotspots') as HTMLInputElement).value);
      this.generateRandomHotspots(numHotspots);
    });

    document.getElementById('clearHotspots')?.addEventListener('click', () => {
      this.clearAllZones();
    });
  }

  // Generate random hotspots (for debug mode)
  generateRandomHotspots(numHotspots: number = 5): void {
    const bounds = this.map.getBounds();
    if (!bounds) return;

    this.clearAllZones();

    for (let i = 0; i < numHotspots; i++) {
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      const randomLat = sw.lat() + Math.random() * (ne.lat() - sw.lat());
      const randomLng = sw.lng() + Math.random() * (ne.lng() - sw.lng());
      
      const position = { lat: randomLat, lng: randomLng };
      const riskLevel = this.generateRandomRiskLevel();
      const zoneProps = this.getZoneProperties(riskLevel);
      
      const zone: HotspotZone = {
        id: `debug-hotspot-${i}-${Date.now()}`,
        name: this.generateZoneName(riskLevel, i),
        type: 'circle',
        isActive: true,
        riskLevel,
        description: this.generateZoneDescription(riskLevel),
        position,
        radius: zoneProps.radius,
        color: zoneProps.color,
        strokeColor: zoneProps.strokeColor,
        opacity: zoneProps.opacity
      };

      zone.circle = create_circle_fence(
        zone.radius,
        { lat: position.lat, lon: position.lng },
        zone.color,
        zone.strokeColor,
        this.map
      );

      this.addZoneClickListener(zone);
      this.zones.push(zone);
    }

    this.updateDebugDisplay();
    console.log(`Generated ${numHotspots} random hotspots`);
  }

  // Update debug display
  private updateDebugDisplay(): void {
    const activeZonesElement = document.getElementById('activeZonesCount');
    const totalEventsElement = document.getElementById('totalEventsCount');
    const eventLogElement = document.getElementById('eventLog');
    
    if (activeZonesElement) {
      activeZonesElement.textContent = this.activeZones.size.toString();
    }
    
    if (totalEventsElement) {
      totalEventsElement.textContent = this.eventHistory.length.toString();
    }
    
    if (eventLogElement) {
      const recentEvents = this.eventHistory.slice(-5);
      eventLogElement.innerHTML = recentEvents.map(event => {
        const actionIcon = event.action === 'enter' ? '🚨' : '✅';
        const riskEmoji = this.getRiskEmoji(event.riskLevel);
        const time = new Date(event.timestamp).toLocaleTimeString();
        return `<div>${actionIcon} ${riskEmoji} ${event.zoneName} (${time})</div>`;
      }).join('');
    }
  }

  // Add method to manually check a position (useful for testing)
  checkPositionManually(lat: number, lng: number): void {
    this.checkPositionInZones({ lat, lng });
  }

  // Get zone information for a specific position
  getZonesAtPosition(lat: number, lng: number): HotspotZone[] {
    return this.zones.filter(zone => {
      if (!zone.isActive || !zone.circle) return false;
      return is_point_inside_circle({ lat, lon: lng }, zone.circle);
    });
  }

  // Set event callback
  onZoneEventCallback(callback: (event: HotspotEvent) => void): void {
    this.onZoneEvent = callback;
  }

  // Clear all zones
  clearAllZones(): void {
    this.zones.forEach(zone => {
      if (zone.circle) {
        zone.circle.setMap(null);
      }
      if (zone.polygon) {
        zone.polygon.setMap(null);
      }
    });
    
    this.zones = [];
    this.activeZones.clear();
    this.eventHistory = [];
    
    if (this.isDebugMode) {
      this.updateDebugDisplay();
    }
    
    console.log('All hotspots cleared');
  }

  // Get all zones
  getZones(): HotspotZone[] {
    return this.zones;
  }

  // Get active zones
  getActiveZones(): string[] {
    return Array.from(this.activeZones);
  }

  // Get event history
  getEventHistory(): HotspotEvent[] {
    return this.eventHistory;
  }

  // Destroy the generator
  destroy(): void {
    this.clearAllZones();
    if (this.notificationContainer.parentNode) {
      this.notificationContainer.parentNode.removeChild(this.notificationContainer);
    }
  }
}