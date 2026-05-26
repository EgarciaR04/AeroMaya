import { TestBed } from '@angular/core/testing';

import { MakeReservation } from './make-reservation';

describe('MakeReservation', () => {
  let service: MakeReservation;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MakeReservation);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
