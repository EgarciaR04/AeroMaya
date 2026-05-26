import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MakeReservation } from './make-reservation';

describe('MakeReservation', () => {
  let component: MakeReservation;
  let fixture: ComponentFixture<MakeReservation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MakeReservation]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MakeReservation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
