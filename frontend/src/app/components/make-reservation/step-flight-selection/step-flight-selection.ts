import { Component, OnInit, computed, inject, output, signal } from '@angular/core';
import { Airport, Flight, ReservationState } from '../../../models/reservation.models';
import { ReservationService } from '../../../services/make-reservation/make-reservation';

@Component({
  selector: 'app-step-flight-selection',
  imports: [],
  templateUrl: './step-flight-selection.html',
  styleUrl: './step-flight-selection.css',
})
export class StepFlightSelection implements OnInit {
  private svc = inject(ReservationService);

  readonly continued = output<ReservationState>();

  airports = signal<Airport[]>([]);
  destinations = signal<Airport[]>([]);
  flights = signal<Flight[]>([]);

  origin = signal('');
  destination = signal('');
  passengers = signal(1);
  selectedHorarioId = signal<number | null>(null);
  selectedDate = signal(this.todayIso());

  loading = signal(false);
  error = signal('');

  readonly minDate = this.todayIso();
  readonly maxDate = this.plusMonths(24);

  selectedFlight = computed(() =>
    this.flights().find(f => f.horarioId === this.selectedHorarioId()) ?? null
  );
  originAirport = computed(() =>
    this.airports().find(a => a.code === this.origin()) ?? null
  );
  destinationAirport = computed(() =>
    this.destinations().find(a => a.code === this.destination()) ?? null
  );
  formattedDate = computed(() => {
    const d = new Date(this.selectedDate() + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  });

  ngOnInit() {
    this.svc.getAeropuertos().subscribe({
      next: airports => {
        this.airports.set(airports);
        if (airports.length > 0) {
          this.origin.set(airports[0].code);
          this.loadDestinations(airports[0].code);
        }
      },
      error: () => this.error.set('No se pudieron cargar los aeropuertos.'),
    });
  }

  private loadDestinations(codigo: string) {
    this.svc.getDestinos(codigo).subscribe({
      next: dests => {
        this.destinations.set(dests);
        if (dests.length > 0) {
          this.destination.set(dests[0].code);
          this.loadFlights();
        } else {
          this.destination.set('');
          this.flights.set([]);
        }
      },
      error: () => this.error.set('No se pudieron cargar los destinos.'),
    });
  }

  private loadFlights() {
    const o = this.origin();
    const d = this.destination();
    const f = this.selectedDate();
    if (!o || !d || !f) return;

    this.loading.set(true);
    this.error.set('');
    this.svc.getHorarios(o, d, f).subscribe({
      next: flights => {
        this.flights.set(flights);
        this.selectedHorarioId.set(flights[0]?.horarioId ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.flights.set([]);
        this.selectedHorarioId.set(null);
        this.error.set('No hay vuelos disponibles para esta fecha.');
        this.loading.set(false);
      },
    });
  }

  onOriginChange(event: Event) {
    const code = (event.target as HTMLSelectElement).value;
    this.origin.set(code);
    this.loadDestinations(code);
  }

  onDestinationChange(event: Event) {
    this.destination.set((event.target as HTMLSelectElement).value);
    this.loadFlights();
  }

  onDateChange(event: Event) {
    this.selectedDate.set((event.target as HTMLInputElement).value);
    this.loadFlights();
  }

  decreasePassengers() {
    if (this.passengers() > 1) this.passengers.update(n => n - 1);
  }

  increasePassengers() {
    this.passengers.update(n => n + 1);
  }

  selectFlight(horarioId: number) {
    this.selectedHorarioId.set(horarioId);
  }

  continue() {
    const flight = this.selectedFlight();
    const origin = this.originAirport();
    const destination = this.destinationAirport();
    if (!flight || !origin || !destination) return;

    this.continued.emit({
      origin,
      destination,
      passengers: this.passengers(),
      flight,
      flightDate: this.formattedDate(),
      flightDateIso: this.selectedDate(),
    });
  }

  private todayIso(): string {
    return new Date().toISOString().split('T')[0];
  }

  private plusMonths(months: number): string {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split('T')[0];
  }
}
