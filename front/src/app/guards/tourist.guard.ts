import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Gard koji proverava da li je korisnik ulogovan i da li ima ulogu 'tourist'.
 * Ako nije, preusmerava ga na stranicu za prijavu.
 */
export const touristGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isTourist()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
