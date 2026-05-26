package com.sistemasope.aeromaya.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ReservaRequestDto {

    @NotBlank
    private String origenCodigo;

    @NotBlank
    private String destinoCodigo;

    @NotNull
    private Long horarioId;

    @Min(1)
    private int cantidadPasajeros;

    @Valid
    @NotNull
    @Size(min = 1)
    private List<PasajeroDto> pasajeros;
}
