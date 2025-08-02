import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private loader = new Loader({
    apiKey: environment.googleMapsApiKey || 'YOUR_API_KEY_HERE',
    version: 'weekly',
    libraries: ['places', 'geometry'],
  });

  private googlePromise: Promise<typeof google> | null = null;

  constructor() {}

  load(): Promise<typeof google> {
    // Cache the promise to avoid multiple loads
    if (this.googlePromise) {
      return this.googlePromise;
    }

    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Google Maps loading timeout')), 10000);
    });
    
    this.googlePromise = Promise.race([
      this.loader.load(),
      timeoutPromise
    ]).then((google) => {
      console.log('Google Maps loaded successfully!');
      return google;
    }).catch((error) => {
      console.error('Failed to load Google Maps:', error);
      // Reset the promise on error so we can retry
      this.googlePromise = null;
      throw error;
    });

    return this.googlePromise;
  }

  async loadMap(element: HTMLElement, options: google.maps.MapOptions): Promise<google.maps.Map> {
    try {
      console.log('Starting to load Google Maps...');
      console.log('Element:', element);
      console.log('Options:', options);
      
      // First, try to load the Google Maps API
      const google = await this.load();
      console.log('Google Maps API loaded successfully');
      console.log('Google object:', google);
      
      // Check if google.maps exists
      if (!google.maps) {
        throw new Error('Google Maps API not properly loaded - google.maps is undefined');
      }
      
      // Use the legacy approach which is more reliable
      const map = new google.maps.Map(element, options);
      console.log('Map created successfully');
      return map;
    } catch (error) {
      console.error('Error in loadMap:', error);
      throw error;
    }
  }
}