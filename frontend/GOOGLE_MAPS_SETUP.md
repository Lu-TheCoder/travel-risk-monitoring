# Google Maps Integration Setup

## Prerequisites

1. **Google Maps API Key**: You need a valid Google Maps API key with the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Geocoding API (optional)

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API (if needed)
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Configure the API Key

Update the environment files with your API key:

**Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE'
};
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  googleMapsApiKey: 'YOUR_ACTUAL_API_KEY_HERE'
};
```

### 3. Usage

The Google Maps integration is now ready to use! Here's how to use it:

#### Basic Map Component

```html
<app-map></app-map>
```

#### Using the Service Directly

```typescript
import { GoogleMapsLoaderService } from './services/google-maps-loader.service';

constructor(private mapsLoader: GoogleMapsLoaderService) {}

async loadMap() {
  const map = await this.mapsLoader.loadMap(element, {
    center: { lat: 40.7128, lng: -74.0060 },
    zoom: 12
  });
}
```

## Features

- ✅ Automatic API loading
- ✅ Environment-based configuration
- ✅ TypeScript support
- ✅ Error handling
- ✅ Places and Geometry libraries included
- ✅ Responsive design

## Troubleshooting

1. **"Google Maps API error"**: Check your API key and ensure the required APIs are enabled
2. **"Invalid API key"**: Verify the API key is correct and has proper restrictions
3. **"Billing not enabled"**: Enable billing in Google Cloud Console
4. **"Quota exceeded"**: Check your API usage limits

## Security Notes

- Always restrict your API key to specific domains
- Use environment variables for production deployments
- Monitor API usage to avoid unexpected charges 