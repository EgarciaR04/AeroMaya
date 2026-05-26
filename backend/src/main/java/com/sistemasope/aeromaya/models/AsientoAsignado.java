package com.sistemasope.aeromaya.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "asientos_asignados", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"horario_id", "fila", "columna"}),
    @UniqueConstraint(columnNames = {"pasajero_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AsientoAsignado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "horario_id")
    private Horario horario;

    @OneToOne(optional = false)
    @JoinColumn(name = "pasajero_id")
    private Pasajero pasajero;

    @Column(nullable = false)
    private Integer fila;

    @Column(nullable = false, length = 1)
    private String columna;
}
