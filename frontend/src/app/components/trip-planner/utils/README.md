# Hotspot Risk Zone Generator

A comprehensive hotspot generator that creates random risk zones along travel routes and provides real-time notifications when vehicles enter or exit these zones.

## Features

- **Route-based Hotspot Generation**: Automatically generates risk zones along calculated routes
- **Multiple Risk Levels**: Low, Medium, High, and Critical risk zones with different visual properties
- **Real-time Detection**: Monitors vehicle position and detects zone entry/exit events
- **Visual Notifications**: Popup notifications with risk level indicators and emojis
- **Debug Mode**: Interactive controls for testing and development
- **Clickable Zones**: Click on zones to view detailed information
- **Event History**: Tracks all zone entry/exit events

## Usage

### Basic Integration

```typescript
import { HotSpotGenerator } from './utils/HotSpotGenerator';

// Initialize with map
const hotspotGenerator = new HotSpotGenerator(map);

// Initialize with debug mode (optional)
hotspotGenerator.initialize(true);

// Generate hotspots along a route
const zones = hotspotGenerator.generateHotspotsAlongRoute(route, 8);

// Set up event callback
hotspotGenerator.onZoneEventCallback((event) => {
  console.log('Zone event:', event);
  // Handle zone entry/exit events
});

// Check position manually (for testing)
hotspotGenerator.checkPositionManually(lat, lng);
```

### Risk Levels

- **Low Risk (40% chance)**: Green zones, 150m radius
- **Medium Risk (30% chance)**: Orange zones, 200m radius  
- **High Risk (20% chance)**: Red zones, 250m radius
- **Critical Risk (10% chance)**: Purple zones, 300m radius

### Event Structure

```typescript
interface HotspotEvent {
  zoneId: string;
  zoneName: string;
  action: 'enter' | 'exit';
  timestamp: number;
  position: { lat: number; lng: number };
  riskLevel: string;
  description: string;
}
```

### Zone Properties

```typescript
interface HotspotZone {
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
```

## Integration with Trip Planner

The hotspot generator is automatically integrated with the trip planner:

1. **Automatic Generation**: Hotspots are generated when a route is calculated
2. **Simulation Testing**: Use the "Test Hotspots" button to simulate vehicle movement
3. **Real-time Monitoring**: Zones are checked during route simulation

## Debug Controls

When debug mode is enabled, you'll see controls in the top-left corner:

- **Number of Hotspots**: Adjust how many zones to generate
- **Generate**: Create random hotspots in the current map view
- **Clear**: Remove all hotspots
- **Active Zones**: Shows current number of zones being entered
- **Total Events**: Shows total number of entry/exit events
- **Event Log**: Recent zone events with timestamps

## Notifications

The generator provides visual notifications:

- **Slide-in animations** from the right side
- **Color-coded** by risk level
- **Auto-dismiss** after 5 seconds
- **Clickable** to dismiss manually
- **Emoji indicators** for quick visual recognition

## Customization

### Modifying Risk Distribution

```typescript
private generateRandomRiskLevel(): 'low' | 'medium' | 'high' | 'critical' {
  const random = Math.random();
  if (random < 0.4) return 'low';      // 40% chance
  if (random < 0.7) return 'medium';   // 30% chance
  if (random < 0.9) return 'high';     // 20% chance
  return 'critical';                   // 10% chance
}
```

### Custom Zone Properties

```typescript
private getZoneProperties(riskLevel: string) {
  const properties = {
    low: {
      radius: 150,
      color: '#4CAF50',
      strokeColor: '#2E7D32',
      opacity: 0.3
    },
    // ... other levels
  };
  return properties[riskLevel] || properties.low;
}
```

## API Methods

### Core Methods

- `initialize(debugMode?: boolean)`: Initialize the generator
- `generateHotspotsAlongRoute(route, numHotspots)`: Generate zones along a route
- `generateRandomHotspots(numHotspots)`: Generate random zones in map bounds
- `checkPositionInZones(position)`: Check if position is in any zones
- `clearAllZones()`: Remove all zones
- `destroy()`: Clean up resources

### Utility Methods

- `getZones()`: Get all zones
- `getActiveZones()`: Get currently active zone IDs
- `getEventHistory()`: Get all zone events
- `getZonesAtPosition(lat, lng)`: Get zones at specific position
- `onZoneEventCallback(callback)`: Set event callback

## Dependencies

- Google Maps JavaScript API
- Geometry utility functions (`create_circle_fence`, `is_point_inside_circle`)
- Angular framework (for component integration)

## Example Workflow

1. **Calculate Route**: User calculates a route in trip planner
2. **Generate Hotspots**: System automatically generates 8 random hotspots along the route
3. **Start Simulation**: User clicks "Test Hotspots" to simulate vehicle movement
4. **Monitor Events**: System detects when simulated vehicle enters/exits zones
5. **Show Notifications**: Popup notifications appear for each zone event
6. **Track History**: All events are logged and displayed in debug controls

This creates a comprehensive risk monitoring system that can be used for real-time travel safety applications. 