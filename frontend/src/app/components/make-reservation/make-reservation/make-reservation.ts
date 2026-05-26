import { Component, signal } from '@angular/core';
import { StepFlightSelection } from '../step-flight-selection/step-flight-selection';
import { StepPassengerData } from '../step-passenger-data/step-passenger-data';
import { ReservationState } from '../../../models/reservation.models';

@Component({
  selector: 'app-make-reservation',
  imports: [StepFlightSelection, StepPassengerData],
  templateUrl: './make-reservation.html',
  styleUrl: './make-reservation.css',
})
export class MakeReservation {
  readonly currentStep = signal<1 | 2>(1);
  readonly reservationState = signal<ReservationState | null>(null);

  onContinued(state: ReservationState) {
    this.reservationState.set(state);
    this.currentStep.set(2);
  }

  onBacked() {
    this.currentStep.set(1);
  }
}
