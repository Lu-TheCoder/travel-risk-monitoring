import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-logo',
  imports: [CommonModule],
  templateUrl: './logo.html',
  styleUrl: './logo.css'
})
export class Logo {
  @Input() collapsed = false;
}
