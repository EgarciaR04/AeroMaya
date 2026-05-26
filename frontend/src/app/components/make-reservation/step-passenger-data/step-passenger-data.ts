import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { PassengerForm, ReservaResponse, ReservationState } from '../../../models/reservation.models';
import { ReservationService } from '../../../services/make-reservation/make-reservation';

const emptyPassenger = (): PassengerForm => ({
  nombre: '',
  apellido: '',
  identificacion: '',
  fechaNacimiento: '',
  telefono: '',
  email: '',
});

@Component({
  selector: 'app-step-passenger-data',
  imports: [],
  templateUrl: './step-passenger-data.html',
  styleUrl: './step-passenger-data.css',
})
export class StepPassengerData implements OnInit {
  private svc = inject(ReservationService);

  readonly reservation = input.required<ReservationState>();
  readonly backed = output<void>();
  readonly confirmed = output<ReservaResponse>();

  readonly passengerForms = signal<PassengerForm[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');

  ngOnInit() {
    this.passengerForms.set(
      Array.from({ length: this.reservation().passengers }, () => emptyPassenger()),
    );
  }

  updateField(index: number, field: keyof PassengerForm, event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.passengerForms.update(forms =>
      forms.map((f, i) => (i === index ? { ...f, [field]: value } : f)),
    );
  }

  goBack() {
    this.backed.emit();
  }

  confirm() {
    const res = this.reservation();
    this.loading.set(true);
    this.error.set('');

    this.svc.crearReserva({
      origenCodigo: res.origin.code,
      destinoCodigo: res.destination.code,
      horarioId: res.flight.horarioId,
      cantidadPasajeros: res.passengers,
      pasajeros: this.passengerForms(),
    }).subscribe({
      next: response => {
        this.loading.set(false);
        this.confirmed.emit(response);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo completar la reserva. Intenta de nuevo.');
      },
    });
  }
}
