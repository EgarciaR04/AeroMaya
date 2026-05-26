package com.sistemasope.aeromaya.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class CheckinInfoDto {
    private String codigoReserva;
    private String estado;
    private String origen;
    private String destino;
    private String fecha;
    private String hora;
    private String codigoVuelo;
    private Long horarioId;
    private Integer totalFilas;
    private List<CheckinPasajeroDto> pasajeros;
    private List<AsientoOcupadoDto> asientosOcupados;
}
