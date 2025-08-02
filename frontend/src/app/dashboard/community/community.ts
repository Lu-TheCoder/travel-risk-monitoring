import { Component } from '@angular/core';
import { MapComponent } from '../../components/map/map/map';
import { HandHeart, LucideAngularModule, LucideIconData, MessageSquareWarning} from 'lucide-angular';


type IconKey = 'HandHeart' | 'MessageSquareWarning';




@Component({
  selector: 'app-community',
  imports: [MapComponent, LucideAngularModule,],
  templateUrl: './community.html',
  styleUrl: './community.css'
})
export class Community {
  public selectedLocation: string = '';
  readonly icon: Record<IconKey, LucideIconData> = {
    HandHeart,
    MessageSquareWarning

  }


  onMapClick(event: { locationName: string }) {
    this.selectedLocation = event.locationName;
  }
}
