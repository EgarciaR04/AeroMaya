package com.sistemasope.aeromaya.services;

import com.sistemasope.aeromaya.dtos.PasajeroDto;
import com.sistemasope.aeromaya.dtos.ReservaRequestDto;
import com.sistemasope.aeromaya.dtos.ReservaResponseDto;
import com.sistemasope.aeromaya.models.Aeropuerto;
import com.sistemasope.aeromaya.models.Horario;
import com.sistemasope.aeromaya.models.Pasajero;
import com.sistemasope.aeromaya.models.Reserva;
import com.sistemasope.aeromaya.models.VueloProgramado;
import com.sistemasope.aeromaya.repositories.HorarioRepository;
import com.sistemasope.aeromaya.repositories.ReservaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ReservaService {

    private final ReservaRepository reservaRepository;
    private final HorarioRepository horarioRepository;

    @Transactional
    public ReservaResponseDto crearReserva(ReservaRequestDto request) {
        Horario horario = horarioRepository.findById(request.getHorarioId())
                .orElseThrow(() -> new IllegalArgumentException("Horario no encontrado: " + request.getHorarioId()));

        if (horario.getAsientosDisponibles() < request.getCantidadPasajeros()) {
            throw new IllegalStateException("No hay suficientes asientos disponibles.");
        }

        if (request.getPasajeros().size() != request.getCantidadPasajeros()) {
            throw new IllegalArgumentException("La cantidad de pasajeros no coincide con los datos ingresados.");
        }

        Reserva reserva = new Reserva();
        reserva.setCodigoReserva(generarCodigo());
        reserva.setHorario(horario);
        reserva.setCantidadPasajeros(request.getCantidadPasajeros());
        reserva.setFechaReserva(LocalDateTime.now());
        reserva.setEstado("CONFIRMADA");

        List<Pasajero> pasajeros = request.getPasajeros().stream()
                .map(dto -> mapPasajero(dto, reserva))
                .toList();
        reserva.setPasajeros(pasajeros);

        horario.setAsientosDisponibles(horario.getAsientosDisponibles() - request.getCantidadPasajeros());
        horarioRepository.save(horario);

        Reserva guardada = reservaRepository.save(reserva);

        VueloProgramado vuelo = horario.getVueloProgramado();
        Aeropuerto origen = vuelo.getRuta().getOrigen();
        Aeropuerto destino = vuelo.getRuta().getDestino();
        LocalDate fecha = vuelo.getFecha();

        return new ReservaResponseDto(
                guardada.getCodigoReserva(),
                guardada.getEstado(),
                origen.getNombre() + " (" + origen.getCodigo() + ")",
                destino.getNombre() + " (" + destino.getCodigo() + ")",
                fecha.toString(),
                horario.getHora().toString(),
                horario.getCodigoVuelo(),
                guardada.getCantidadPasajeros()
        );
    }

    public ReservaResponseDto buscarPorCodigo(String codigo) {
        Reserva reserva = reservaRepository.findByCodigoReserva(codigo)
                .orElseThrow(() -> new IllegalArgumentException("Reserva no encontrada: " + codigo));

        Horario horario = reserva.getHorario();
        VueloProgramado vuelo = horario.getVueloProgramado();
        Aeropuerto origen = vuelo.getRuta().getOrigen();
        Aeropuerto destino = vuelo.getRuta().getDestino();

        return new ReservaResponseDto(
                reserva.getCodigoReserva(),
                reserva.getEstado(),
                origen.getNombre() + " (" + origen.getCodigo() + ")",
                destino.getNombre() + " (" + destino.getCodigo() + ")",
                vuelo.getFecha().toString(),
                horario.getHora().toString(),
                horario.getCodigoVuelo(),
                reserva.getCantidadPasajeros()
        );
    }

    private Pasajero mapPasajero(PasajeroDto dto, Reserva reserva) {
        Pasajero p = new Pasajero();
        p.setReserva(reserva);
        p.setNombre(dto.getNombre());
        p.setApellido(dto.getApellido());
        p.setIdentificacion(dto.getIdentificacion());
        p.setFechaNacimiento(LocalDate.parse(dto.getFechaNacimiento()));
        p.setTelefono(dto.getTelefono());
        p.setEmail(dto.getEmail());
        return p;
    }

    private String generarCodigo() {
        return "AMA-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }
}
