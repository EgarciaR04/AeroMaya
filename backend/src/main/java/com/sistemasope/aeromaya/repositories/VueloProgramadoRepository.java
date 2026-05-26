package com.sistemasope.aeromaya.repositories;

import com.sistemasope.aeromaya.models.Ruta;
import com.sistemasope.aeromaya.models.VueloProgramado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface VueloProgramadoRepository extends JpaRepository<VueloProgramado, Long> {
    Optional<VueloProgramado> findByRutaAndFecha(Ruta ruta, LocalDate fecha);
}
