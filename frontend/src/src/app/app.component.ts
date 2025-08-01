import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <div class="background-image"></div>
      <header class="app-header">
        <div class="header-content">
          <div class="logo-container">
            <div class="logo"></div>
            <h1>Travel Risk Monitoring</h1>
          </div>
          <nav>
            <ul>
              <li><a routerLink="/dashboard" routerLinkActive="active">
                <i class="fas fa-tachometer-alt"></i> Dashboard
              </a></li>
              <li><a routerLink="/map" routerLinkActive="active">
                <i class="fas fa-map-marked-alt"></i> Travel Map
              </a></li>
              <li><a routerLink="/vehicle-registration" routerLinkActive="active">
                <i class="fas fa-car"></i> My Vehicles
              </a></li>
              <li><a routerLink="/alerts" routerLinkActive="active">
                <i class="fas fa-bell"></i> Risk Alerts
              </a></li>
            </ul>
          </nav>
        </div>
      </header>
      <main>
        <router-outlet></router-outlet>
      </main>
      <footer>
        <div class="footer-content">
          <div class="footer-section">
            <h3>Travel Risk Monitoring App</h3>
            <p>Preventing Weather-Related Claims with Real-Time Alerts</p>
          </div>
          <div class="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a routerLink="/dashboard">Dashboard</a></li>
              <li><a routerLink="/map">Travel Map</a></li>
              <li><a routerLink="/vehicle-registration">My Vehicles</a></li>
              <li><a routerLink="/alerts">Risk Alerts</a></li>
            </ul>
          </div>
          <div class="footer-section">
            <h3>Contact</h3>
            <p><i class="fas fa-envelope"></i> support@travelrisk.com</p>
            <p><i class="fas fa-phone"></i> +27 123 456 789</p>
          </div>
        </div>
        <div class="copyright">
          <p>© 2023 Travel Risk Monitoring App - All Rights Reserved</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      position: relative;
      overflow-x: hidden;
    }
    
    .background-image {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/assets/images/south-africa-map.svg');
      background-size: cover;
      background-position: center;
      opacity: 0.05;
      z-index: -1;
    }
    
    .app-header {
      background: linear-gradient(135deg, #2193b0 0%, #6dd5ed 100%);
      padding: 0;
      box-shadow: 0 2px 15px rgba(0,0,0,0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
    }
    
    .logo {
      width: 40px;
      height: 40px;
      background-image: url('/assets/icons/alert.svg');
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      margin-right: 10px;
      filter: brightness(0) invert(1);
    }
    
    .app-header h1 {
      margin: 0;
      font-size: 1.5rem;
      color: white;
      font-weight: 600;
    }
    
    nav ul {
      display: flex;
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    nav li {
      margin-left: 1rem;
    }
    
    nav a {
      color: white;
      text-decoration: none;
      padding: 0.75rem 1rem;
      border-radius: 4px;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
    }
    
    nav a:hover, nav a.active {
      background-color: rgba(255,255,255,0.2);
      transform: translateY(-2px);
    }
    
    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    
    footer {
      background-color: #333;
      color: white;
      padding: 2rem 0 0 0;
      margin-top: 3rem;
    }
    
    .footer-content {
      display: flex;
      justify-content: space-between;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      flex-wrap: wrap;
    }
    
    .footer-section {
      flex: 1;
      min-width: 250px;
      margin-bottom: 2rem;
    }
    
    .footer-section h3 {
      color: white;
      margin-bottom: 1rem;
      font-size: 1.2rem;
      position: relative;
      padding-bottom: 10px;
    }
    
    .footer-section h3::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 50px;
      height: 2px;
      background-color: #2193b0;
    }
    
    .footer-section ul {
      list-style: none;
      padding: 0;
    }
    
    .footer-section li {
      margin-bottom: 0.5rem;
    }
    
    .footer-section a {
      color: #ccc;
      text-decoration: none;
      transition: color 0.3s;
    }
    
    .footer-section a:hover {
      color: #2193b0;
    }
    
    .footer-section p {
      color: #ccc;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .copyright {
      text-align: center;
      padding: 1.5rem;
      background-color: #222;
      margin-top: 2rem;
    }
    
    .copyright p {
      margin: 0;
      font-size: 0.9rem;
      color: #999;
    }
    
    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        align-items: flex-start;
      }
      
      nav {
        width: 100%;
        margin-top: 1rem;
      }
      
      nav ul {
        flex-wrap: wrap;
      }
      
      nav li {
        margin: 0.5rem 1rem 0.5rem 0;
      }
      
      .footer-content {
        flex-direction: column;
      }
      
      .footer-section {
        margin-bottom: 2rem;
      }
    }
  `]
})
export class AppComponent {
  title = 'Travel Risk Monitoring App';
}