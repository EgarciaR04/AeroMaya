import { Component, OnInit, input, output, signal } from '@angular/core';
import { PassengerForm, ReservationState } from '../../../models/reservation.models';

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
  readonly reservation = input.required<ReservationState>();
  readonly backed = output<void>();
  readonly confirmed = output<PassengerForm[]>();

  readonly passengerForms = signal<PassengerForm[]>([]);

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
    this.confirmed.emit(this.passengerForms());
  }
}
