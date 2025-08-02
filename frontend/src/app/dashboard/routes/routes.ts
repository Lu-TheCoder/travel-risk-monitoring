import { Component } from '@angular/core';
import { MapComponent } from '../../components/map/map/map';
import { LucideAngularModule, TrendingUpDown } from 'lucide-angular';

@Component({
  selector: 'app-routes',
  imports: [MapComponent, LucideAngularModule],
  templateUrl: './routes.html',
  styleUrl: './routes.css'
})
export class Routes {
  readonly TrendingUpDown = TrendingUpDown;
}
