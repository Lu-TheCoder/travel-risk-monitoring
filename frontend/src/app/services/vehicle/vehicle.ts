import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class Vehicle {

  private http = inject(HttpClient);

  createVehicle(vehicle: any): Observable<any> {
    return this.http.post("http://localhost:3000/api/vehicles/", vehicle)
  }

  getUserVehicles(): Observable<any> {
    return this.http.get("http://localhost:3000/api/vehicles/")
  }
}
