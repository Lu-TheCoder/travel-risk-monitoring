import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { WeatherService } from '../../services/weather/weather.service';
import { TripRoute, TripLocation } from './trip-planner.component';

let map: google.maps.Map;
let directionsService: google.maps.DirectionsService;
let directionsRenderer: google.maps.DirectionsRenderer;
let geocoder: google.maps.Geocoder;
let weatherService: WeatherService;

// Global variables for route management
let currentRoute: TripRoute | null = null;
let startMarker: any = null;
let endMarker: any = null;
let routePolyline: google.maps.Polyline | null = null;
let weatherMarkers: any[] = []; // Array to track weather markers

export async function initTripPlannerMap(container: HTMLElement, weatherServiceInstance: WeatherService) {
  weatherService = weatherServiceInstance;
  
  const loader = new Loader({
    apiKey: environment.googleMapsApiKey,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  await loader.importLibrary('maps');
  await loader.importLibrary('marker');
  await loader.importLibrary('places');

  const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

  // Initialize services
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    suppressMarkers: true, // We'll create custom markers
    polylineOptions: {
      strokeColor: '#4285F4',
      strokeWeight: 5,
      strokeOpacity: 0.8
    }
  });
  
  geocoder = new google.maps.Geocoder();

  // Create map centered on South Africa
  map = new Map(container, {
    center: { lat: -25.7461, lng: 28.1881 }, // Pretoria
    zoom: 8,
    mapTypeControl: false,
    mapTypeId: 'roadmap',
    mapId: environment.googleMapsMapId,
  });

  directionsRenderer.setMap(map);

  console.log('Trip planner map initialized');
  return map;
}

export async function calculateRoute(startAddress: string, endAddress: string): Promise<TripRoute | null> {
  try {
    console.log('Calculating route from', startAddress, 'to', endAddress);

    // Geocode addresses to get coordinates
    const startLocation = await geocodeAddress(startAddress);
    const endLocation = await geocodeAddress(endAddress);

    if (!startLocation || !endLocation) {
      throw new Error('Could not find coordinates for one or both addresses');
    }

    // Calculate route using Directions Service
    const request: google.maps.DirectionsRequest = {
      origin: startLocation,
      destination: endLocation,
      travelMode: google.maps.TravelMode.DRIVING,
      unitSystem: google.maps.UnitSystem.METRIC
    };

    const result = await directionsService.route(request);
    
    if (result.routes.length === 0) {
      throw new Error('No route found between the specified locations');
    }

    const route = result.routes[0];
    const leg = route.legs[0];

    // Create route object
    const tripRoute: TripRoute = {
      start: {
        address: leg.start_address,
        lat: leg.start_location.lat(),
        lng: leg.start_location.lng()
      },
      end: {
        address: leg.end_address,
        lat: leg.end_location.lat(),
        lng: leg.end_location.lng()
      },
      distance: leg.distance?.value || 0, // in meters
      duration: Math.round((leg.duration?.value || 0) / 60), // convert seconds to minutes
      path: route.overview_path
    };

    currentRoute = tripRoute;
    console.log('Route calculated:', tripRoute);

    return tripRoute;
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
}

export async function updateMapWithRoute(route: TripRoute): Promise<void> {
  try {
    console.log('Updating map with route:', route);
    
    // Clear existing markers and route
    clearMapRoute();

    // Create custom markers for start and end points
    await createRouteMarkers(route);

    // Display the route on the map
    const request: google.maps.DirectionsRequest = {
      origin: { lat: route.start.lat, lng: route.start.lng },
      destination: { lat: route.end.lat, lng: route.end.lng },
      travelMode: google.maps.TravelMode.DRIVING
    };

    const result = await directionsService.route(request);
    directionsRenderer.setDirections(result);

    // Fit map to show entire route
    const bounds = new google.maps.LatLngBounds();
    bounds.extend({ lat: route.start.lat, lng: route.start.lng });
    bounds.extend({ lat: route.end.lat, lng: route.end.lng });
    map.fitBounds(bounds);

    // Add some padding to the bounds
    const listener = google.maps.event.addListenerOnce(map, 'bounds_changed', () => {
      const currentBounds = map.getBounds();
      if (currentBounds) {
        const ne = currentBounds.getNorthEast();
        const sw = currentBounds.getSouthWest();
        const latSpan = ne.lat() - sw.lat();
        const lngSpan = ne.lng() - sw.lng();
        
        const newBounds = new google.maps.LatLngBounds(
          { lat: sw.lat() - latSpan * 0.1, lng: sw.lng() - lngSpan * 0.1 },
          { lat: ne.lat() + latSpan * 0.1, lng: ne.lng() + lngSpan * 0.1 }
        );
        map.fitBounds(newBounds);
      }
    });

    console.log('Map updated with route');
  } catch (error) {
    console.error('Error updating map with route:', error);
    throw error;
  }
}

export function clearMapRoute(): void {
  // Clear directions renderer
  directionsRenderer.setDirections({ routes: [], request: {} as google.maps.DirectionsRequest });

  // Clear custom markers
  if (startMarker) {
    startMarker.map = null;
    startMarker = null;
  }
  if (endMarker) {
    endMarker.map = null;
    endMarker = null;
  }

  // Clear weather markers
  weatherMarkers.forEach(marker => {
    if (marker) {
      marker.map = null;
    }
  });
  weatherMarkers = [];

  // Clear route polyline
  if (routePolyline) {
    routePolyline.setMap(null);
    routePolyline = null;
  }

  currentRoute = null;
  console.log('Map route cleared');
}

async function geocodeAddress(address: string): Promise<google.maps.LatLng | null> {
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        resolve(results[0].geometry.location);
      } else {
        console.error('Geocoding failed for address:', address, 'Status:', status);
        reject(new Error(`Could not find coordinates for: ${address}`));
      }
    });
  });
}

async function createRouteMarkers(route: TripRoute): Promise<void> {
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

  // Create start marker
  const startContent = document.createElement('div');
  startContent.innerHTML = `
    <div style="
      background: #4CAF50;
      border: 3px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      color: white;
      font-weight: bold;
      font-size: 14px;
    ">
      A
    </div>
  `;

  startMarker = new AdvancedMarkerElement({
    map: map,
    position: { lat: route.start.lat, lng: route.start.lng },
    content: startContent,
    title: `Start: ${route.start.address}`
  });

  // Create end marker
  const endContent = document.createElement('div');
  endContent.innerHTML = `
    <div style="
      background: #F44336;
      border: 3px solid white;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      color: white;
      font-weight: bold;
      font-size: 14px;
    ">
      B
    </div>
  `;

  endMarker = new AdvancedMarkerElement({
    map: map,
    position: { lat: route.end.lat, lng: route.end.lng },
    content: endContent,
    title: `End: ${route.end.address}`
  });

  // Add weather markers if weather service is available
  if (weatherService) {
    await addWeatherMarkers(route);
  }
}

async function addWeatherMarkers(route: TripRoute): Promise<void> {
  try {
    // Get weather data for start location
    const startWeather = await firstValueFrom(weatherService.getWeatherData(route.start.lat, route.start.lng));
    if (startWeather) {
      createWeatherMarker(route.start.lat, route.start.lng, startWeather, 'start');
    }

    // Get weather data for end location
    const endWeather = await firstValueFrom(weatherService.getWeatherData(route.end.lat, route.end.lng));
    if (endWeather) {
      createWeatherMarker(route.end.lat, route.end.lng, endWeather, 'end');
    }
  } catch (error) {
    console.error('Failed to add weather markers:', error);
  }
}

async function createWeatherMarker(lat: number, lng: number, weatherData: any, type: 'start' | 'end'): Promise<void> {
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;
  
  const weather = weatherData.weather[0];
  const customIconName = getCustomWeatherIcon(weather.id);
  const iconUrl = `/assets/weather-icons/${customIconName}.svg`;
  
  // Create custom content for the weather marker
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="weather-marker" style="
      background: white;
      border: 2px solid #4285f4;
      border-radius: 50%;
      width: 35px;
      height: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
      position: relative;
    ">
      <img src="${iconUrl}" alt="${weather.description}" style="width: 20px; height: 20px;">
      <div style="
        position: absolute;
        top: -5px;
        right: -5px;
        background: ${type === 'start' ? '#4CAF50' : '#F44336'};
        color: white;
        border-radius: 50%;
        width: 15px;
        height: 15px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
      ">
        ${type === 'start' ? 'A' : 'B'}
      </div>
    </div>
  `;

  // Add small offset to weather markers so they don't overlap with start/end markers
  const offset = type === 'start' ? 0.001 : -0.001; // Small offset in degrees
  
  const marker = new AdvancedMarkerElement({
    map: map,
    position: { lat: lat + offset, lng: lng + offset },
    content: content,
    title: `${weather.main}: ${weather.description} - ${Math.round(weatherData.main.temp)}°C`
  });

  // Add marker to tracking array
  weatherMarkers.push(marker);

  // Create info window with weather details
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Weather at ${type === 'start' ? 'Start' : 'End'}</h3>
        <div style="display: flex; align-items: center; margin-bottom: 10px;">
          <img src="${iconUrl}" alt="${weather.description}" style="width: 32px; height: 32px; margin-right: 10px;">
          <div>
            <div style="font-size: 18px; font-weight: bold;">${Math.round(weatherData.main.temp)}°C</div>
            <div style="color: #666;">${weather.description}</div>
          </div>
        </div>
        <div style="font-size: 12px; color: #666;">
          <div>Feels like: ${Math.round(weatherData.main.feels_like)}°C</div>
          <div>Humidity: ${weatherData.main.humidity}%</div>
          <div>Wind: ${weatherData.wind.speed} m/s</div>
          <div>Pressure: ${weatherData.main.pressure} hPa</div>
        </div>
      </div>
    `
  });

  // Add click listener to show info window
  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });
}

function getCustomWeatherIcon(weatherId: number): string {
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

  return iconMap[weatherId] || 'cloudy';
}

// Export functions for component use
(window as any).calculateRoute = calculateRoute;
(window as any).updateMapWithRoute = updateMapWithRoute;
(window as any).clearMapRoute = clearMapRoute;

// Autocomplete functionality
export async function initAutocomplete(inputElement: HTMLInputElement, type: 'start' | 'end'): Promise<google.maps.places.Autocomplete> {
  const { Autocomplete } = await google.maps.importLibrary('places') as google.maps.PlacesLibrary;
  
  const autocomplete = new Autocomplete(inputElement, {
    types: ['geocode'], // Restrict to addresses
    componentRestrictions: { country: 'ZA' }, // Restrict to South Africa
    fields: ['formatted_address', 'geometry', 'name'],
    strictBounds: false,
  });

  // Add event listener for place selection
  autocomplete.addListener('place_changed', () => {
    const place = autocomplete.getPlace();
    
    if (place.geometry && place.geometry.location) {
      console.log(`${type} location selected:`, place.formatted_address);
      
      // Update the input value with the formatted address
      inputElement.value = place.formatted_address || '';
      
      // Trigger change event for Angular
      const event = new Event('input', { bubbles: true });
      inputElement.dispatchEvent(event);
    } else {
      console.warn(`No geometry found for ${type} location`);
    }
  });

  return autocomplete;
} 