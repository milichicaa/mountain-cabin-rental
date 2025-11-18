import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { touristGuard } from './tourist.guard';
import { AuthService } from '../services/auth.service';

// Mock verzija AuthService-a za potrebe testiranja
class MockAuthService {
  _isTourist = false;
  isTourist() { return this._isTourist; }
}

describe('touristGuard', () => {
  let authService: MockAuthService;
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => touristGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }]
    });
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  it('treba da dozvoli pristup ako je korisnik turista', () => {
    authService._isTourist = true; // Podesimo da je korisnik turista
    const canActivate = executeGuard({} as any, {} as any);
    expect(canActivate).toBe(true);
  });

  it('treba da blokira pristup i preusmeri na /login ako korisnik nije turista', async () => {
    authService._isTourist = false; // Podesimo da korisnik nije turista
    const canActivate = await executeGuard({} as any, {} as any) as UrlTree;
    expect(canActivate instanceof UrlTree).toBe(true);
    expect(canActivate.toString()).toBe('/login');
  });
});
