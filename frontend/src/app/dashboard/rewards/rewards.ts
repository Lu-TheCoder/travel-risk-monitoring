import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
// import { RewardsService } from './rewards.service'; // Uncomment and implement for real backend

type Badge = {
  name: string;
  icon: string;
  unlocked: boolean;
  bgClass: string;
  img?: string; // Optional image property
};

@Component({
  selector: 'app-rewards',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './rewards.html',
  styleUrl: './rewards.css',
})
export class Rewards {
  points = 3000;
  pointsMessage = 'Keep driving safe to earn more!';
  progress = 60;
  xpToNextLevel = 1200;
  canRedeem = false;
  redeemMessage = '';
  badges: Badge[] = [
    {
      name: 'Safe Driver',
      icon: 'star',
      unlocked: true,
      bgClass: 'bg-gradient-to-tr from-red-400 to-red-200',
    },
    {
      name: 'Accident-Free',
      icon: 'check',
      unlocked: false,
      bgClass: 'bg-gradient-to-tr from-red-500 to-yellow-200',
    },
    {
      name: 'Loyalty',
      icon: 'loyalty',
      unlocked: false,
      bgClass: 'bg-gradient-to-tr from-red-300 to-pink-200',
    },
    // Add more badges as needed
  ];

  // constructor(private rewardsService: RewardsService) {}

  addPoints(amount: number) {
    this.points += amount;
    this.updateProgress();
    this.pointsMessage = 'Great! You earned more XP.';
    // Optionally unlock badges
    if (this.points >= 3500 && !this.badges[1].unlocked) {
      this.badges[1].unlocked = true;
      this.pointsMessage = 'Congrats! You unlocked Accident-Free badge!';
    }
    if (this.points >= 4000 && !this.badges[2].unlocked) {
      this.badges[2].unlocked = true;
      this.pointsMessage = 'Congrats! You unlocked Loyalty badge!';
    }
    this.canRedeem = this.points >= 4000;
  }

  updateProgress() {
    // Example: Gold at 5000 XP
    const goldXP = 5000;
    this.progress = Math.min(100, Math.round((this.points / goldXP) * 100));
    this.xpToNextLevel = Math.max(0, goldXP - this.points);
  }

  redeemRewards() {
    if (this.canRedeem) {
      this.redeemMessage = 'Rewards redeemed! Enjoy your benefits.';
      this.points -= 4000;
      this.updateProgress();
      this.canRedeem = false;
      setTimeout(() => (this.redeemMessage = ''), 3000);
    }
  }
}
