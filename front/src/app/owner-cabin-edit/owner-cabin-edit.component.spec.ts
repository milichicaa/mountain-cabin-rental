import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerCabinEditComponent } from './owner-cabin-edit.component';

describe('OwnerCabinEditComponent', () => {
  let component: OwnerCabinEditComponent;
  let fixture: ComponentFixture<OwnerCabinEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerCabinEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerCabinEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
