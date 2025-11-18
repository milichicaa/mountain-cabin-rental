import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OwnerCabinCreateComponent } from './owner-cabin-create.component';

describe('OwnerCabinCreateComponent', () => {
  let component: OwnerCabinCreateComponent;
  let fixture: ComponentFixture<OwnerCabinCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerCabinCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OwnerCabinCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
