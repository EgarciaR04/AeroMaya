package com.sistemasope.aeromaya.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class CheckinPasajeroDto {
    private Long pasajeroId;
    private String nombre;
    private String apellido;
    private Integer fila;
    private String columna;
}
