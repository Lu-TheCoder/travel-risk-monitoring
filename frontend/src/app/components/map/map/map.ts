// map.component.ts
import { Component, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { initMap } from './map.lib'; // adjust path if needed
import { WeatherService } from '../../../services/weather/weather.service';

@Component({
  selector: 'app-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './map.html',
  styleUrls: ['./map.css']
})
export class MapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  isLoading = true;
  error: string | null = null;

  constructor(private weatherService: WeatherService) {
    console.log('MapComponent: WeatherService injected:', !!this.weatherService);
  }

  async ngAfterViewInit() {
    try {
      this.isLoading = true;
      this.error = null;
      console.log('MapComponent: Calling initMap with weatherService:', !!this.weatherService);
      await initMap(this.mapContainer.nativeElement, this.weatherService);
      this.isLoading = false;
    } catch (err) {
      this.isLoading = false;
      this.error = err instanceof Error ? err.message : 'Failed to load map';
      console.error('Map initialization error:', err);
    }
  }
}