// src/app/guards/admin.guard.ts
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

/**
 * Gard koji proverava da li je korisnik ulogovan i da li ima ulogu 'admin'.
 * Ako nije, preusmerava ga na stranicu za prijavu.
 */
export const adminGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Proveravam da li je korisnik već na stranici za prijavu.
  // Ako jeste, dozvoljavam pristup bez daljih provera.
  if (state.url === '/admin/login') {
    return true;
  }

  if (auth.isLoggedIn() && auth.getRole() === 'admin') {
    return true; // Korisnik je ulogovan kao admin, dozvoli pristup.
  } else {
    // Korisnik nije ulogovan kao admin, preusmeri ga na stranicu za prijavu.
    router.navigate(['/admin/login']);
    return false;
  }
};
