# 🏔️ Planinska Vikendica — PIA Projekat 2024/2025
Full-stack web aplikacija za iznajmljivanje planinskih vikendica u Srbiji.  
Projekat je rađen za predmet **Programiranje Internet Aplikacija (PIA)** na ETF-u.

Aplikacija omogućava rad sa tri tipa korisnika:
- **Turista**
- **Vlasnik vikendice**
- **Administrator**

Backend je razvijen u **Node.js + Express**, a frontend u **Angular 18**.  
Baza podataka: **MongoDB**.

---

## 🚀 Funkcionalnosti

### 👤 Neregistrovani korisnik
- Pregled opštih statistika (broj vikendica, korisnika, rezervacija…)
- Pretraga vikendica po nazivu i/ili mestu
- Sortiranje (naziv, mesto)
- Prijava i registracija (sa upload-om slike)

### 🧳 Turista
- Pregled i uređivanje profila
- Pretraga vikendica + detaljni prikaz sa galerijom, ocenama i mapom
- Rezervacija vikendice (više koraka)
- Pregled aktivnih rezervacija
- Otkazivanje rezervacija
- Arhiva sa mogućnošću ostavljanja komentara i ocena (1–5)

### 🏡 Vlasnik
- Uređivanje profila
- Pregled svih rezervacija za svoje vikendice + potvrda/odbijanje
- Kalendar rezervacija (FullCalendar)
- CRUD nad sopstvenim vikendicama
- Upload slika vikendice
- Dodavanje vikendice preko JSON fajla
- Statistika — bar chart + pie chart

### 🛠️ Administrator
- Rad sa korisnicima (CRUD + deaktivacija)
- Odobravanje / odbijanje zahteva za registraciju
- Pregled svih vikendica sa posebnim označavanjem loše ocenjenih
- Privremeno blokiranje vikendice (48h)

---

## 🏗️ Tehnologije

### **Frontend**
- Angular 18
- TypeScript
- Angular Material / Bootstrap / Tailwind (zavisi šta koristiš — dopiši)
- Leaflet (dinamička mapa)
- FullCalendar
- Chart.js (statistika)

### **Backend**
- Node.js + Express
- Multer (upload slika i JSON fajlova)
- bcrypt (heširanje lozinki)
- jsonwebtoken (JWT autentikacija)
- MongoDB / Mongoose

### **Baza**
- MongoDB (Atlas ili lokalno)
