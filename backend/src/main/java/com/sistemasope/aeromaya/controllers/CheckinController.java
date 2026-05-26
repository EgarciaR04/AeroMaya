package com.sistemasope.aeromaya.controllers;

import com.sistemasope.aeromaya.dtos.CheckinInfoDto;
import com.sistemasope.aeromaya.dtos.CheckinPasajeroDto;
import com.sistemasope.aeromaya.dtos.CheckinRequestDto;
import com.sistemasope.aeromaya.services.CheckinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkin")
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService checkinService;

    @GetMapping("/{codigoReserva}")
    public ResponseEntity<CheckinInfoDto> buscarReserva(@PathVariable String codigoReserva) {
        return ResponseEntity.ok(checkinService.buscarReserva(codigoReserva));
    }

    @PostMapping("/asignar")
    public ResponseEntity<CheckinPasajeroDto> asignarAsiento(@Valid @RequestBody CheckinRequestDto request) {
        return ResponseEntity.ok(checkinService.asignarAsiento(request));
    }
}
