import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsOwnerComponent } from './statistics-owner.component';

describe('StatisticsOwnerComponent', () => {
  let component: StatisticsOwnerComponent;
  let fixture: ComponentFixture<StatisticsOwnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsOwnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatisticsOwnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
