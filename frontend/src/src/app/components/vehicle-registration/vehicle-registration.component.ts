import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { VehicleService } from '../../services/vehicle.service';

@Component({
  selector: 'app-vehicle-registration',
  templateUrl: './vehicle-registration.component.html',
  styleUrls: ['./vehicle-registration.component.css']
})
export class VehicleRegistrationComponent implements OnInit {
  vehicleForm: FormGroup;
  registeredVehicles: any[] = [];
  isEditMode = false;
  currentVehicleId: number | null = null;
  
  vehicleTypes = [
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'truck', label: 'Truck' },
    { value: 'motorcycle', label: 'Motorcycle' }
  ];
  
  vulnerabilities = this.vehicleService.getVulnerabilityTypes();

  constructor(
    private formBuilder: FormBuilder,
    private vehicleService: VehicleService,
    private router: Router
  ) {
    this.vehicleForm = this.formBuilder.group({
      name: ['', Validators.required],
      licensePlate: ['', Validators.required],
      type: ['sedan', Validators.required],
      year: ['', [Validators.required, Validators.min(1900), Validators.max(new Date().getFullYear())]],
      color: [''],
      vulnerabilities: [[]]
    });
  }

  ngOnInit(): void {
    this.loadVehicles();
  }

  /**
   * Load registered vehicles
   */
  loadVehicles(): void {
    this.vehicleService.getVehicles().subscribe(vehicles => {
      this.registeredVehicles = vehicles;
    });
  }

  /**
   * Submit the vehicle form
   */
  onSubmit(): void {
    if (this.vehicleForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.vehicleForm.controls).forEach(key => {
        const control = this.vehicleForm.get(key);
        control?.markAsTouched();
      });
      return;
    }
    
    const vehicleData = this.vehicleForm.value;
    
    if (this.isEditMode && this.currentVehicleId !== null) {
      // Update existing vehicle
      this.vehicleService.updateVehicle({
        ...vehicleData,
        id: this.currentVehicleId
      });
    } else {
      // Add new vehicle
      this.vehicleService.addVehicle(vehicleData);
    }
    
    // Reset form and reload vehicles
    this.resetForm();
    this.loadVehicles();
  }

  /**
   * Edit a vehicle
   */
  editVehicle(vehicle: any): void {
    this.isEditMode = true;
    this.currentVehicleId = vehicle.id;
    
    this.vehicleForm.patchValue({
      name: vehicle.name,
      licensePlate: vehicle.licensePlate,
      type: vehicle.type,
      year: vehicle.year,
      color: vehicle.color,
      vulnerabilities: vehicle.vulnerabilities || []
    });
  }

  /**
   * Delete a vehicle
   */
  deleteVehicle(id: number): void {
    if (confirm('Are you sure you want to delete this vehicle?')) {
      this.vehicleService.deleteVehicle(id);
      this.loadVehicles();
    }
  }

  /**
   * Reset the form
   */
  resetForm(): void {
    this.vehicleForm.reset({
      type: 'sedan',
      vulnerabilities: []
    });
    this.isEditMode = false;
    this.currentVehicleId = null;
  }

  /**
   * Navigate back to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Check if a form control is invalid and touched
   */
  isInvalidAndTouched(controlName: string): boolean {
    const control = this.vehicleForm.get(controlName);
    return control ? control.invalid && control.touched : false;
  }

  /**
   * Toggle a vulnerability selection
   */
  toggleVulnerability(vulnerability: string): void {
    const vulnerabilities = [...this.vehicleForm.get('vulnerabilities')?.value || []];
    const index = vulnerabilities.indexOf(vulnerability);
    
    if (index === -1) {
      vulnerabilities.push(vulnerability);
    } else {
      vulnerabilities.splice(index, 1);
    }
    
    this.vehicleForm.get('vulnerabilities')?.setValue(vulnerabilities);
  }

  /**
   * Check if a vulnerability is selected
   */
  isVulnerabilitySelected(vulnerability: string): boolean {
    const vulnerabilities = this.vehicleForm.get('vulnerabilities')?.value || [];
    return vulnerabilities.includes(vulnerability);
  }
}