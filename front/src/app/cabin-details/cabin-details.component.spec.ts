import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CabinDetailsComponent } from './cabin-details.component';

describe('CabinDetailsComponent', () => {
  let component: CabinDetailsComponent;
  let fixture: ComponentFixture<CabinDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CabinDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CabinDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
