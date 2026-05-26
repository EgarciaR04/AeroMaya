package com.sistemasope.aeromaya.repositories;

import com.sistemasope.aeromaya.models.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ReservaRepository extends JpaRepository<Reserva, Long> {
    Optional<Reserva> findByCodigoReserva(String codigoReserva);
}
