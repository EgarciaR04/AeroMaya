package com.sistemasope.aeromaya.repositories;

import com.sistemasope.aeromaya.models.Pasajero;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PasajeroRepository extends JpaRepository<Pasajero, Long> {
}
