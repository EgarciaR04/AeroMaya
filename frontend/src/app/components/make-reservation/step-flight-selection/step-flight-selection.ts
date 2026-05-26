import { Component, computed, output, signal } from '@angular/core';
import { Airport, Flight, ReservationState } from '../../../models/reservation.models';

@Component({
  selector: 'app-step-flight-selection',
  imports: [],
  templateUrl: './step-flight-selection.html',
  styleUrl: './step-flight-selection.css',
})
export class StepFlightSelection {
  readonly continued = output<ReservationState>();

  readonly airports: Airport[] = [
    { code: 'SDQ', label: 'Santo Domingo (SDQ)' },
    { code: 'MIA', label: 'Miami (MIA)' },
    { code: 'JFK', label: 'New York (JFK)' },
    { code: 'LAX', label: 'Los Angeles (LAX)' },
  ];

  readonly flights: Flight[] = [
    { id: 'SK7673', time: '06:30', price: 341, seats: 16 },
    { id: 'SK4280', time: '09:15', price: 327, seats: 12 },
    { id: 'SK7090', time: '12:00', price: 299, seats: 3 },
    { id: 'SK1275', time: '15:45', price: 219, seats: 37 },
    { id: 'SK4679', time: '18:20', price: 185, seats: 11 },
    { id: 'SK2175', time: '21:10', price: 358, seats: 31 },
  ];

  origin = signal('SDQ');
  destination = signal('MIA');
  passengers = signal(1);
  selectedFlightId = signal('SK7673');

  selectedFlight = computed(() => this.flights.find(f => f.id === this.selectedFlightId())!);
  originAirport = computed(() => this.airports.find(a => a.code === this.origin())!);
  destinationAirport = computed(() => this.airports.find(a => a.code === this.destination())!);

  onOriginChange(event: Event) {
    this.origin.set((event.target as HTMLSelectElement).value);
  }

  onDestinationChange(event: Event) {
    this.destination.set((event.target as HTMLSelectElement).value);
  }

  decreasePassengers() {
    if (this.passengers() > 1) this.passengers.update(n => n - 1);
  }

  increasePassengers() {
    this.passengers.update(n => n + 1);
  }

  selectFlight(id: string) {
    this.selectedFlightId.set(id);
  }

  continue() {
    this.continued.emit({
      origin: this.originAirport(),
      destination: this.destinationAirport(),
      passengers: this.passengers(),
      flight: this.selectedFlight(),
      flightDate: 'lunes, 25 de mayo',
    });
  }
}
