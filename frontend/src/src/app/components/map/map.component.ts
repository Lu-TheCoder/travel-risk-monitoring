import { Component, OnInit, AfterViewInit } from '@angular/core';
import { LocationService } from '../../services/location.service';
import { WeatherService } from '../../services/weather.service';
import { RiskAlertService } from '../../services/risk-alert.service';

declare const L: any; // Leaflet maps

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit, AfterViewInit {
  private map: any;
  private routeLayer: any;
  private hazardMarkers: any[] = [];
  private currentPositionMarker: any;
  
  // South Africa bounds
  private readonly SA_BOUNDS = [
    [-34.83, 16.47], // Southwest
    [-22.13, 32.89]  // Northeast
  ];
  
  // Weather hazard icons
  private readonly HAZARD_ICONS = {
    hail: L.icon({
      iconUrl: 'assets/icons/hail.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    }),
    heavy_rain: L.icon({
      iconUrl: 'assets/icons/heavy-rain.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    }),
    flood: L.icon({
      iconUrl: 'assets/icons/flood.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    }),
    high_wind: L.icon({
      iconUrl: 'assets/icons/wind.svg',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -16]
    })
  };
  
  // Risk level colors
  private readonly RISK_COLORS = {
    high: '#ff3b30',
    moderate: '#ff9500',
    low: '#34c759'
  };

  constructor(
    private locationService: LocationService,
    private weatherService: WeatherService,
    private riskAlertService: RiskAlertService
  ) {}

  ngOnInit(): void {
    // Initialize map when component loads
  }

  ngAfterViewInit(): void {
    this.initMap();
    this.startLocationTracking();
    this.simulateRoute(); // For demo purposes
  }

  /**
   * Initialize the map
   */
  private initMap(): void {
    // Create map centered on South Africa
    this.map = L.map('map').fitBounds(this.SA_BOUNDS);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18
    }).addTo(this.map);
    
    // Add route layer
    this.routeLayer = L.layerGroup().addTo(this.map);
  }

  /**
   * Start tracking user location
   */
  private startLocationTracking(): void {
    this.locationService.startTracking().subscribe(routeHistory => {
      this.updateRouteOnMap(routeHistory);
      
      // Check for weather hazards along the route
      if (routeHistory.length > 0) {
        const routePoints = routeHistory.map(point => ({
          lat: point.lat,
          lon: point.lng
        }));
        
        this.checkRouteForHazards(routePoints);
      }
    });
  }

  /**
   * Update the route display on the map
   */
  private updateRouteOnMap(routeHistory: Array<{lat: number, lng: number, timestamp: number}>): void {
    // Clear existing route
    this.routeLayer.clearLayers();
    
    if (routeHistory.length < 2) {
      return; // Need at least 2 points to draw a route
    }
    
    // Create route line
    const routePoints = routeHistory.map(point => [point.lat, point.lng]);
    const routeLine = L.polyline(routePoints, {
      color: '#2193b0',
      weight: 5,
      opacity: 0.7
    }).addTo(this.routeLayer);
    
    // Update current position marker
    const currentPosition = routeHistory[routeHistory.length - 1];
    
    if (this.currentPositionMarker) {
      this.currentPositionMarker.setLatLng([currentPosition.lat, currentPosition.lng]);
    } else {
      this.currentPositionMarker = L.marker([currentPosition.lat, currentPosition.lng], {
        icon: L.divIcon({
          className: 'current-position-marker',
          html: '<div class="pulse"></div>',
          iconSize: [20, 20],
          iconAnchor: [10, 10]
        })
      }).addTo(this.map);
    }
    
    // Center map on current position
    this.map.panTo([currentPosition.lat, currentPosition.lng]);
  }

  /**
   * Check for weather hazards along the route
   */
  private checkRouteForHazards(routePoints: {lat: number, lon: number}[]): void {
    this.weatherService.checkRouteForHazards(routePoints).subscribe(hazards => {
      // Clear existing hazard markers
      this.clearHazardMarkers();
      
      // Add new hazard markers
      hazards.forEach(hazard => {
        this.addHazardMarker(hazard);
        
        // Create risk alert for high severity hazards
        if (hazard.severity === 'high') {
          this.riskAlertService.addAlert({
            message: `${this.getHazardName(hazard.hazardType)} warning on your route`,
            level: hazard.severity,
            type: hazard.hazardType,
            location: { lat: hazard.location.lat, lng: hazard.location.lon },
            details: hazard.description
          });
        }
      });
    });
  }

  /**
   * Add a hazard marker to the map
   */
  private addHazardMarker(hazard: any): void {
    const icon = this.HAZARD_ICONS[hazard.hazardType] || this.HAZARD_ICONS.heavy_rain;
    
    const marker = L.marker([hazard.location.lat, hazard.location.lon], {
      icon: icon
    }).addTo(this.map);
    
    // Add popup with hazard information
    marker.bindPopup(`
      <div class="hazard-popup">
        <h3>${this.getHazardName(hazard.hazardType)}</h3>
        <p class="severity severity-${hazard.severity}">Severity: ${hazard.severity}</p>
        <p>${hazard.description}</p>
        <p>Expected: ${new Date(hazard.time).toLocaleTimeString()}</p>
      </div>
    `);
    
    this.hazardMarkers.push(marker);
  }

  /**
   * Clear all hazard markers from the map
   */
  private clearHazardMarkers(): void {
    this.hazardMarkers.forEach(marker => {
      this.map.removeLayer(marker);
    });
    this.hazardMarkers = [];
  }

  /**
   * Get a human-readable name for a hazard type
   */
  private getHazardName(hazardType: string): string {
    const hazardNames: {[key: string]: string} = {
      hail: 'Hailstorm',
      heavy_rain: 'Heavy Rain',
      flood: 'Flooding',
      high_wind: 'High Winds'
    };
    
    return hazardNames[hazardType] || 'Weather Hazard';
  }

  /**
   * Simulate a route for demonstration purposes
   */
  private simulateRoute(): void {
    // This is just for demo purposes
    // In a real app, we would use the actual user's location
    console.log('Simulating route for demonstration');
  }
}