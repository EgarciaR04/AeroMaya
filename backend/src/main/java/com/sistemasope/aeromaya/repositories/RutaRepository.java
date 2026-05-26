package com.sistemasope.aeromaya.repositories;

import com.sistemasope.aeromaya.models.Aeropuerto;
import com.sistemasope.aeromaya.models.Ruta;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RutaRepository extends JpaRepository<Ruta, Long> {
    List<Ruta> findByOrigen(Aeropuerto origen);
    Optional<Ruta> findByOrigenAndDestino(Aeropuerto origen, Aeropuerto destino);
}
