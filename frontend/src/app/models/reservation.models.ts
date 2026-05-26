export interface Airport {
  code: string;
  label: string;
}

export interface Flight {
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
}

export interface PassengerForm {
  nombre: string;
  apellido: string;
  identificacion: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
}
