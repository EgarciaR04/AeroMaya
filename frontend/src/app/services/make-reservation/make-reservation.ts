import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Airport, Flight, ReservaRequest, ReservaResponse } from '../../models/reservation.models';

interface HorarioDto {
  id: number;
  codigoVuelo: string;
  hora: string;
  precio: number;
  asientosDisponibles: number;
}

@Injectable({
  providedIn: 'root',
})
export class ReservationService {
  private http = inject(HttpClient);
  private api = 'http://localhost:8080/api';

  getAeropuertos(): Observable<Airport[]> {
    return this.http.get<Airport[]>(`${this.api}/aeropuertos`, { withCredentials: true });
  }

  getDestinos(codigoOrigen: string): Observable<Airport[]> {
    return this.http.get<Airport[]>(`${this.api}/aeropuertos/${codigoOrigen}/destinos`, { withCredentials: true });
  }

  getHorarios(origen: string, destino: string, fecha: string): Observable<Flight[]> {
    return this.http.get<HorarioDto[]>(`${this.api}/vuelos/horarios`, {
      params: { origen, destino, fecha },
      withCredentials: true,
    }).pipe(
      map(horarios => horarios.map(h => ({
        horarioId: h.id,
        id: h.codigoVuelo,
        time: h.hora,
        price: h.precio,
        seats: h.asientosDisponibles,
      })))
    );
  }

  crearReserva(request: ReservaRequest): Observable<ReservaResponse> {
    return this.http.post<ReservaResponse>(`${this.api}/reservas`, request, { withCredentials: true });
  }
}
