import { Component, computed, inject, signal } from '@angular/core';
import jsPDF from 'jspdf';
import { CheckinInfo, CheckinPasajero } from '../../../models/reservation.models';
import { ReservationService } from '../../../services/make-reservation/make-reservation';

type SeatState = 'available' | 'occupied' | 'mine' | 'active';

interface SeatCell {
  columna: string;
  state: SeatState | 'aisle';
}

interface SeatRowData {
  fila: number;
  cells: SeatCell[];
}

@Component({
  selector: 'app-checkin',
  imports: [],
  templateUrl: './checkin.html',
  styleUrl: './checkin.css',
})
export class Checkin {
  private svc = inject(ReservationService);

  codigoInput = signal('');
  checkinInfo = signal<CheckinInfo | null>(null);
  activePasajeroId = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);
  error = signal('');

  readonly columns = ['A', 'B', 'C', 'D', 'E', 'F'];

  seatGrid = computed<SeatRowData[]>(() => {
    const info = this.checkinInfo();
    if (!info) return [];

    const activeId = this.activePasajeroId();

    const occupiedSet = new Set(
      info.asientosOcupados.map(a => `${a.fila}-${a.columna}`)
    );
    const mySeats = new Map<string, CheckinPasajero>();
    for (const p of info.pasajeros) {
      if (p.fila !== null && p.columna !== null) {
        mySeats.set(`${p.fila}-${p.columna}`, p);
      }
    }

    return Array.from({ length: info.totalFilas }, (_, i) => {
      const fila = i + 1;
      const cells: SeatCell[] = [];

      for (const col of ['A', 'B', 'C']) {
        cells.push({ columna: col, state: this.resolveState(fila, col, activeId, occupiedSet, mySeats) });
      }
      cells.push({ columna: 'AISLE', state: 'aisle' });
      for (const col of ['D', 'E', 'F']) {
        cells.push({ columna: col, state: this.resolveState(fila, col, activeId, occupiedSet, mySeats) });
      }

      return { fila, cells };
    });
  });

  activePasajero = computed(() =>
    this.checkinInfo()?.pasajeros.find(p => p.pasajeroId === this.activePasajeroId()) ?? null
  );

  allSeatsAssigned = computed(() => {
    const info = this.checkinInfo();
    return info ? info.pasajeros.every(p => p.fila !== null) : false;
  });

  private resolveState(
    fila: number, columna: string, activeId: number | null,
    occupiedSet: Set<string>, mySeats: Map<string, CheckinPasajero>
  ): SeatState {
    const key = `${fila}-${columna}`;
    const passenger = mySeats.get(key);
    if (passenger) {
      return passenger.pasajeroId === activeId ? 'active' : 'mine';
    }
    if (occupiedSet.has(key)) return 'occupied';
    return 'available';
  }

  buscar() {
    const codigo = this.codigoInput().trim().toUpperCase();
    if (!codigo) return;
    this.loading.set(true);
    this.error.set('');
    this.checkinInfo.set(null);

    this.svc.getCheckinInfo(codigo).subscribe({
      next: info => {
        this.checkinInfo.set(info);
        const sinAsiento = info.pasajeros.find(p => p.fila === null);
        this.activePasajeroId.set(sinAsiento?.pasajeroId ?? info.pasajeros[0]?.pasajeroId ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se encontró una reserva con ese código.');
        this.loading.set(false);
      },
    });
  }

  selectPasajero(pasajeroId: number) {
    this.activePasajeroId.set(pasajeroId);
  }

  selectSeat(fila: number, columna: string, state: SeatState | 'aisle') {
    if (state === 'occupied' || state === 'aisle' || state === 'mine') return;

    const info = this.checkinInfo();
    const activeId = this.activePasajeroId();
    if (!info || !activeId) return;

    this.saving.set(true);
    this.error.set('');

    this.svc.asignarAsiento({
      codigoReserva: info.codigoReserva,
      pasajeroId: activeId,
      fila,
      columna,
    }).subscribe({
      next: updatedPasajero => {
        this.checkinInfo.update(prev => {
          if (!prev) return prev;

          const oldPasajero = prev.pasajeros.find(p => p.pasajeroId === activeId)!;
          const newOccupied = oldPasajero.fila !== null
            ? prev.asientosOcupados.filter(
                a => !(a.fila === oldPasajero.fila && a.columna === oldPasajero.columna)
              )
            : [...prev.asientosOcupados];
          newOccupied.push({ fila, columna });

          return {
            ...prev,
            asientosOcupados: newOccupied,
            pasajeros: prev.pasajeros.map(p =>
              p.pasajeroId === activeId ? updatedPasajero : p
            ),
          };
        });

        // Move to next passenger without seat
        const updated = this.checkinInfo();
        if (updated) {
          const next = updated.pasajeros.find(p => p.fila === null && p.pasajeroId !== activeId);
          if (next) this.activePasajeroId.set(next.pasajeroId);
        }

        this.saving.set(false);
      },
      error: () => {
        this.error.set('No se pudo asignar el asiento. Intenta de nuevo.');
        this.saving.set(false);
      },
    });
  }

  onCodigoKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') this.buscar();
  }

  descargarTickets() {
    const info = this.checkinInfo();
    if (!info) return;

    const W = 80;
    const PAGE_H = 165;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [W, PAGE_H] });

    info.pasajeros.forEach((p, idx) => {
      if (idx > 0) doc.addPage([W, PAGE_H]);
      this.drawBoardingPass(doc, info, p, W);
    });

    doc.save(`boarding-${info.codigoReserva}.pdf`);
  }

  private drawBoardingPass(doc: jsPDF, info: CheckinInfo, p: CheckinPasajero, W: number): void {
    const cx = W / 2;
    const lx = 6;
    const rx = W - 6;
    let y = 10;

    const line = () => {
      doc.setDrawColor(180);
      doc.setLineWidth(0.3);
      doc.line(lx, y, rx, y);
      y += 5;
    };

    const dashed = () => {
      doc.setDrawColor(180);
      doc.setLineWidth(0.2);
      for (let x = lx; x < rx; x += 3) doc.line(x, y, Math.min(x + 1.5, rx), y);
      y += 5;
    };

    const row = (label: string, value: string) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(110);
      doc.text(label.toUpperCase(), lx, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30);
      const wrapped = doc.splitTextToSize(value, rx - lx - 18);
      doc.text(wrapped, rx, y, { align: 'right' });
      y += wrapped.length > 1 ? wrapped.length * 4.5 + 1 : 5.5;
    };

    // ── Header ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(15, 45, 140);
    doc.text('AeroMaya', cx, y, { align: 'center' });
    y += 5.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(110);
    doc.text('TARJETA DE EMBARQUE', cx, y, { align: 'center' });
    y += 7;

    line();

    // ── Passenger name ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30);
    doc.text(`${p.nombre} ${p.apellido}`.toUpperCase(), cx, y, { align: 'center' });
    y += 8;

    dashed();

    // ── Flight details ──
    row('Vuelo', info.codigoVuelo);
    row('Origen', info.origen);
    row('Destino', info.destino);
    row('Fecha', info.fecha);
    row('Hora', info.hora);
    row('Reserva', info.codigoReserva);

    y += 2;
    dashed();

    // ── Seat label ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(110);
    doc.text('ASIENTO', cx, y, { align: 'center' });
    y += 5;

    // ── Seat box ──
    const boxW = 38;
    const boxH = 22;
    const boxX = cx - boxW / 2;
    doc.setDrawColor(21, 101, 192);
    doc.setFillColor(239, 246, 255);
    doc.setLineWidth(1);
    doc.roundedRect(boxX, y, boxW, boxH, 3, 3, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(15, 45, 140);
    doc.text(`${p.fila}${p.columna}`, cx, y + boxH / 2 + 4.5, { align: 'center' });
    y += boxH + 6;

    dashed();

    // ── Footer ──
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(6.5);
    doc.setTextColor(140);
    doc.text('Presente este ticket en el aeropuerto', cx, y, { align: 'center' });
    y += 4;
    doc.text('Llegue con al menos 2 horas de anticipación', cx, y, { align: 'center' });
  }
}
