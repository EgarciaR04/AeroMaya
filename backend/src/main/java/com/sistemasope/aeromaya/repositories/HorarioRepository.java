package com.sistemasope.aeromaya.repositories;

import com.sistemasope.aeromaya.models.Horario;
import com.sistemasope.aeromaya.models.VueloProgramado;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HorarioRepository extends JpaRepository<Horario, Long> {
    List<Horario> findByVueloProgramadoOrderByHoraAsc(VueloProgramado vueloProgramado);
}
