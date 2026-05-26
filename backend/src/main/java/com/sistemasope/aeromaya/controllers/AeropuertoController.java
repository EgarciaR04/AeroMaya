package com.sistemasope.aeromaya.controllers;

import com.sistemasope.aeromaya.dtos.AeropuertoDto;
import com.sistemasope.aeromaya.services.AeropuertoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/aeropuertos")
@RequiredArgsConstructor
public class AeropuertoController {

    private final AeropuertoService aeropuertoService;

    @GetMapping
    public ResponseEntity<List<AeropuertoDto>> listarTodos() {
        return ResponseEntity.ok(aeropuertoService.listarTodos());
    }

    @GetMapping("/{codigo}/destinos")
    public ResponseEntity<List<AeropuertoDto>> listarDestinos(@PathVariable String codigo) {
        return ResponseEntity.ok(aeropuertoService.listarDestinosPorOrigen(codigo));
    }
}
