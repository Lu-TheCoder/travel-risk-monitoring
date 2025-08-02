import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Vehicle } from '../../services/vehicle/vehicle';
import { faCar } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@Component({
  selector: 'app-vehicles',
  imports: [ReactiveFormsModule, CommonModule, FontAwesomeModule],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css'
})

export class Vehicles {
  faCar = faCar
  vehicleForm: FormGroup
  vehicleService = inject(Vehicle)

  vehicles!: any[];

  constructor(private fb: FormBuilder) {

    this.vehicleService.getUserVehicles().subscribe((data) => {
      this.vehicles = data.data;
    })

    this.vehicleForm = this.fb.group({
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year: [
        '',
        [
          Validators.required,
          Validators.min(1900),
          Validators.max(new Date().getFullYear())
        ]
      ],
      type: ['', Validators.required],
    });
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.vehicleForm.valid) {
      this.vehicleService.createVehicle(this.vehicleForm.value).subscribe(() => {
        this.vehicleService.getUserVehicles().subscribe((data) => {
          this.vehicles = data.data
        })
      });
      this.vehicleForm.reset()
    } else {
      this.vehicleForm.markAllAsTouched();
    }
  }

}
