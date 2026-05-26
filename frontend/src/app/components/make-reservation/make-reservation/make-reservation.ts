import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import jsPDF from 'jspdf';
import { StepFlightSelection } from '../step-flight-selection/step-flight-selection';
import { StepPassengerData } from '../step-passenger-data/step-passenger-data';
import { ReservaResponse, ReservationState } from '../../../models/reservation.models';

@Component({
  selector: 'app-make-reservation',
  imports: [StepFlightSelection, StepPassengerData, RouterLink],
  templateUrl: './make-reservation.html',
  styleUrl: './make-reservation.css',
})
export class MakeReservation {
  readonly currentStep = signal<1 | 2 | 3>(1);
  readonly reservationState = signal<ReservationState | null>(null);
  readonly bookingResult = signal<ReservaResponse | null>(null);

  onContinued(state: ReservationState) {
    this.reservationState.set(state);
    this.currentStep.set(2);
  }

  onBacked() {
    this.currentStep.set(1);
  }

  onConfirmed(result: ReservaResponse) {
    this.bookingResult.set(result);
    this.currentStep.set(3);
  }

  descargarPDF() {
    const r = this.bookingResult();
    if (!r) return;

    const W = 80;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, 200] });

    const cx = W / 2;
    const lx = 6;
    const rx = W - 6;
    let y = 12;

    const line = () => {
      doc.setDrawColor(180);
      doc.setLineWidth(0.3);
      doc.line(lx, y, rx, y);
      y += 5;
    };

    const dashedLine = () => {
      doc.setDrawColor(180);
      doc.setLineWidth(0.2);
      for (let x = lx; x < rx; x += 3) {
        doc.line(x, y, Math.min(x + 1.5, rx), y);
      }
      y += 5;
    };

    const row = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(100);
      doc.text(label.toUpperCase(), lx, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30);
      const lines = doc.splitTextToSize(value, rx - lx - 20);
      doc.text(lines, rx, y, { align: 'right' });
      y += lines.length > 1 ? lines.length * 4.5 + 1 : 5.5;
    };

    // ── Header ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 45, 140);
    doc.text('AeroMaya', cx, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100);
    doc.text('COMPROBANTE DE RESERVA', cx, y, { align: 'center' });
    y += 6;

    line();

    // ── Booking code ──
    doc.setFont('courier', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(30);
    doc.text(r.codigoReserva, cx, y, { align: 'center' });
    y += 6;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(34, 197, 94);
    doc.text(`● ${r.estado}`, cx, y, { align: 'center' });
    y += 7;

    dashedLine();

    // ── Flight details ──
    row('Vuelo', r.codigoVuelo);
    row('Origen', r.origen);
    row('Destino', r.destino);
    row('Fecha', r.fecha);
    row('Hora', r.hora);
    row('Pasajeros', String(r.cantidadPasajeros));

    y += 2;
    dashedLine();

    // ── Footer ──
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(140);
    doc.text('Gracias por volar con AeroMaya', cx, y, { align: 'center' });
    y += 4;
    doc.text('Presente este comprobante en el aeropuerto', cx, y, { align: 'center' });

    doc.save(`reserva-${r.codigoReserva}.pdf`);
  }
}
