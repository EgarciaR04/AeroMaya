import { Routes } from '@angular/router';
import { Home } from './components/home/home/home';
import { MakeReservation } from './components/make-reservation/make-reservation/make-reservation';
import { Reservation } from './components/reservation/reservation';
import { Checkin } from './components/checkin/checkin/checkin';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'make-reservation', component: MakeReservation},
  { path: 'view-servation', component: Reservation },
  { path: 'checkin', component: Checkin },
];
