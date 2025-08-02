import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Vehicle } from '../../services/vehicle/vehicle';

@Component({
  selector: 'app-vehicles',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './vehicles.html',
  styleUrl: './vehicles.css'
})

export class Vehicles {
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
      this.vehicleService.createVehicle(this.vehicleForm.value).subscribe(() => { });
    } else {
      this.vehicleForm.markAllAsTouched();
    }
  }

}
