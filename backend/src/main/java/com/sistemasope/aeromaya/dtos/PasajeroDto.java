package com.sistemasope.aeromaya.dtos;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class PasajeroDto {

    @NotBlank
    private String nombre;

    @NotBlank
    private String apellido;

    @NotBlank
    private String identificacion;

    @NotNull
    private String fechaNacimiento;

    @NotBlank
    private String telefono;

    @Email
    @NotBlank
    private String email;
}
