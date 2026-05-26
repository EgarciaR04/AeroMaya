package com.sistemasope.aeromaya.services;

import com.sistemasope.aeromaya.dtos.HorarioDto;
import com.sistemasope.aeromaya.models.Aeropuerto;
import com.sistemasope.aeromaya.models.Ruta;
import com.sistemasope.aeromaya.models.VueloProgramado;
import com.sistemasope.aeromaya.repositories.AeropuertoRepository;
import com.sistemasope.aeromaya.repositories.HorarioRepository;
import com.sistemasope.aeromaya.repositories.RutaRepository;
import com.sistemasope.aeromaya.repositories.VueloProgramadoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VueloService {

    private final AeropuertoRepository aeropuertoRepository;
    private final RutaRepository rutaRepository;
    private final VueloProgramadoRepository vueloProgramadoRepository;
    private final HorarioRepository horarioRepository;

    private static final int MAX_MESES = 24;

    public List<HorarioDto> buscarHorarios(String codigoOrigen, String codigoDestino, String fechaStr) {
        LocalDate fecha = LocalDate.parse(fechaStr, DateTimeFormatter.ISO_LOCAL_DATE);
        LocalDate hoy = LocalDate.now();

        if (fecha.isBefore(hoy)) {
            throw new IllegalArgumentException("La fecha no puede ser anterior a hoy.");
        }
        if (fecha.isAfter(hoy.plusMonths(MAX_MESES))) {
            throw new IllegalArgumentException("La fecha no puede superar los 24 meses desde hoy.");
        }

        Aeropuerto origen = aeropuertoRepository.findByCodigo(codigoOrigen)
                .orElseThrow(() -> new IllegalArgumentException("Aeropuerto origen no encontrado: " + codigoOrigen));
        Aeropuerto destino = aeropuertoRepository.findByCodigo(codigoDestino)
                .orElseThrow(() -> new IllegalArgumentException("Aeropuerto destino no encontrado: " + codigoDestino));

        Ruta ruta = rutaRepository.findByOrigenAndDestino(origen, destino)
                .orElseThrow(() -> new IllegalArgumentException("No existe ruta de " + codigoOrigen + " a " + codigoDestino));

        VueloProgramado vuelo = vueloProgramadoRepository.findByRutaAndFecha(ruta, fecha)
                .orElseThrow(() -> new IllegalArgumentException("No hay vuelos programados para esa fecha."));

        return horarioRepository.findByVueloProgramadoOrderByHoraAsc(vuelo).stream()
                .map(h -> new HorarioDto(
                        h.getId(),
                        h.getCodigoVuelo(),
                        h.getHora().toString(),
                        h.getPrecio(),
                        h.getAsientosDisponibles()
                ))
                .toList();
    }
}
