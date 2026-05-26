import { Component, computed, inject, signal } from '@angular/core';
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
}
