import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private apiKey = 'YOUR_OPENWEATHERMAP_API_KEY'; // Replace with actual API key
  private apiUrl = 'https://api.openweathermap.org/data/2.5/weather';
  private forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast';
  
  // Weather hazard thresholds
  private readonly HEAVY_RAIN_THRESHOLD = 10; // mm/h
  private readonly HIGH_WIND_THRESHOLD = 10.8; // m/s (approx 39 km/h)
  private readonly HAIL_CODES = [511, 611, 612, 613]; // Weather condition codes for hail
  private readonly FLOOD_CODES = [502, 503, 504]; // Heavy rain that could cause flooding

  constructor(private http: HttpClient) {}

  /**
   * Get current weather for a specific location
   */
  getCurrentWeather(lat: number, lon: number): Observable<any> {
    const url = `${this.apiUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    return this.http.get(url).pipe(
      catchError(this.handleError('getCurrentWeather', {}))
    );
  }

  /**
   * Get weather forecast for a specific location
   */
  getWeatherForecast(lat: number, lon: number): Observable<any> {
    const url = `${this.forecastUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    return this.http.get(url).pipe(
      catchError(this.handleError('getWeatherForecast', {}))
    );
  }

  /**
   * Check for weather hazards along a route
   * @param routePoints Array of {lat, lon} points along the route
   */
  checkRouteForHazards(routePoints: {lat: number, lon: number}[]): Observable<any[]> {
    // For demo purposes, we'll check weather at each point
    // In a production app, you might want to optimize this to reduce API calls
    const hazardChecks = routePoints.map(point => {
      return this.getCurrentWeather(point.lat, point.lon).pipe(
        map(weather => this.analyzeWeatherHazards(weather, point))
      );
    });
    
    // Combine all hazard checks
    return of([
      // Mock data for demonstration
      {
        location: {lat: routePoints[0].lat, lon: routePoints[0].lon},
        hazardType: 'hail',
        severity: 'high',
        description: 'Hailstorm expected in this area',
        time: new Date().toISOString()
      },
      {
        location: {lat: routePoints[Math.floor(routePoints.length/2)].lat, lon: routePoints[Math.floor(routePoints.length/2)].lon},
        hazardType: 'heavy_rain',
        severity: 'moderate',
        description: 'Heavy rainfall may cause reduced visibility',
        time: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
      }
    ]);
  }

  /**
   * Analyze weather data to identify hazards
   */
  private analyzeWeatherHazards(weatherData: any, location: {lat: number, lon: number}): any {
    if (!weatherData || !weatherData.weather) {
      return null;
    }

    const hazards = [];
    const weatherId = weatherData.weather[0].id;
    const windSpeed = weatherData.wind?.speed || 0;
    const rainVolume = weatherData.rain?.['1h'] || 0;
    
    // Check for hail
    if (this.HAIL_CODES.includes(weatherId)) {
      hazards.push({
        location,
        hazardType: 'hail',
        severity: 'high',
        description: 'Hailstorm in this area',
        time: new Date().toISOString()
      });
    }
    
    // Check for heavy rain
    if (rainVolume >= this.HEAVY_RAIN_THRESHOLD || this.FLOOD_CODES.includes(weatherId)) {
      hazards.push({
        location,
        hazardType: 'heavy_rain',
        severity: rainVolume >= this.HEAVY_RAIN_THRESHOLD * 2 ? 'high' : 'moderate',
        description: 'Heavy rainfall may cause reduced visibility and flooding',
        time: new Date().toISOString()
      });
    }
    
    // Check for high winds
    if (windSpeed >= this.HIGH_WIND_THRESHOLD) {
      hazards.push({
        location,
        hazardType: 'high_wind',
        severity: windSpeed >= this.HIGH_WIND_THRESHOLD * 1.5 ? 'high' : 'moderate',
        description: 'High winds may affect vehicle stability',
        time: new Date().toISOString()
      });
    }
    
    return hazards.length > 0 ? hazards : null;
  }

  /**
   * Calculate risk score based on weather conditions and vehicle type
   */
  calculateRiskScore(weatherData: any, vehicleType: string): number {
    if (!weatherData) return 0;
    
    let baseRisk = 0;
    
    // Weather condition risks
    const weatherId = weatherData.weather[0].id;
    const windSpeed = weatherData.wind?.speed || 0;
    const rainVolume = weatherData.rain?.['1h'] || 0;
    
    // Add risk for hail
    if (this.HAIL_CODES.includes(weatherId)) {
      baseRisk += 50;
    }
    
    // Add risk for heavy rain
    if (rainVolume > 0) {
      baseRisk += Math.min(rainVolume * 5, 40); // Cap at 40
    }
    
    // Add risk for high winds
    if (windSpeed > 0) {
      baseRisk += Math.min(windSpeed * 3, 30); // Cap at 30
    }
    
    // Vehicle type modifier
    const vehicleModifier = this.getVehicleRiskModifier(vehicleType);
    
    // Final risk score (0-100)
    return Math.min(Math.round(baseRisk * vehicleModifier), 100);
  }
  
  /**
   * Get risk modifier based on vehicle type
   */
  private getVehicleRiskModifier(vehicleType: string): number {
    switch (vehicleType.toLowerCase()) {
      case 'motorcycle':
        return 1.5; // Higher risk for motorcycles
      case 'sedan':
        return 1.0; // Base risk
      case 'suv':
        return 0.9; // Slightly lower risk
      case 'truck':
        return 0.8; // Lower risk for trucks
      default:
        return 1.0;
    }
  }

  /**
   * Error handler for HTTP requests
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      // Let the app keep running by returning an empty result
      return of(result as T);
    };
  }
}