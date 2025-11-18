import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { adminGuard } from './admin.guard';
import { AuthService } from '../services/auth.service';

// Mock verzija AuthService-a za potrebe testiranja
class MockAuthService {
  _isAdmin = false;
  isAdmin() { return this._isAdmin; }
}

describe('adminGuard', () => {
  let authService: MockAuthService;
  let router: Router;

  // Helper funkcija za izvršavanje garda
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule], // Potrebno za testiranje navigacije
      providers: [
        { provide: AuthService, useClass: MockAuthService }
      ]
    });
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
    router = TestBed.inject(Router);
  });

  it('treba da dozvoli pristup ako je korisnik admin', () => {
    authService._isAdmin = true; // Podesimo da je korisnik admin
    const canActivate = executeGuard({} as any, {} as any);
    expect(canActivate).toBe(true);
  });

  it('treba da blokira pristup i preusmeri na /admin-login ako korisnik nije admin', async () => {
    authService._isAdmin = false; // Podesimo da korisnik nije admin
    const canActivate = await executeGuard({} as any, {} as any) as UrlTree;

    // Proveravamo da li je rezultat UrlTree koji vodi na /admin-login
    expect(canActivate instanceof UrlTree).toBe(true);
    expect(canActivate.toString()).toBe('/admin-login');
  });
});
