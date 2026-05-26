package com.sistemasope.aeromaya.services;

import com.sistemasope.aeromaya.dtos.AeropuertoDto;
import com.sistemasope.aeromaya.models.Aeropuerto;
import com.sistemasope.aeromaya.models.Ruta;
import com.sistemasope.aeromaya.repositories.AeropuertoRepository;
import com.sistemasope.aeromaya.repositories.RutaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AeropuertoService {

    private final AeropuertoRepository aeropuertoRepository;
    private final RutaRepository rutaRepository;

    public List<AeropuertoDto> listarTodos() {
        return aeropuertoRepository.findAll().stream()
                .map(a -> new AeropuertoDto(a.getCodigo(), a.getNombre() + " (" + a.getCodigo() + ")"))
                .toList();
    }

    public List<AeropuertoDto> listarDestinosPorOrigen(String codigoOrigen) {
        Aeropuerto origen = aeropuertoRepository.findByCodigo(codigoOrigen)
                .orElseThrow(() -> new IllegalArgumentException("Aeropuerto no encontrado: " + codigoOrigen));

        return rutaRepository.findByOrigen(origen).stream()
                .map(Ruta::getDestino)
                .map(a -> new AeropuertoDto(a.getCodigo(), a.getNombre() + " (" + a.getCodigo() + ")"))
                .toList();
    }
}
