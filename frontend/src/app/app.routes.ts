import { Routes } from '@angular/router';
import { Signup } from './pages/auth/signup/signup';
import { Login } from './pages/auth/login/login';

export const routes: Routes = [
  {
    path: 'signup',
    component: Signup,
  },
  {
    path: 'login',
    canDeactivate: [],
    component: Login,
  }
];
