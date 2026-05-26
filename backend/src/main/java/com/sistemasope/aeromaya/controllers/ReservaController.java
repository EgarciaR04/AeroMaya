package com.sistemasope.aeromaya.controllers;

import com.sistemasope.aeromaya.dtos.ReservaRequestDto;
import com.sistemasope.aeromaya.dtos.ReservaResponseDto;
import com.sistemasope.aeromaya.services.ReservaService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reservas")
@RequiredArgsConstructor
public class ReservaController {

    private final ReservaService reservaService;

    @PostMapping
    public ResponseEntity<ReservaResponseDto> crearReserva(@Valid @RequestBody ReservaRequestDto request) {
        return ResponseEntity.ok(reservaService.crearReserva(request));
    }

    @GetMapping("/{codigo}")
    public ResponseEntity<ReservaResponseDto> buscarPorCodigo(@PathVariable String codigo) {
        return ResponseEntity.ok(reservaService.buscarPorCodigo(codigo));
    }
}
