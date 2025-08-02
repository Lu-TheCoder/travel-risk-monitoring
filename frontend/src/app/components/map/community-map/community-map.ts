import { Component, ElementRef, ViewChild, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { initCommunityMap } from './community-map.lib';

export interface RiskPoint {
  id: string;
  lat: number;
  lng: number;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high';
  timestamp: Date;
  geofence?: google.maps.Circle;
}

@Component({
  selector: 'app-community-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './community-map.html',
  styleUrls: ['./community-map.css']
})
export class CommunityMapComponent implements AfterViewInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  @Output() locationSelected = new EventEmitter<{ lat: number; lng: number; locationName: string }>();
  @Output() riskPointsChange = new EventEmitter<RiskPoint[]>();
  
  isLoading = true;
  error: string | null = null;
  selectedRiskPoint: RiskPoint | null = null;
  private clearAllPointsFunction: (() => void) | null = null;

  async ngAfterViewInit() {
    try {
      this.isLoading = true;
      this.error = null;
      const { clearAllPoints } = await initCommunityMap(
        this.mapContainer.nativeElement, 
        this.locationSelected, 
        this.riskPointsChange
      );
      this.clearAllPointsFunction = clearAllPoints;
      this.isLoading = false;
    } catch (err) {
      this.isLoading = false;
      this.error = err instanceof Error ? err.message : 'Failed to load map';
      console.error('Community map initialization error:', err);
    }
  }

  // Method to clear all points from map
  clearAllPoints() {
    if (this.clearAllPointsFunction) {
      this.clearAllPointsFunction();
    }
  }
} 