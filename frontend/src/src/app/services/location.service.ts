import { Injectable } from '@angular/core';
import { Observable, Subject, BehaviorSubject, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LocationService {
  private currentPosition = new BehaviorSubject<GeolocationPosition | null>(null);
  private watchId: number | null = null;
  private routeHistory: Array<{lat: number, lng: number, timestamp: number}> = [];
  private routeSubject = new Subject<Array<{lat: number, lng: number, timestamp: number}>>();
  
  // Mock route for demonstration purposes
  private mockRoute = [
    {lat: -26.2041, lng: 28.0473, timestamp: Date.now()}, // Johannesburg
    {lat: -26.1867, lng: 28.1043, timestamp: Date.now() + 300000}, // Edenvale
    {lat: -26.1742, lng: 28.1416, timestamp: Date.now() + 600000}, // Bedfordview
    {lat: -26.1522, lng: 28.1878, timestamp: Date.now() + 900000}, // Germiston
    {lat: -26.1711, lng: 28.2458, timestamp: Date.now() + 1200000} // Boksburg
  ];

  constructor() {}

  /**
   * Get the user's current position
   */
  getCurrentPosition(): Observable<GeolocationPosition> {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.currentPosition.next(position);
        },
        (error) => {
          console.error('Error getting location', error);
          // Use mock position for demo purposes
          this.provideMockPosition();
        },
        { enableHighAccuracy: true }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      // Use mock position for demo purposes
      this.provideMockPosition();
    }
    
    return this.currentPosition.asObservable().pipe(
      catchError(this.handleError<GeolocationPosition>('getCurrentPosition'))
    ) as Observable<GeolocationPosition>;
  }

  /**
   * Start tracking the user's location
   */
  startTracking(): Observable<Array<{lat: number, lng: number, timestamp: number}>> {
    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          this.currentPosition.next(position);
          this.addToRouteHistory(position);
        },
        (error) => {
          console.error('Error tracking location', error);
          // Use mock tracking for demo purposes
          this.startMockTracking();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.error('Geolocation is not supported by this browser');
      // Use mock tracking for demo purposes
      this.startMockTracking();
    }
    
    return this.routeSubject.asObservable();
  }

  /**
   * Stop tracking the user's location
   */
  stopTracking(): void {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get the user's route history
   */
  getRouteHistory(): Array<{lat: number, lng: number, timestamp: number}> {
    return this.routeHistory;
  }

  /**
   * Clear the route history
   */
  clearRouteHistory(): void {
    this.routeHistory = [];
    this.routeSubject.next(this.routeHistory);
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  }

  /**
   * Convert degrees to radians
   */
  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Add a position to the route history
   */
  private addToRouteHistory(position: GeolocationPosition): void {
    const { latitude, longitude } = position.coords;
    this.routeHistory.push({
      lat: latitude,
      lng: longitude,
      timestamp: position.timestamp
    });
    this.routeSubject.next(this.routeHistory);
  }

  /**
   * Provide a mock position for demo purposes
   */
  private provideMockPosition(): void {
    // Use Johannesburg, South Africa as default location
    const mockPosition = {
      coords: {
        latitude: -26.2041,
        longitude: 28.0473,
        accuracy: 10,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null
      },
      timestamp: Date.now()
    } as GeolocationPosition;
    
    this.currentPosition.next(mockPosition);
  }

  /**
   * Start mock tracking for demo purposes
   */
  private startMockTracking(): void {
    let index = 0;
    
    // Clear any existing route history
    this.clearRouteHistory();
    
    // Simulate movement along the mock route
    const interval = setInterval(() => {
      if (index < this.mockRoute.length) {
        const point = this.mockRoute[index];
        const mockPosition = {
          coords: {
            latitude: point.lat,
            longitude: point.lng,
            accuracy: 10,
            altitude: null,
            altitudeAccuracy: null,
            heading: null,
            speed: null
          },
          timestamp: point.timestamp
        } as GeolocationPosition;
        
        this.currentPosition.next(mockPosition);
        this.addToRouteHistory(mockPosition);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 5000); // Update every 5 seconds
  }

  /**
   * Error handler for observables
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}