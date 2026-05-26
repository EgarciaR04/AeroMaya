package com.sistemasope.aeromaya.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "vuelos_programados", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"ruta_id", "fecha"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VueloProgramado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "ruta_id")
    private Ruta ruta;

    @Column(nullable = false)
    private LocalDate fecha;
}
