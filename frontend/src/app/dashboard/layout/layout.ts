import { Component } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, OctagonAlert, Waypoints, CarFront, Gift, LucideIconData } from 'lucide-angular';
import { Logo } from '../../shared/logo/logo';

type IconKey = 'OctagonAlert' | 'Waypoints' | 'CarFront' | 'Gift';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule, Logo],
  templateUrl: './layout.html',
  styleUrl: './layout.css'
})
export class Layout {
  readonly icons: Record<IconKey, LucideIconData> = {
    OctagonAlert,
    Waypoints,
    CarFront,
    Gift
  };

  readonly navItems: { label: string; icon: IconKey; route: string; highlight?: 'red' }[] = [
    { label: 'My Risk Score', icon: 'OctagonAlert', route: '/dashboard/risk', highlight: 'red' },
    { label: 'My Route Analysis', icon: 'Waypoints', route: '/dashboard/routes' },
    { label: 'My Vehicles', icon: 'CarFront', route: '/dashboard/vehicles' },
    { label: 'My Rewards', icon: 'Gift', route: '/dashboard/rewards' },
  ];

  constructor(public router: Router) {}

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}