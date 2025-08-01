import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface RiskAlert {
  id: number;
  message: string;
  level: 'high' | 'moderate' | 'low';
  type: 'hail' | 'heavy_rain' | 'flood' | 'high_wind' | 'general';
  location?: { lat: number; lng: number };
  date: Date;
  acknowledged: boolean;
  details?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RiskAlertService {
  private alerts: RiskAlert[] = [];
  private alertsSubject = new BehaviorSubject<RiskAlert[]>([]);
  private lastId = 0;

  constructor() {
    // Initialize with some dummy data
    this.addAlert({
      message: 'Hailstorm warning on your route',
      level: 'high',
      type: 'hail',
      location: { lat: -26.1867, lng: 28.1043 },
      details: 'Large hail expected in the next 30 minutes. Consider seeking shelter.'
    });
    
    this.addAlert({
      message: 'Heavy rain ahead',
      level: 'moderate',
      type: 'heavy_rain',
      location: { lat: -26.1742, lng: 28.1416 },
      details: 'Reduced visibility and slippery roads expected.'
    });
    
    this.addAlert({
      message: 'High winds in your area',
      level: 'low',
      type: 'high_wind',
      location: { lat: -26.2041, lng: 28.0473 },
      details: 'Wind gusts up to 30km/h expected.'
    });
  }

  /**
   * Get all alerts
   */
  getAlerts(): Observable<RiskAlert[]> {
    return this.alertsSubject.asObservable();
  }

  /**
   * Get alerts by type
   */
  getAlertsByType(type: string): RiskAlert[] {
    return this.alerts.filter(alert => alert.type === type);
  }

  /**
   * Get alerts by level
   */
  getAlertsByLevel(level: 'high' | 'moderate' | 'low'): RiskAlert[] {
    return this.alerts.filter(alert => alert.level === level);
  }

  /**
   * Add a new alert
   */
  addAlert(alertData: Partial<RiskAlert>): void {
    this.lastId++;
    const newAlert: RiskAlert = {
      id: this.lastId,
      message: alertData.message || 'Risk alert',
      level: alertData.level || 'moderate',
      type: alertData.type || 'general',
      location: alertData.location,
      date: new Date(),
      acknowledged: false,
      details: alertData.details
    };
    
    this.alerts.unshift(newAlert); // Add to beginning of array
    this.alertsSubject.next([...this.alerts]);
    
    // Notify user (in a real app, this would trigger a notification)
    this.notifyUser(newAlert);
  }

  /**
   * Mark an alert as acknowledged
   */
  acknowledgeAlert(id: number): void {
    const index = this.alerts.findIndex(alert => alert.id === id);
    if (index !== -1) {
      this.alerts[index].acknowledged = true;
      this.alertsSubject.next([...this.alerts]);
    }
  }

  /**
   * Delete an alert
   */
  deleteAlert(id: number): void {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
    this.alertsSubject.next([...this.alerts]);
  }

  /**
   * Clear all alerts
   */
  clearAlerts(): void {
    this.alerts = [];
    this.alertsSubject.next([]);
  }

  /**
   * Notify user of a new alert
   */
  private notifyUser(alert: RiskAlert): void {
    // In a real app, this would trigger a push notification, sound, etc.
    console.log(`New alert: ${alert.message} (${alert.level})`);
    
    // For demo purposes, we'll just use the browser's notification API if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Travel Risk Alert', {
        body: `${alert.message} - ${alert.details}`,
        icon: 'assets/alert-icon.png'
      });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  }
}