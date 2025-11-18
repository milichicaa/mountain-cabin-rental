import { TestBed } from '@angular/core/testing';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { authInterceptor } from './auth.interceptor'; // Importujemo funkcionalni interceptor

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpTestingController: HttpTestingController;
  const testUrl = '/api/data';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useValue: authInterceptor, // Koristimo useValue za funkciju
          multi: true,
        },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Proveravamo da nema zaostalih, neobrađenih zahteva
    httpTestingController.verify();
    // Čistimo localStorage posle svakog testa
    localStorage.removeItem('token');
  });

  it('treba da doda Authorization header ako token postoji u localStorage', () => {
    const testToken = 'my-secret-token';
    localStorage.setItem('token', testToken);

    // Pravimo HTTP poziv
    http.get(testUrl).subscribe();

    // Očekujemo da je napravljen jedan zahtev na testUrl
    const req = httpTestingController.expectOne(testUrl);

    // Proveravamo da li header postoji i da li ima ispravnu vrednost
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);

    // Odgovaramo na zahtev da bi se subscribe završio
    req.flush({});
  });

  it('ne treba da doda Authorization header ako token ne postoji', () => {
    // Pravimo HTTP poziv (token ne postoji)
    http.get(testUrl).subscribe();

    const req = httpTestingController.expectOne(testUrl);

    // Proveravamo da header NE postoji
    expect(req.request.headers.has('Authorization')).toBe(false);

    req.flush({});
  });
});
