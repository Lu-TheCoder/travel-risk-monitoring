import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CommunityMapComponent, RiskPoint } from '../../components/map/community-map/community-map';
import { HandHeart, LucideAngularModule, LucideIconData, MessageSquareWarning} from 'lucide-angular';
import { FormsModule } from '@angular/forms';

type IconKey = 'HandHeart' | 'MessageSquareWarning';

@Component({
  selector: 'app-community',
  imports: [CommonModule, CommunityMapComponent, LucideAngularModule, FormsModule],
  templateUrl: './community.html',
  styleUrl: './community.css'
})
export class Community {
  public selectedLocation: string = '';
  public selectedLat: number = 0;
  public selectedLng: number = 0;
  public riskPoints: RiskPoint[] = [];
  public formData = {
    title: '',
    description: '',
    riskLevel: ''
  };
  public isSubmitting = false;
  public submitMessage = '';
  @ViewChild(CommunityMapComponent) communityMap!: CommunityMapComponent;

  readonly icon: Record<IconKey, LucideIconData> = {
    HandHeart,
    MessageSquareWarning
  }

  onMapClick(event: { lat: number; lng: number; locationName: string }) {
    this.selectedLocation = event.locationName;
    this.selectedLat = event.lat;
    this.selectedLng = event.lng;
  }

  onRiskPointsChange(points: RiskPoint[]) {
    this.riskPoints = points;
    this.updateLocationField();
    console.log('Risk points updated:', points.length, 'points');
  }

  updateLocationField() {
    if (this.riskPoints.length === 0) {
      this.selectedLocation = '';
      this.selectedLat = 0;
      this.selectedLng = 0;
    } else if (this.riskPoints.length === 1) {
      const point = this.riskPoints[0];
      this.selectedLocation = `${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`;
      this.selectedLat = point.lat;
      this.selectedLng = point.lng;
    } else {
      this.selectedLocation = `${this.riskPoints.length} locations selected`;
      // Set to the last selected point
      const lastPoint = this.riskPoints[this.riskPoints.length - 1];
      this.selectedLat = lastPoint.lat;
      this.selectedLng = lastPoint.lng;
    }
  }

  async onSubmit(event: Event) {
    event.preventDefault();
    
    if (this.riskPoints.length === 0) {
      this.submitMessage = 'Please mark at least one location on the map';
      return;
    }

    if (!this.formData.title || !this.formData.description || !this.formData.riskLevel) {
      this.submitMessage = 'Please fill in all required fields';
      return;
    }

    this.isSubmitting = true;
    this.submitMessage = '';

    try {
      // Simulate API request
      await this.simulateSubmit();
      
      this.submitMessage = 'Incident reported successfully!';
      this.resetForm();
    } catch (error) {
      this.submitMessage = 'Failed to submit incident. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private async simulateSubmit(): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const incidentData = {
      title: this.formData.title,
      description: this.formData.description,
      riskLevel: this.formData.riskLevel,
      locations: this.riskPoints.map(point => ({
        lat: point.lat,
        lng: point.lng,
        title: point.title,
        description: point.description,
        riskLevel: point.riskLevel
      })),
      timestamp: new Date().toISOString()
    };

    console.log('Submitting incident:', incidentData);
    
    // Simulate random success/failure
    if (Math.random() > 0.1) { // 90% success rate
      return Promise.resolve();
    } else {
      return Promise.reject(new Error('Simulated API error'));
    }
  }

  private resetForm() {
    this.formData = {
      title: '',
      description: '',
      riskLevel: ''
    };
    this.selectedLocation = '';
    this.selectedLat = 0;
    this.selectedLng = 0;
    this.riskPoints = [];
  }

  // Method to clear all risk points (can be called from template)
  clearAllPoints() {
    this.riskPoints = [];
    this.updateLocationField();
    // Also clear from map
    if (this.communityMap) {
      this.communityMap.clearAllPoints();
    }
  }
}
