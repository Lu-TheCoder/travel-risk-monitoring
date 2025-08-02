// GeofenceUtils.ts
export interface GeofenceProperties {
    id: string;
    name: string;
    color: string;
    opacity: number;
  }
  
  export interface GeofenceFeature {
    type: 'Feature';
    properties: GeofenceProperties;
    geometry: {
      type: 'Polygon';
      coordinates: number[][][];
    };
  }
  
  /**
   * Creates a circular geofence around a center point
   * @param center - [longitude, latitude] of the center point
   * @param radiusInDegrees - radius in degrees (approximately 0.001 = 100 meters)
   * @param properties - geofence properties
   * @param segments - number of segments to approximate the circle (default: 16)
   */
  export function createCircularGeofence(
    center: [number, number],
    radiusInDegrees: number,
    properties: GeofenceProperties,
    segments: number = 16
  ): GeofenceFeature {
    const [centerLon, centerLat] = center;
    const points: number[][] = [];
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      const lat = centerLat + radiusInDegrees * Math.cos(angle);
      const lon = centerLon + radiusInDegrees * Math.sin(angle);
      points.push([lon, lat]);
    }
    
    // Close the polygon
    points.push(points[0]);
    
    return {
      type: 'Feature',
      properties,
      geometry: {
        type: 'Polygon',
        coordinates: [points]
      }
    };
  }
  
  /**
   * Creates a rectangular geofence
   * @param southwest - [longitude, latitude] of southwest corner
   * @param northeast - [longitude, latitude] of northeast corner
   * @param properties - geofence properties
   */
  export function createRectangularGeofence(
    southwest: [number, number],
    northeast: [number, number],
    properties: GeofenceProperties
  ): GeofenceFeature {
    const [swLon, swLat] = southwest;
    const [neLon, neLat] = northeast;
    
    const coordinates = [
      [swLon, swLat], // southwest
      [neLon, swLat], // southeast
      [neLon, neLat], // northeast
      [swLon, neLat], // northwest
      [swLon, swLat]  // back to start
    ];
    
    return {
      type: 'Feature',
      properties,
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };
  }
  
  /**
   * Creates a custom polygon geofence from an array of coordinates
   * @param coordinates - array of [longitude, latitude] coordinates
   * @param properties - geofence properties
   */
  export function createPolygonGeofence(
    coordinates: number[][],
    properties: GeofenceProperties
  ): GeofenceFeature {
    // Ensure the polygon is closed
    const closedCoordinates = [...coordinates];
    if (closedCoordinates[0] !== closedCoordinates[closedCoordinates.length - 1]) {
      closedCoordinates.push(closedCoordinates[0]);
    }
    
    return {
      type: 'Feature',
      properties,
      geometry: {
        type: 'Polygon',
        coordinates: [closedCoordinates]
      }
    };
  }
  
  /**
   * Creates a geofence from GeoJSON data
   * @param geojson - GeoJSON feature or feature collection
   * @param properties - geofence properties to override
   */
  export function createGeofenceFromGeoJSON(
    geojson: any,
    properties: Partial<GeofenceProperties>
  ): GeofenceFeature[] {
    const features: GeofenceFeature[] = [];
    
    if (geojson.type === 'Feature') {
      const feature = geojson;
      if (feature.geometry.type === 'Polygon') {
        features.push({
          type: 'Feature',
          properties: {
            id: properties.id || `geofence-${Date.now()}`,
            name: properties.name || 'GeoJSON Geofence',
            color: properties.color || '#ff6600',
            opacity: properties.opacity || 0.3
          },
          geometry: feature.geometry
        });
      }
    } else if (geojson.type === 'FeatureCollection') {
      geojson.features.forEach((feature: any, index: number) => {
        if (feature.geometry.type === 'Polygon') {
          features.push({
            type: 'Feature',
            properties: {
              id: properties.id || `geofence-${index}-${Date.now()}`,
              name: properties.name || `GeoJSON Geofence ${index + 1}`,
              color: properties.color || '#ff6600',
              opacity: properties.opacity || 0.3
            },
            geometry: feature.geometry
          });
        }
      });
    }
    
    return features;
  }
  
  /**
   * Calculates the area of a geofence in square meters (approximate)
   * @param coordinates - array of [longitude, latitude] coordinates
   */
  export function calculateGeofenceArea(coordinates: number[][]): number {
    // Simple approximation using shoelace formula
    let area = 0;
    const n = coordinates.length;
    
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += coordinates[i][0] * coordinates[j][1];
      area -= coordinates[j][0] * coordinates[i][1];
    }
    
    area = Math.abs(area) / 2;
    
    // Convert to approximate square meters (very rough approximation)
    // This is a simplified conversion and may not be accurate for all locations
    return area * 111320 * 111320; // 1 degree ≈ 111,320 meters
  }
  
  /**
   * Checks if a point is inside a geofence
   * @param point - [longitude, latitude] of the point to check
   * @param coordinates - array of [longitude, latitude] coordinates defining the geofence
   */
  export function isPointInGeofence(
    point: [number, number],
    coordinates: number[][]
  ): boolean {
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = coordinates.length - 1; i < coordinates.length; j = i++) {
      const [xi, yi] = coordinates[i];
      const [xj, yj] = coordinates[j];
      
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  } 