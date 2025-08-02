import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../../../environments/environment';
import { GeoJSONLoader } from '../../../utils/parsers/GeoJson.parser';
import { RouteSimulation, RoutePoint } from './simulation';
import { WeatherService, WeatherData } from '../../../services/weather/weather.service';
import { firstValueFrom } from 'rxjs';

export async function initMap(container: HTMLElement, weatherService?: WeatherService) {
  const loader = new Loader({
    apiKey: environment.googleMapsApiKey,
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  await loader.importLibrary('maps');
  await loader.importLibrary('marker');

  const { Map } = await google.maps.importLibrary('maps') as google.maps.MapsLibrary;
  const { AdvancedMarkerElement } = await google.maps.importLibrary('marker') as google.maps.MarkerLibrary;

  // Load route from GeoJSON file
  const geoJsonLoader = new GeoJSONLoader();
  let routePoints: RoutePoint[] = [];
  let mapCenter = { lat: -25.854361, lng: 28.192019 }; // Default center
  
  try {
    const geoJson = await geoJsonLoader.loadFromUrl('/assets/map/momentum_parameter_walk.geojson');
    const lineStringCoords = geoJsonLoader.getFirstLineStringCoordinates();
    
    // Convert GeoJSON coordinates to RoutePoints with timestamps
    routePoints = lineStringCoords.map((coord, index) => ({
      lat: coord.lat,
      lng: coord.lon,
      timestamp: index * 1000, // 1 second intervals
      speed: 30 + (index * 5) // Gradually increasing speed
    }));
    
    // Set map center to first point of the route
    if (routePoints.length > 0) {
      mapCenter = { lat: routePoints[0].lat, lng: routePoints[0].lng };
    }
    
    console.log('Loaded route from GeoJSON:', routePoints.length, 'points');
  } catch (error) {
    console.error('Failed to load GeoJSON route, using fallback:', error);
    // Fallback route points (around Pretoria)
    routePoints = [
      { lat: -25.854361, lng: 28.192019, timestamp: 0, speed: 30 },
      { lat: -25.854500, lng: 28.192200, timestamp: 1000, speed: 35 },
      { lat: -25.854800, lng: 28.192500, timestamp: 2000, speed: 40 },
      { lat: -25.855100, lng: 28.192800, timestamp: 3000, speed: 45 },
      { lat: -25.855400, lng: 28.193100, timestamp: 4000, speed: 50 },
      { lat: -25.855700, lng: 28.193400, timestamp: 5000, speed: 55 },
      { lat: -25.856000, lng: 28.193700, timestamp: 6000, speed: 60 },
      { lat: -25.856300, lng: 28.194000, timestamp: 7000, speed: 65 },
      { lat: -25.856600, lng: 28.194300, timestamp: 8000, speed: 70 },
      { lat: -25.856900, lng: 28.194600, timestamp: 9000, speed: 75 }
    ];
  }

  const map = new Map(container, {
    center: mapCenter,
    zoom: 18,
    mapTypeControl: false,
    mapTypeId: 'roadmap',
    mapId: environment.googleMapsMapId, // Required for Advanced Markers
  });

  // Initialize route simulation
  const simulation = new RouteSimulation(map, container, routePoints, AdvancedMarkerElement);
  simulation.initialize();

  // Add weather functionality if weather service is provided
  console.log('Weather service provided:', !!weatherService);
  console.log('Map ID configured:', !!environment.googleMapsMapId);
  if (weatherService) {
    console.log('Adding weather markers...');
    await addWeatherMarkers(map, weatherService, routePoints, AdvancedMarkerElement);
  } else {
    console.log('No weather service provided');
  }

  // Add live center printing (For debugging purposes)
  let centerDisplay = document.createElement('div');
  centerDisplay.style.cssText = `
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 12px;
    z-index: 1000;
    pointer-events: none;
  `;
  container.appendChild(centerDisplay);

  // Function to update center display
  function updateCenterDisplay() {
    const center = map.getCenter();
    if (center) {
      centerDisplay.textContent = `Center: ${center.lat().toFixed(6)}, ${center.lng().toFixed(6)}`;
    }
  }

  // Update on map events
  map.addListener('center_changed', updateCenterDisplay);
  map.addListener('zoom_changed', updateCenterDisplay);
  map.addListener('bounds_changed', updateCenterDisplay);
  
  // Initial display
  updateCenterDisplay();

  // Also log to console for debugging
  map.addListener('center_changed', () => {
    const center = map.getCenter();
    if (center) {
      console.log('Map Center:', center.lat().toFixed(6), center.lng().toFixed(6));
    }
  });

  return map;
}

async function addWeatherMarkers(
  map: google.maps.Map,
  weatherService: WeatherService,
  routePoints: RoutePoint[],
  AdvancedMarkerElement: any
) {
  // Get weather data for the first point of the route (or center of map)
  const centerPoint = routePoints.length > 0 ? routePoints[0] : { lat: map.getCenter()?.lat() || 0, lng: map.getCenter()?.lng() || 0 };
  
  try {
    console.log('Fetching weather data for:', centerPoint.lat, centerPoint.lng);
    const weatherData = await firstValueFrom(weatherService.getWeatherData(centerPoint.lat, centerPoint.lng));
    if (weatherData) {
      console.log('Weather data received:', weatherData);
      createWeatherMarker(map, weatherData, centerPoint.lat, centerPoint.lng, AdvancedMarkerElement);
    }
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    // Create a fallback marker to test if markers work
    createTestMarker(map, centerPoint.lat, centerPoint.lng, AdvancedMarkerElement);
  }
}

function createWeatherMarker(
  map: google.maps.Map,
  weatherData: WeatherData,
  lat: number,
  lng: number,
  AdvancedMarkerElement: any
) {
  const weather = weatherData.weather[0];
  const customIconName = getCustomWeatherIcon(weather.id);
  const iconUrl = `/assets/weather-icons/${customIconName}.svg`;
  
  console.log('Creating weather marker:', {
    weather: weather,
    customIconName: customIconName,
    iconUrl: iconUrl,
    position: { lat, lng }
  });
  
  // Create custom content for the advanced marker
  const content = document.createElement('div');
  content.innerHTML = `
    <div class="weather-marker" style="
      background: white;
      border: 2px solid #4285f4;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
    ">
      <img src="${iconUrl}" alt="${weather.description}" style="width: 24px; height: 24px;">
    </div>
  `;
  
  // Create advanced marker with custom content
  const marker = new AdvancedMarkerElement({
    map: map,
    position: { lat, lng },
    content: content,
    title: `${weather.main}: ${weather.description} - ${Math.round(weatherData.main.temp)}°C`
  });

  // Create info window with weather details
  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Weather Information</h3>
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

  console.log('Weather marker created successfully');
  return marker;
}

function getCustomWeatherIcon(weatherId: number): string {
  // Map OpenWeatherMap weather codes to custom icon names
  const iconMap: { [key: number]: string } = {
    // Clear sky
    800: 'sunny',
    // Clouds
    801: 'cloudy',
    802: 'cloudy',
    803: 'cloudy',
    804: 'cloudy',
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
    300: 'rain',
    301: 'rain',
    302: 'rain',
    310: 'rain',
    311: 'rain',
    312: 'rain',
    313: 'rain',
    314: 'rain',
    321: 'rain',
    500: 'rain',
    501: 'rain',
    502: 'rain',
    503: 'rain',
    504: 'rain',
    511: 'snow',
    520: 'rain',
    521: 'rain',
    522: 'rain',
    531: 'rain',
    // Snow
    600: 'snow',
    601: 'snow',
    602: 'snow',
    611: 'snow',
    612: 'snow',
    613: 'snow',
    615: 'snow',
    616: 'snow',
    620: 'snow',
    621: 'snow',
    622: 'snow',
    // Atmosphere
    701: 'fog',
    711: 'fog',
    721: 'fog',
    731: 'fog',
    741: 'fog',
    751: 'fog',
    761: 'fog',
    762: 'fog',
    771: 'fog',
    781: 'fog',
  };

  return iconMap[weatherId] || 'cloudy';
}

function createTestMarker(map: google.maps.Map, lat: number, lng: number, AdvancedMarkerElement: any) {
  console.log('Creating test marker at:', lat, lng);
  
  // Create custom content for the test marker
  const content = document.createElement('div');
  content.innerHTML = `
    <div style="
      background: #ff6b6b;
      border: 2px solid #ff4757;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      cursor: pointer;
      color: white;
      font-weight: bold;
      font-size: 12px;
    ">
      !
    </div>
  `;
  
  const marker = new AdvancedMarkerElement({
    map: map,
    position: { lat, lng },
    content: content,
    title: 'Test Weather Marker - API Failed'
  });

  const infoWindow = new google.maps.InfoWindow({
    content: `
      <div style="padding: 10px; min-width: 200px;">
        <h3 style="margin: 0 0 10px 0; color: #333;">Test Marker</h3>
        <div style="font-size: 12px; color: #666;">
          <div>Weather API failed to load</div>
          <div>Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}</div>
          <div>This is a test marker to verify map functionality</div>
        </div>
      </div>
    `
  });

  marker.addListener('click', () => {
    infoWindow.open(map, marker);
  });

  console.log('Test marker created successfully');
  return marker;
}