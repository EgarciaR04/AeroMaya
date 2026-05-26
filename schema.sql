-- ============================================================
--  AeroMaya - Esquema de Base de Datos
-- ============================================================

CREATE TABLE aeropuertos (
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo  VARCHAR(10)  NOT NULL UNIQUE,
    nombre  VARCHAR(255) NOT NULL
);

-- -------------------------------------------------------

CREATE TABLE rutas (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    origen_id  BIGINT NOT NULL,
    destino_id BIGINT NOT NULL,
    CONSTRAINT fk_ruta_origen  FOREIGN KEY (origen_id)  REFERENCES aeropuertos(id),
    CONSTRAINT fk_ruta_destino FOREIGN KEY (destino_id) REFERENCES aeropuertos(id),
    CONSTRAINT uq_ruta         UNIQUE (origen_id, destino_id)
);

-- -------------------------------------------------------

CREATE TABLE vuelos_programados (
    id      BIGINT AUTO_INCREMENT PRIMARY KEY,
    ruta_id BIGINT NOT NULL,
    fecha   DATE   NOT NULL,
    CONSTRAINT fk_vuelo_ruta FOREIGN KEY (ruta_id) REFERENCES rutas(id),
    CONSTRAINT uq_vuelo      UNIQUE (ruta_id, fecha)
);

-- -------------------------------------------------------

CREATE TABLE horarios (
    id                   BIGINT         AUTO_INCREMENT PRIMARY KEY,
    vuelo_programado_id  BIGINT         NOT NULL,
    codigo_vuelo         VARCHAR(10)    NOT NULL,
    hora                 TIME           NOT NULL,
    precio               DECIMAL(10, 2) NOT NULL,
    asientos_disponibles INT            NOT NULL,
    capacidad            INT            NOT NULL,
    CONSTRAINT fk_horario_vuelo FOREIGN KEY (vuelo_programado_id) REFERENCES vuelos_programados(id)
);

-- -------------------------------------------------------

CREATE TABLE reservas (
    id                 BIGINT       AUTO_INCREMENT PRIMARY KEY,
    codigo_reserva     VARCHAR(20)  NOT NULL UNIQUE,
    horario_id         BIGINT       NOT NULL,
    cantidad_pasajeros INT          NOT NULL,
    fecha_reserva      DATETIME     NOT NULL,
    estado             VARCHAR(20)  NOT NULL,
    CONSTRAINT fk_reserva_horario FOREIGN KEY (horario_id) REFERENCES horarios(id)
);

-- -------------------------------------------------------

CREATE TABLE pasajeros (
    id               BIGINT      AUTO_INCREMENT PRIMARY KEY,
    reserva_id       BIGINT      NOT NULL,
    nombre           VARCHAR(255) NOT NULL,
    apellido         VARCHAR(255) NOT NULL,
    identificacion   VARCHAR(255) NOT NULL,
    fecha_nacimiento DATE         NOT NULL,
    telefono         VARCHAR(20)  NOT NULL,
    email            VARCHAR(255) NOT NULL,
    CONSTRAINT fk_pasajero_reserva FOREIGN KEY (reserva_id) REFERENCES reservas(id)
        ON DELETE CASCADE
);

-- -------------------------------------------------------

CREATE TABLE asientos_asignados (
    id          BIGINT     AUTO_INCREMENT PRIMARY KEY,
    horario_id  BIGINT     NOT NULL,
    pasajero_id BIGINT     NOT NULL,
    fila        INT        NOT NULL,
    columna     VARCHAR(1) NOT NULL,
    CONSTRAINT fk_asiento_horario  FOREIGN KEY (horario_id)  REFERENCES horarios(id),
    CONSTRAINT fk_asiento_pasajero FOREIGN KEY (pasajero_id) REFERENCES pasajeros(id),
    CONSTRAINT uq_asiento_por_vuelo UNIQUE (horario_id, fila, columna),
    CONSTRAINT uq_pasajero_asiento  UNIQUE (pasajero_id)
);
