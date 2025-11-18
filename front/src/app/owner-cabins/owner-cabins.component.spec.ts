import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerCabinsComponent } from './owner-cabins.component';

describe('OwnerCabinsComponent', () => {
  let component: OwnerCabinsComponent;
  let fixture: ComponentFixture<OwnerCabinsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerCabinsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerCabinsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
