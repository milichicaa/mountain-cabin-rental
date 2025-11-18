import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReservationsMineComponent } from './reservations-mine.component';

describe('ReservationsMineComponent', () => {
  let component: ReservationsMineComponent;
  let fixture: ComponentFixture<ReservationsMineComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReservationsMineComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReservationsMineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
