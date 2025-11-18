import { Routes } from '@angular/router';

// ⬇️ DODAJ SVE OVE IMPORTE:
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { HomeComponent } from './home/home.component';
import { ProfileComponent } from './profile/profile.component';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { CabinDetailsComponent } from './cabin-details/cabin-details.component';
import { ReservationsCreateComponent } from './reservations-create/reservations-create.component';
import { ReservationsMineComponent } from './reservations-mine/reservations-mine.component';
import { OwnerReservationsComponent } from './owner-reservations/owner-reservations.component';
import { OwnerCabinsComponent } from './owner-cabins/owner-cabins.component';
import { OwnerCabinCreateComponent } from './owner-cabin-create/owner-cabin-create.component';
import { OwnerCabinEditComponent } from './owner-cabin-edit/owner-cabin-edit.component';
import { StatisticsOwnerComponent } from './statistics-owner/statistics-owner.component';
import { AdminLoginComponent } from './admin-login/admin-login.component';
import { AdminRequestsComponent } from './admin-requests/admin-requests.component';
import { AdminUsersComponent } from './admin-users/admin-users.component';
import { AdminCabinsComponent } from './admin-cabins/admin-cabins.component';

// Guards
import { touristGuard } from './guards/tourist.guard';
import { ownerGuard } from './guards/owner.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'change-password', component: ChangePasswordComponent },

  // Turista rute
  { path: 'profile', component: ProfileComponent, canActivate: [touristGuard] },
  { path: 'cabins/:id', component: CabinDetailsComponent },
  { path: 'reservations/create/:cabinId', component: ReservationsCreateComponent, canActivate: [touristGuard] },
  { path: 'reservations/mine', component: ReservationsMineComponent, canActivate: [touristGuard] },

  // Vlasnik rute
  { path: 'owner/profile', component: ProfileComponent, canActivate: [ownerGuard] },
  { path: 'owner/reservations', component: OwnerReservationsComponent, canActivate: [ownerGuard] },
  { path: 'owner/cabins', component: OwnerCabinsComponent, canActivate: [ownerGuard] },
  { path: 'owner/cabins/create', component: OwnerCabinCreateComponent, canActivate: [ownerGuard] },
  { path: 'owner/cabins/:id/edit', component: OwnerCabinEditComponent, canActivate: [ownerGuard] },
  { path: 'owner/stats', component: StatisticsOwnerComponent, canActivate: [ownerGuard] },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/requests', component: AdminRequestsComponent, canActivate: [adminGuard] },
  { path: 'admin/users', component: AdminUsersComponent, canActivate: [adminGuard] },
  { path: 'admin/cabins', component: AdminCabinsComponent, canActivate: [adminGuard] },

  { path: '**', redirectTo: '/home' }
];
