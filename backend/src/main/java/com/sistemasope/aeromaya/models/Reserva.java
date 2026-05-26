package com.sistemasope.aeromaya.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "reservas")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigoReserva;

    @ManyToOne(optional = false)
    @JoinColumn(name = "horario_id")
    private Horario horario;

    @Column(nullable = false)
    private Integer cantidadPasajeros;

    @Column(nullable = false)
    private LocalDateTime fechaReserva;

    @Column(nullable = false, length = 20)
    private String estado;

    @OneToMany(mappedBy = "reserva", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Pasajero> pasajeros;
}
