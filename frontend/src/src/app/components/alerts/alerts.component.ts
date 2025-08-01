import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RiskAlertService, RiskAlert } from '../../services/risk-alert.service';

@Component({
  selector: 'app-alerts',
  templateUrl: './alerts.component.html',
  styleUrls: ['./alerts.component.css']
})
export class AlertsComponent implements OnInit {
  alerts: RiskAlert[] = [];
  filteredAlerts: RiskAlert[] = [];
  activeFilter: string = 'all';
  
  // Alert type icons mapping
  alertIcons: {[key: string]: string} = {
    hail: 'hail-icon mock-icon',
    heavy_rain: 'rain-icon mock-icon',
    flood: 'flood-icon mock-icon',
    high_wind: 'wind-icon mock-icon',
    general: 'general-icon mock-icon'
  };

  constructor(
    private riskAlertService: RiskAlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.riskAlertService.getAlerts().subscribe(alerts => {
      this.alerts = alerts;
      this.applyFilter(this.activeFilter);
    });
  }

  /**
   * Apply filter to alerts
   */
  applyFilter(filter: string): void {
    this.activeFilter = filter;
    
    switch (filter) {
      case 'high':
      case 'moderate':
      case 'low':
        this.filteredAlerts = this.alerts.filter(alert => alert.level === filter);
        break;
      case 'unacknowledged':
        this.filteredAlerts = this.alerts.filter(alert => !alert.acknowledged);
        break;
      case 'hail':
      case 'heavy_rain':
      case 'flood':
      case 'high_wind':
        this.filteredAlerts = this.alerts.filter(alert => alert.type === filter);
        break;
      case 'all':
      default:
        this.filteredAlerts = [...this.alerts];
        break;
    }
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(id: number, event: Event): void {
    event.stopPropagation();
    this.riskAlertService.acknowledgeAlert(id);
  }

  /**
   * Delete an alert
   */
  deleteAlert(id: number, event: Event): void {
    event.stopPropagation();
    this.riskAlertService.deleteAlert(id);
  }

  /**
   * Clear all alerts
   */
  clearAllAlerts(): void {
    if (confirm('Are you sure you want to clear all alerts?')) {
      this.riskAlertService.clearAlerts();
    }
  }

  /**
   * Navigate to map view for a specific alert location
   */
  viewOnMap(alert: RiskAlert): void {
    if (alert.location) {
      // In a real app, we would navigate to the map with the location as a parameter
      this.router.navigate(['/map'], { 
        queryParams: { 
          lat: alert.location.lat, 
          lng: alert.location.lng 
        } 
      });
    }
  }

  /**
   * Get the formatted date for an alert
   */
  getFormattedDate(date: Date): string {
    if (!date) return '';
    
    const now = new Date();
    const alertDate = new Date(date);
    const diffMs = now.getTime() - alertDate.getTime();
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return alertDate.toLocaleDateString();
    }
  }

  /**
   * Navigate back to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}