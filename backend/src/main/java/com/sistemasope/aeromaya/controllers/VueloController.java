package com.sistemasope.aeromaya.controllers;

import com.sistemasope.aeromaya.dtos.HorarioDto;
import com.sistemasope.aeromaya.services.VueloService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vuelos")
@RequiredArgsConstructor
public class VueloController {

    private final VueloService vueloService;

    /**
     * GET /api/vuelos/horarios?origen=SDQ&destino=MIA&fecha=2026-05-27
     */
    @GetMapping("/horarios")
    public ResponseEntity<List<HorarioDto>> buscarHorarios(
            @RequestParam String origen,
            @RequestParam String destino,
            @RequestParam String fecha) {
        return ResponseEntity.ok(vueloService.buscarHorarios(origen, destino, fecha));
    }
}
