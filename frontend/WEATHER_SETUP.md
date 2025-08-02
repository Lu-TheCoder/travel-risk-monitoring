# Weather Integration Setup

This document explains how to set up and use the weather integration feature in the travel risk monitoring application.

## Overview

The application now includes weather data integration using the OpenWeatherMap API. Weather information is displayed as custom icons on the map, showing current weather conditions at the route location.

## Setup Instructions

### 1. Get OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/)
2. Sign up for a free account
3. Navigate to your API keys section
4. Copy your API key

### 2. Configure API Keys and Map ID

Update the environment files with your API keys and Map ID:

**Development Environment** (`frontend/src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  openWeatherMapApiKey: 'YOUR_OPENWEATHERMAP_API_KEY', // Replace with your actual API key
  googleMapsMapId: 'YOUR_MAP_ID' // Required for Advanced Markers
};
```

**Production Environment** (`frontend/src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY',
  openWeatherMapApiKey: 'YOUR_OPENWEATHERMAP_API_KEY', // Replace with your actual API key
  googleMapsMapId: 'YOUR_MAP_ID' // Required for Advanced Markers
};
```

#### Getting a Map ID
1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to the Maps section
3. Create a new Map ID or use an existing one
4. The Map ID is required for Advanced Markers functionality

### 3. Features

#### Weather Icons
The application includes custom SVG weather icons for various weather conditions:
- Sunny
- Partly Cloudy
- Cloudy
- Overcast
- Light Rain
- Rain
- Heavy Rain
- Thunderstorm
- Light Snow
- Snow
- Heavy Snow
- Sleet
- Fog
- Windy
- Tornado
- Dust
- Unknown

#### Weather Information Display
When you click on a weather icon on the map, an info window displays:
- Current temperature
- Weather description
- Feels like temperature
- Humidity percentage
- Wind speed
- Atmospheric pressure

### 4. API Endpoint

The application uses the OpenWeatherMap Current Weather API (free tier):
```
https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric
```

### 5. Weather Data Location

Weather data is fetched for the first point of the route (or map center if no route is loaded). The weather marker is displayed at this location.

### 6. Customization

#### Adding New Weather Icons
1. Create a new SVG file in `frontend/public/assets/weather-icons/`
2. Update the `getCustomWeatherIcon` function in `weather.service.ts` to map weather codes to your new icon

#### Modifying Weather Display
- Edit the `createWeatherMarker` function in `map.lib.ts` to customize the info window content
- Modify the marker appearance by changing the icon properties

### 7. Error Handling

The application includes error handling for:
- API key issues
- Network failures
- Invalid coordinates
- Missing weather data

### 8. Performance Considerations

- Weather data is fetched once when the map loads
- Consider implementing caching for production use
- The free OpenWeatherMap API has rate limits (1000 calls/day)

## Troubleshooting

### Weather Icons Not Displaying
1. Check that your API key is correctly configured
2. Verify the weather icons are in the correct directory
3. Check browser console for errors
4. Ensure you have a valid Map ID configured (required for Advanced Markers)

### API Errors
1. Verify your OpenWeatherMap API key is valid
2. Check your API usage limits
3. Ensure the coordinates are valid

### Missing Weather Data
1. Check network connectivity
2. Verify the API endpoint is accessible
3. Check browser console for detailed error messages 