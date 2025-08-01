import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Vehicle {
  id: number;
  name: string;
  licensePlate: string;
  type: string;
  year: number;
  color: string;
  vulnerabilities?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private vehiclesSubject = new BehaviorSubject<Vehicle[]>([
    { 
      id: 1, 
      name: 'Family Sedan', 
      licensePlate: 'CA-123-456', 
      type: 'sedan', 
      year: 2019, 
      color: 'Silver',
      vulnerabilities: ['hail']
    },
    { 
      id: 2, 
      name: 'Work SUV', 
      licensePlate: 'WP-789-012', 
      type: 'suv', 
      year: 2021, 
      color: 'Black',
      vulnerabilities: ['flood']
    },
    { 
      id: 3, 
      name: 'Weekend Truck', 
      licensePlate: 'GP-345-678', 
      type: 'truck', 
      year: 2020, 
      color: 'Blue',
      vulnerabilities: ['wind']
    }
  ]);

  getVehicles(): Observable<Vehicle[]> {
    return this.vehiclesSubject.asObservable();
  }

  getVehicleById(id: number): Observable<Vehicle | undefined> {
    return new Observable(observer => {
      const vehicles = this.vehiclesSubject.getValue();
      const vehicle = vehicles.find(v => v.id === id);
      observer.next(vehicle);
      observer.complete();
    });
  }

  addVehicle(vehicle: Omit<Vehicle, 'id'>): void {
    const currentVehicles = this.vehiclesSubject.getValue();
    const newId = currentVehicles.length > 0 
      ? Math.max(...currentVehicles.map(v => v.id)) + 1 
      : 1;
    
    const newVehicle = {
      ...vehicle,
      id: newId
    };
    
    this.vehiclesSubject.next([...currentVehicles, newVehicle as Vehicle]);
  }

  updateVehicle(updatedVehicle: Vehicle): void {
    const currentVehicles = this.vehiclesSubject.getValue();
    const index = currentVehicles.findIndex(v => v.id === updatedVehicle.id);
    
    if (index !== -1) {
      const updatedVehicles = [...currentVehicles];
      updatedVehicles[index] = updatedVehicle;
      this.vehiclesSubject.next(updatedVehicles);
    }
  }

  deleteVehicle(id: number): void {
    const currentVehicles = this.vehiclesSubject.getValue();
    const updatedVehicles = currentVehicles.filter(v => v.id !== id);
    this.vehiclesSubject.next(updatedVehicles);
  }

  getVehicleTypes(): string[] {
    return ['sedan', 'suv', 'hatchback', 'truck', 'motorcycle'];
  }

  getVulnerabilityTypes(): {value: string, label: string}[] {
    return [
      { value: 'hail', label: 'Hail Damage' },
      { value: 'flood', label: 'Flooding' },
      { value: 'wind', label: 'High Winds' }
    ];
  }
}