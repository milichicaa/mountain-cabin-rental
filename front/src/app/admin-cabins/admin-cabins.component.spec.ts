import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminCabinsComponent } from './admin-cabins.component';

describe('AdminCabinsComponent', () => {
  let component: AdminCabinsComponent;
  let fixture: ComponentFixture<AdminCabinsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminCabinsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminCabinsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
