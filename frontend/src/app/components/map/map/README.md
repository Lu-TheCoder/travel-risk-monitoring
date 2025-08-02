# Map and Route Simulation Module

This module provides Google Maps integration with route simulation and geofence detection capabilities.

## Files

### `map.lib.ts`
- **Purpose**: Main map initialization and setup
- **Responsibilities**:
  - Load Google Maps API
  - Parse GeoJSON route data
  - Initialize map with route visualization
  - Create and manage simulation instance
  - Handle map events and debugging

### `simulation.ts`
- **Purpose**: Route simulation with geofence detection
- **Responsibilities**:
  - Vehicle animation along route
  - Geofence creation and management
  - Real-time geofence detection
  - Simulation controls (start/stop/reset)
  - Visual alerts and event logging

### `map.css`
- **Purpose**: Styling for map components
- **Features**:
  - Map container styling
  - Loading and error states
  - Geofence alert animations

## Usage

### Basic Map Setup
```typescript
import { initMap } from './map.lib';

// Initialize map with route simulation
const map = await initMap(containerElement);
```

### Simulation Features

#### Geofence Detection
- **5 geofences** automatically created along the route
- **Risk levels**: Low (green), Medium (orange), High (red)
- **Real-time detection** of vehicle entering/exiting zones
- **Visual alerts** with color-coded notifications

#### Controls
- **Start/Stop/Reset** simulation
- **Speed control** (0.1x to 5x)
- **Live counters** for active geofences and total events
- **Event log** showing recent geofence interactions

#### Route Data
- **GeoJSON support** for route definition
- **Fallback route** if GeoJSON loading fails
- **Automatic timestamp generation** for smooth animation

## Architecture

### Separation of Concerns
- **Map.lib.ts**: Pure map initialization and setup
- **Simulation.ts**: Self-contained simulation logic
- **Clean interfaces** between modules

### Extensibility
- **Callback system** for geofence events
- **Modular design** for easy feature additions
- **Type-safe interfaces** for all data structures

## Dependencies
- Google Maps JavaScript API
- `@googlemaps/js-api-loader`
- Custom geometry utilities
- GeoJSON parser utilities 