import { Coordinate } from '../types';

interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon';
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
  properties?: Record<string, any>;
  id?: string | number;
}

interface GeoJSON {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

export class GeoJSONLoader {
    private geojson: GeoJSON | null = null;

    constructor() {
      this.geojson = null;
    }
  
    async loadFromUrl(url: string): Promise<GeoJSON> {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch GeoJSON from ${url}`);
      this.geojson = await res.json();
      return this.geojson!;
    }
  
    async loadFromFile(file: File): Promise<GeoJSON> {
      const text = await file.text();
      this.geojson = JSON.parse(text);
      return this.geojson!;
    }
  
    getFeaturesByType(type: 'Point' | 'LineString' | 'Polygon' | 'MultiPolygon'): GeoJSONFeature[] {
      if (!this.geojson || !Array.isArray(this.geojson.features)) {
        throw new Error('GeoJSON not loaded or malformed');
      }
  
      return this.geojson.features.filter(
        (f: GeoJSONFeature) =>
          f.type === 'Feature' &&
          f.geometry?.type === type
      );
    }
  
    // Point methods
    getPoints(): Coordinate[] {
      const points = this.getFeaturesByType('Point');
      return points.map(point => {
        const coords = point.geometry.coordinates as number[];
        return { lon: coords[0], lat: coords[1] };
      });
    }
  
    getFirstPoint(): Coordinate | null {
      const points = this.getPoints();
      return points.length > 0 ? points[0] : null;
    }
  
    // LineString methods
    getLineStrings(): Coordinate[][] {
      const lines = this.getFeaturesByType('LineString');
      return lines.map(line => {
        const coords = line.geometry.coordinates as number[][];
        return coords.map(coord => ({ lon: coord[0], lat: coord[1] }));
      });
    }
  
    getFirstLineStringCoordinates(): Coordinate[] {
      const lines = this.getLineStrings();
      return lines.length > 0 ? lines[0] : [];
    }
  
    // Polygon methods
    getPolygons(): Coordinate[][][] {
      const polygons = this.getFeaturesByType('Polygon');
      return polygons.map(polygon => {
        const coords = polygon.geometry.coordinates as number[][][];
        return coords.map(ring => 
          ring.map(coord => ({ lon: coord[0], lat: coord[1] }))
        );
      });
    }
  
    getFirstPolygon(): Coordinate[][] | null {
      const polygons = this.getPolygons();
      return polygons.length > 0 ? polygons[0] : null;
    }
  
    // MultiPolygon methods
    getMultiPolygons(): Coordinate[][][][] {
      const multiPolygons = this.getFeaturesByType('MultiPolygon');
      return multiPolygons.map(multiPolygon => {
        const coords = multiPolygon.geometry.coordinates as number[][][][];
        return coords.map(polygon => 
          polygon.map(ring => 
            ring.map(coord => ({ lon: coord[0], lat: coord[1] }))
          )
        );
      });
    }
  
    // Utility methods
    getAllCoordinates(): Coordinate[][] {
      const allCoords: Coordinate[][] = [];
      
      // Add points
      allCoords.push(...this.getPoints().map(point => [point]));
      
      // Add line strings
      allCoords.push(...this.getLineStrings());
      
      // Add polygon rings
      this.getPolygons().forEach(polygon => {
        polygon.forEach(ring => allCoords.push(ring));
      });
      
      // Add multi-polygon rings
      this.getMultiPolygons().forEach(multiPolygon => {
        multiPolygon.forEach(polygon => {
          polygon.forEach(ring => allCoords.push(ring));
        });
      });
      
      return allCoords;
    }
  
    getBoundingBox(): { min: Coordinate; max: Coordinate } | null {
      const allCoords = this.getAllCoordinates().flat();
      if (allCoords.length === 0) return null;
      
      const lons = allCoords.map(coord => coord.lon);
      const lats = allCoords.map(coord => coord.lat);
      
      return {
        min: { lon: Math.min(...lons), lat: Math.min(...lats) },
        max: { lon: Math.max(...lons), lat: Math.max(...lats) }
      };
    }
  
    getFeatureCount(): { points: number; lines: number; polygons: number; multiPolygons: number } {
      return {
        points: this.getFeaturesByType('Point').length,
        lines: this.getFeaturesByType('LineString').length,
        polygons: this.getFeaturesByType('Polygon').length,
        multiPolygons: this.getFeaturesByType('MultiPolygon').length
      };
    }
  }