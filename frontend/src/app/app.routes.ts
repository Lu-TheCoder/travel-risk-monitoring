import { Routes } from '@angular/router';
import { Layout } from './dashboard/layout/layout';
import { Home } from './dashboard/home/home';
import { Risk } from './dashboard/risk/risk';
import { Routes as RoutesComponent } from './dashboard/routes/routes';
import { Vehicles } from './dashboard/vehicles/vehicles';
import { Rewards } from './dashboard/rewards/rewards';
import { Signup } from './pages/auth/signup/signup';
import { Login } from './pages/auth/login/login';
import { TripPlannerComponent } from './components/trip-planner/trip-planner.component';
import { Community } from './dashboard/community/community';



export const routes: Routes = [

    {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full"
    },
    {
        path: "dashboard",
        component: Layout,
        children: [
            {
                path: "",
                component: Home
            },
            {
                path: "risk",
                component: Risk
            },
            {
                path: "routes",
                component: RoutesComponent
            },
            {
                path: "vehicles",
                component: Vehicles
            },
            {
                path: "rewards",
                component: Rewards
            },
            {

                path: 'trip-planner',
                component: TripPlannerComponent,

            },
            {
                path: 'community',
                component: Community

            }
        ]
    },
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