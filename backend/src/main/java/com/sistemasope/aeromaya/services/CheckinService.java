package com.sistemasope.aeromaya.services;

import com.sistemasope.aeromaya.dtos.AsientoOcupadoDto;
import com.sistemasope.aeromaya.dtos.CheckinInfoDto;
import com.sistemasope.aeromaya.dtos.CheckinPasajeroDto;
import com.sistemasope.aeromaya.dtos.CheckinRequestDto;
import com.sistemasope.aeromaya.models.*;
import com.sistemasope.aeromaya.repositories.AsientoAsignadoRepository;
import com.sistemasope.aeromaya.repositories.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CheckinService {

    private final ReservaRepository reservaRepo;
    private final AsientoAsignadoRepository asientoRepo;

    @Transactional(readOnly = true)
    public CheckinInfoDto buscarReserva(String codigoReserva) {
        Reserva reserva = reservaRepo.findByCodigoReserva(codigoReserva)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + codigoReserva));

        Horario horario = reserva.getHorario();
        VueloProgramado vuelo = horario.getVueloProgramado();
        Aeropuerto origen = vuelo.getRuta().getOrigen();
        Aeropuerto destino = vuelo.getRuta().getDestino();

        int totalFilas = (int) Math.ceil(horario.getCapacidad() / 6.0);

        List<AsientoOcupadoDto> asientosOcupados = asientoRepo.findByHorario(horario).stream()
                .map(a -> new AsientoOcupadoDto(a.getFila(), a.getColumna()))
                .toList();

        List<CheckinPasajeroDto> pasajeros = reserva.getPasajeros().stream()
                .map(p -> {
                    Optional<AsientoAsignado> asiento = asientoRepo.findByPasajero(p);
                    return new CheckinPasajeroDto(
                            p.getId(),
                            p.getNombre(),
                            p.getApellido(),
                            asiento.map(AsientoAsignado::getFila).orElse(null),
                            asiento.map(AsientoAsignado::getColumna).orElse(null)
                    );
                })
                .toList();

        return new CheckinInfoDto(
                reserva.getCodigoReserva(),
                reserva.getEstado(),
                origen.getNombre() + " (" + origen.getCodigo() + ")",
                destino.getNombre() + " (" + destino.getCodigo() + ")",
                vuelo.getFecha().toString(),
                horario.getHora().toString(),
                horario.getCodigoVuelo(),
                horario.getId(),
                totalFilas,
                pasajeros,
                asientosOcupados
        );
    }

    @Transactional
    public CheckinPasajeroDto asignarAsiento(CheckinRequestDto req) {
        Reserva reserva = reservaRepo.findByCodigoReserva(req.getCodigoReserva())
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + req.getCodigoReserva()));

        Pasajero pasajero = reserva.getPasajeros().stream()
                .filter(p -> p.getId().equals(req.getPasajeroId()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("El pasajero no pertenece a esta reserva."));

        Horario horario = reserva.getHorario();

        int maxFila = (int) Math.ceil(horario.getCapacidad() / 6.0);
        if (req.getFila() < 1 || req.getFila() > maxFila) {
            throw new IllegalArgumentException("Fila inválida: " + req.getFila());
        }

        Optional<AsientoAsignado> seatTaken = asientoRepo
                .findByHorarioAndFilaAndColumna(horario, req.getFila(), req.getColumna());

        if (seatTaken.isPresent() && !seatTaken.get().getPasajero().getId().equals(pasajero.getId())) {
            throw new IllegalStateException("El asiento ya está ocupado.");
        }

        // Remove previous assignment if the passenger is changing seat
        asientoRepo.findByPasajero(pasajero).ifPresent(asientoRepo::delete);

        AsientoAsignado nuevo = new AsientoAsignado(null, horario, pasajero, req.getFila(), req.getColumna());
        asientoRepo.save(nuevo);

        return new CheckinPasajeroDto(
                pasajero.getId(),
                pasajero.getNombre(),
                pasajero.getApellido(),
                req.getFila(),
                req.getColumna()
        );
    }
}
