# Community Map Component

A dedicated map component for the community feature that allows users to mark risky locations and automatically generates 4km radius geofences.

## Features

- **Interactive Map**: Click anywhere on the map to mark a risk point
- **Automatic Geofence Generation**: Each risk point creates a 4km radius circular geofence
- **Risk Level Visualization**: Color-coded markers and geofences based on risk level
  - Green: Low Risk
  - Orange: Medium Risk  
  - Red: High Risk
- **Info Windows**: Click on markers to view detailed information
- **Location Selection**: Integrates with the community form for incident reporting

## Usage

```typescript
import { CommunityMapComponent } from './components/map/community-map/community-map';

@Component({
  imports: [CommunityMapComponent],
  template: `
    <app-community-map (locationSelected)="onLocationSelected($event)"></app-community-map>
  `
})
```

## Events

- `locationSelected`: Emitted when a user clicks on the map
  - `lat`: Latitude of selected point
  - `lng`: Longitude of selected point  
  - `locationName`: Formatted location string

## Key Differences from Main Map

- No simulation code or vehicle tracking
- No weather integration
- Focused on community risk reporting
- Simplified interface with clear instructions
- Automatic geofence generation with 4km radius

## Technical Details

- Uses Google Maps JavaScript API
- Implements Advanced Markers for better performance
- Creates circular geofences using Google Maps Circle API
- Responsive design with proper styling
- Includes debugging information (coordinates display) 