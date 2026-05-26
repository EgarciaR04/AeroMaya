package com.sistemasope.aeromaya.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class CheckinRequestDto {

    @NotBlank
    private String codigoReserva;

    @NotNull
    private Long pasajeroId;

    @NotNull
    private Integer fila;

    @NotBlank
    @Pattern(regexp = "[A-F]")
    private String columna;
}
