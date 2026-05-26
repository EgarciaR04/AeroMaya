export interface Airport {
  code: string;
  label: string;
}

export interface Flight {
  horarioId: number;
  id: string;
  time: string;
  price: number;
  seats: number;
}

export interface ReservationState {
  origin: Airport;
  destination: Airport;
  passengers: number;
  flight: Flight;
  flightDate: string;
  flightDateIso: string;
}

export interface PassengerForm {
  nombre: string;
  apellido: string;
  identificacion: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
}

export interface ReservaRequest {
  origenCodigo: string;
  destinoCodigo: string;
  horarioId: number;
  cantidadPasajeros: number;
  pasajeros: PassengerForm[];
}

export interface ReservaResponse {
  codigoReserva: string;
  estado: string;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  codigoVuelo: string;
  cantidadPasajeros: number;
}

export interface CheckinPasajero {
  pasajeroId: number;
  nombre: string;
  apellido: string;
  fila: number | null;
  columna: string | null;
}

export interface AsientoOcupado {
  fila: number;
  columna: string;
}

export interface CheckinInfo {
  codigoReserva: string;
  estado: string;
  origen: string;
  destino: string;
  fecha: string;
  hora: string;
  codigoVuelo: string;
  horarioId: number;
  totalFilas: number;
  pasajeros: CheckinPasajero[];
  asientosOcupados: AsientoOcupado[];
}

export interface AsignarAsientoRequest {
  codigoReserva: string;
  pasajeroId: number;
  fila: number;
  columna: string;
}
