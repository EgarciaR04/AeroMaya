package com.sistemasope.aeromaya.models;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "rutas", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"origen_id", "destino_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Ruta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "origen_id")
    private Aeropuerto origen;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destino_id")
    private Aeropuerto destino;
}
