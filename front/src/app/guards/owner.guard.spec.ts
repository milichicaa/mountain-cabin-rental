import { TestBed } from '@angular/core/testing';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { ownerGuard } from './owner.guard';
import { AuthService } from '../services/auth.service';

// Mock verzija AuthService-a za potrebe testiranja
class MockAuthService {
  _isOwner = false;
  isOwner() { return this._isOwner; }
}

describe('ownerGuard', () => {
  let authService: MockAuthService;
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => ownerGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: AuthService, useClass: MockAuthService }]
    });
    authService = TestBed.inject(AuthService) as unknown as MockAuthService;
  });

  it('treba da dozvoli pristup ako je korisnik vlasnik', () => {
    authService._isOwner = true; // Podesimo da je korisnik vlasnik
    const canActivate = executeGuard({} as any, {} as any);
    expect(canActivate).toBe(true);
  });

  it('treba da blokira pristup i preusmeri na /login ako korisnik nije vlasnik', async () => {
    authService._isOwner = false; // Podesimo da korisnik nije vlasnik
    const canActivate = await executeGuard({} as any, {} as any) as UrlTree;
    expect(canActivate instanceof UrlTree).toBe(true);
    expect(canActivate.toString()).toBe('/login');
  });
});
