import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WeatherData {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
  };
  visibility: number;
  wind: {
    speed: number;
    deg: number;
  };
  clouds: {
    all: number;
  };
  dt: number;
  sys: {
    type: number;
    id: number;
    country: string;
    sunrise: number;
    sunset: number;
  };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

@Injectable({
  providedIn: 'root'
})
export class WeatherService {
  private readonly apiKey = environment.openWeatherMapApiKey;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5/weather';

  constructor(private http: HttpClient) {}

  getWeatherData(lat: number, lon: number): Observable<WeatherData> {
    const url = `${this.baseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    return this.http.get<WeatherData>(url);
  }

  getWeatherIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  getCustomWeatherIcon(weatherId: number): string {
    // Map OpenWeatherMap weather codes to custom icon names
    const iconMap: { [key: number]: string } = {
      // Clear sky
      800: 'sunny',
      // Clouds
      801: 'partly-cloudy',
      802: 'cloudy',
      803: 'cloudy',
      804: 'overcast',
      // Rain
      200: 'thunderstorm',
      201: 'thunderstorm',
      202: 'thunderstorm',
      210: 'thunderstorm',
      211: 'thunderstorm',
      212: 'thunderstorm',
      221: 'thunderstorm',
      230: 'thunderstorm',
      231: 'thunderstorm',
      232: 'thunderstorm',
      300: 'light-rain',
      301: 'light-rain',
      302: 'rain',
      310: 'light-rain',
      311: 'rain',
      312: 'heavy-rain',
      313: 'rain',
      314: 'heavy-rain',
      321: 'rain',
      500: 'light-rain',
      501: 'rain',
      502: 'heavy-rain',
      503: 'heavy-rain',
      504: 'heavy-rain',
      511: 'sleet',
      520: 'light-rain',
      521: 'rain',
      522: 'heavy-rain',
      531: 'heavy-rain',
      // Snow
      600: 'light-snow',
      601: 'snow',
      602: 'heavy-snow',
      611: 'sleet',
      612: 'sleet',
      613: 'sleet',
      615: 'light-snow',
      616: 'snow',
      620: 'light-snow',
      621: 'snow',
      622: 'heavy-snow',
      // Atmosphere
      701: 'fog',
      711: 'fog',
      721: 'fog',
      731: 'dust',
      741: 'fog',
      751: 'dust',
      761: 'dust',
      762: 'dust',
      771: 'windy',
      781: 'tornado',
    };

    return iconMap[weatherId] || 'unknown';
  }
} 