package com.sistemasope.aeromaya.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class HorarioDto {
    private Long id;
    private String codigoVuelo;
    private String hora;
    private BigDecimal precio;
    private Integer asientosDisponibles;
}
