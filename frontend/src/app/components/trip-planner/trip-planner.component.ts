import { Component, ElementRef, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { initTripPlannerMap, calculateRoute, updateMapWithRoute, clearMapRoute, initAutocomplete, startRouteSimulation } from './trip-planner.lib';
import { WeatherService } from '../../services/weather/weather.service';

export interface TripLocation {
  address: string;
  lat: number;
  lng: number;
}

export interface TripRoute {
  start: TripLocation;
  end: TripLocation;
  distance: number;
  duration: number;
  path: google.maps.LatLng[];
}

@Component({
  selector: 'app-trip-planner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trip-planner.component.html',
  styleUrls: ['./trip-planner.component.css']
})
export class TripPlannerComponent implements OnInit, AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @ViewChild('startLocationInput', { static: true }) startLocationInput!: ElementRef;
  @ViewChild('endLocationInput', { static: true }) endLocationInput!: ElementRef;
  
  isLoading = false;
  error: string | null = null;
  
  startLocation: string = '';
  endLocation: string = '';
  
  tripRoute: TripRoute | null = null;
  isRouteCalculated = false;
  
  // Weather data for start and end locations
  startWeather: any = null;
  endWeather: any = null;
  
  // Autocomplete instances
  startAutocomplete: any = null;
  endAutocomplete: any = null;

  constructor(private weatherService: WeatherService) {}

  ngOnInit() {
    // Initialize with default locations (Pretoria area)
    this.startLocation = 'Pretoria, South Africa';
    this.endLocation = 'Johannesburg, South Africa';
  }

  async ngAfterViewInit() {
    try {
      this.isLoading = true;
      this.error = null;
      await initTripPlannerMap(this.mapContainer.nativeElement, this.weatherService);
      
      // Initialize autocomplete for both inputs
      this.startAutocomplete = await initAutocomplete(this.startLocationInput.nativeElement, 'start');
      this.endAutocomplete = await initAutocomplete(this.endLocationInput.nativeElement, 'end');
      
      this.isLoading = false;
    } catch (err) {
      this.isLoading = false;
      this.error = err instanceof Error ? err.message : 'Failed to load trip planner map';
      console.error('Trip planner map initialization error:', err);
    }
  }

  async calculateRoute() {
    if (!this.startLocation.trim() || !this.endLocation.trim()) {
      this.error = 'Please enter both start and end locations';
      return;
    }

    try {
      this.isLoading = true;
      this.error = null;
      
      // Clear previous weather data
      this.startWeather = null;
      this.endWeather = null;
      
      // This will be implemented in the trip planner library
      const route = await calculateRoute(this.startLocation, this.endLocation);
      
      if (route) {
        this.tripRoute = route;
        this.isRouteCalculated = true;
        
        // Get weather data for start and end locations
        await this.getWeatherData();
        
        // Update the map with the route
        await updateMapWithRoute(route);
      }
      
      this.isLoading = false;
    } catch (err) {
      this.isLoading = false;
      this.error = err instanceof Error ? err.message : 'Failed to calculate route';
      console.error('Route calculation error:', err);
    }
  }

  private async getWeatherData() {
    if (!this.tripRoute) return;

    try {
      // Get weather for start location
      this.startWeather = await firstValueFrom(this.weatherService.getWeatherData(
        this.tripRoute.start.lat, 
        this.tripRoute.start.lng
      ));

      // Get weather for end location
      this.endWeather = await firstValueFrom(this.weatherService.getWeatherData(
        this.tripRoute.end.lat, 
        this.tripRoute.end.lng
      ));
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  }

  clearRoute() {
    this.tripRoute = null;
    this.isRouteCalculated = false;
    this.startWeather = null;
    this.endWeather = null;
    this.error = null;
    
    // Clear the map route
    clearMapRoute();
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatDistance(meters: number): string {
    const km = meters / 1000;
    if (km >= 1) {
      return `${km.toFixed(1)} km`;
    }
    return `${meters} m`;
  }

  // Add a method to round numbers for template use
  roundNumber(value: number): number {
    return Math.round(value);
  }

  // Handle input events for autocomplete
  onStartLocationInput(event: any) {
    // This will be handled by Google Autocomplete
    console.log('Start location input:', event.target.value);
  }

  onEndLocationInput(event: any) {
    // This will be handled by Google Autocomplete
    console.log('End location input:', event.target.value);
  }

  async startSimulation() {
    try {
      await startRouteSimulation();
    } catch (error) {
      console.error('Failed to start simulation:', error);
    }
  }
} 