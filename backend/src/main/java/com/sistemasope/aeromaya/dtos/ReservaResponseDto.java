package com.sistemasope.aeromaya.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ReservaResponseDto {
    private String codigoReserva;
    private String estado;
    private String origen;
    private String destino;
    private String fecha;
    private String hora;
    private String codigoVuelo;
    private int cantidadPasajeros;
}
