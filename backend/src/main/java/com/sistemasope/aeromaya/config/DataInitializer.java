package com.sistemasope.aeromaya.config;

import com.sistemasope.aeromaya.models.*;
import com.sistemasope.aeromaya.repositories.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Random;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AeropuertoRepository aeropuertoRepo;
    private final RutaRepository rutaRepo;
    private final VueloProgramadoRepository vueloRepo;
    private final HorarioRepository horarioRepo;

    @Override
    public void run(String... args) {
        if (aeropuertoRepo.count() > 0) return;

        Aeropuerto sdq = aeropuertoRepo.save(new Aeropuerto(null, "SDQ", "Santo Domingo"));
        Aeropuerto mia = aeropuertoRepo.save(new Aeropuerto(null, "MIA", "Miami"));
        Aeropuerto jfk = aeropuertoRepo.save(new Aeropuerto(null, "JFK", "New York"));
        Aeropuerto lax = aeropuertoRepo.save(new Aeropuerto(null, "LAX", "Los Angeles"));

        Ruta sdqMia = rutaRepo.save(new Ruta(null, sdq, mia));
        Ruta sdqJfk = rutaRepo.save(new Ruta(null, sdq, jfk));
        Ruta sdqLax = rutaRepo.save(new Ruta(null, sdq, lax));
        Ruta miaSdq = rutaRepo.save(new Ruta(null, mia, sdq));
        Ruta miaJfk = rutaRepo.save(new Ruta(null, mia, jfk));
        Ruta jfkSdq = rutaRepo.save(new Ruta(null, jfk, sdq));
        Ruta jfkMia = rutaRepo.save(new Ruta(null, jfk, mia));
        Ruta laxSdq = rutaRepo.save(new Ruta(null, lax, sdq));

        LocalDate hoy = LocalDate.now();
        for (int i = 0; i < 60; i++) {
            LocalDate fecha = hoy.plusDays(i);

            crearVuelo(sdqMia, fecha, 1L,
                    List.of("SK7673", "SK4280", "SK7090", "SK1275", "SK4679", "SK2175"),
                    List.of(LocalTime.of(6, 30), LocalTime.of(9, 15), LocalTime.of(12, 0),
                            LocalTime.of(15, 45), LocalTime.of(18, 20), LocalTime.of(21, 10)),
                    List.of(341, 327, 299, 219, 185, 358),
                    List.of(150, 150, 150, 180, 150, 180));

            crearVuelo(miaSdq, fecha, 2L,
                    List.of("SK7674", "SK4281", "SK1276"),
                    List.of(LocalTime.of(7, 0), LocalTime.of(13, 0), LocalTime.of(19, 0)),
                    List.of(310, 280, 330),
                    List.of(150, 150, 180));

            crearVuelo(sdqJfk, fecha, 3L,
                    List.of("AA1010", "AA2020", "AA3030"),
                    List.of(LocalTime.of(8, 0), LocalTime.of(14, 0), LocalTime.of(20, 0)),
                    List.of(420, 390, 450),
                    List.of(180, 180, 180));

            crearVuelo(jfkSdq, fecha, 4L,
                    List.of("AA1011", "AA2021"),
                    List.of(LocalTime.of(9, 30), LocalTime.of(17, 30)),
                    List.of(400, 380),
                    List.of(180, 180));

            crearVuelo(sdqLax, fecha, 5L,
                    List.of("DL5001", "DL5002"),
                    List.of(LocalTime.of(10, 0), LocalTime.of(22, 0)),
                    List.of(550, 510),
                    List.of(200, 200));

            crearVuelo(laxSdq, fecha, 6L,
                    List.of("DL5003"),
                    List.of(LocalTime.of(11, 0)),
                    List.of(530),
                    List.of(200));

            crearVuelo(miaJfk, fecha, 7L,
                    List.of("B6101", "B6102", "B6103"),
                    List.of(LocalTime.of(6, 0), LocalTime.of(12, 30), LocalTime.of(18, 45)),
                    List.of(210, 195, 225),
                    List.of(150, 150, 150));

            crearVuelo(jfkMia, fecha, 8L,
                    List.of("B6104", "B6105"),
                    List.of(LocalTime.of(7, 45), LocalTime.of(16, 0)),
                    List.of(200, 215),
                    List.of(150, 150));
        }
    }

    private void crearVuelo(Ruta ruta, LocalDate fecha, long rutaId,
                             List<String> codigos, List<LocalTime> horas,
                             List<Integer> precios, List<Integer> capacidades) {
        VueloProgramado vuelo = vueloRepo.save(new VueloProgramado(null, ruta, fecha));
        for (int i = 0; i < codigos.size(); i++) {
            int asientos = asientosDisponibles(fecha.toEpochDay(), rutaId, i, capacidades.get(i));
            horarioRepo.save(new Horario(null, vuelo, codigos.get(i), horas.get(i),
                    BigDecimal.valueOf(precios.get(i)), asientos));
        }
    }

    /**
     * Deriva asientos disponibles de forma determinista a partir de fecha+ruta+slot.
     * Simula ocupación real: entre 15% y 90% del total disponible.
     */
    private int asientosDisponibles(long epochDay, long rutaId, int slotIndex, int capacidad) {
        long seed = epochDay * 1000L + rutaId * 10L + slotIndex;
        Random rng = new Random(seed);
        int minDisponible = (int) Math.ceil(capacidad * 0.10);
        int maxDisponible = (int) Math.ceil(capacidad * 0.85);
        return minDisponible + rng.nextInt(maxDisponible - minDisponible + 1);
    }
}
