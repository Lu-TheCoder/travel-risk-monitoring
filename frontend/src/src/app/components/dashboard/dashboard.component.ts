import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { VehicleService } from '../../services/vehicle.service';
import { RiskAlertService, RiskAlert } from '../../services/risk-alert.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  registeredVehicles: any[] = [];
  riskAlerts: RiskAlert[] = [];

  constructor(
    private vehicleService: VehicleService, 
    private riskAlertService: RiskAlertService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadRegisteredVehicles();
    this.loadRiskAlerts();
  }

  loadRegisteredVehicles() {
    this.vehicleService.getVehicles().subscribe(vehicles => {
      this.registeredVehicles = vehicles;
    });
  }

  loadRiskAlerts() {
    this.riskAlertService.getAlerts().subscribe(alerts => {
      this.riskAlerts = alerts;
    });
  }

  navigateToVehicleRegistration() {
    this.router.navigate(['/vehicle-registration']);
  }

  navigateToRiskAlerts() {
    this.router.navigate(['/alerts']);
  }
  
  navigateToMap() {
    this.router.navigate(['/map']);
  }
}