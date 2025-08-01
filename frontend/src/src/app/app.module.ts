import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule, Routes } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { MapComponent } from './components/map/map.component';
import { VehicleRegistrationComponent } from './components/vehicle-registration/vehicle-registration.component';
import { AlertsComponent } from './components/alerts/alerts.component';

import { VehicleService } from './services/vehicle.service';
import { RiskAlertService } from './services/risk-alert.service';
import { WeatherService } from './services/weather.service';
import { LocationService } from './services/location.service';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'map', component: MapComponent },
  { path: 'vehicles', component: VehicleRegistrationComponent },
  { path: 'alerts', component: AlertsComponent },
  { path: '**', redirectTo: '/dashboard' }
];


@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    MapComponent,
    VehicleRegistrationComponent,
    AlertsComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  providers: [
    VehicleService,
    RiskAlertService,
    WeatherService,
    LocationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }