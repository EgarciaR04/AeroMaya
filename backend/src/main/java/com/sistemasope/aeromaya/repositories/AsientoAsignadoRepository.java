package com.sistemasope.aeromaya.repositories;

import com.sistemasope.aeromaya.models.AsientoAsignado;
import com.sistemasope.aeromaya.models.Horario;
import com.sistemasope.aeromaya.models.Pasajero;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AsientoAsignadoRepository extends JpaRepository<AsientoAsignado, Long> {
    List<AsientoAsignado> findByHorario(Horario horario);
    Optional<AsientoAsignado> findByPasajero(Pasajero pasajero);
    Optional<AsientoAsignado> findByHorarioAndFilaAndColumna(Horario horario, Integer fila, String columna);
}
