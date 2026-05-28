# Guía de Monitoreo: Prometheus, Grafana, Loki y Node Exporter

## ¿Para qué sirve cada tecnología?

### Prometheus — El recolector de métricas

Piénsalo como una base de datos especializada en números a lo largo del tiempo. Cada ciertos segundos va a "preguntar" a tus servidores: ¿cuánta CPU usas? ¿cuánta RAM? ¿cuántas peticiones recibiste? Guarda esas respuestas y te permite hacer preguntas como *"¿cómo estaba la CPU del worker hace 2 horas?"*.

```
Prometheus → pregunta cada 15s → Node Exporter → responde con métricas
```

**Características clave:**
- Base de datos de series temporales (TSDB)
- Lenguaje de consulta propio: PromQL
- Modelo pull: él va a buscar las métricas, no las recibe
- Alertas configurables mediante reglas

---

### Node Exporter — El informante de cada nodo

Es un agente pequeño que se instala en cada servidor (droplet). Su único trabajo es exponer las métricas del sistema operativo en un formato que Prometheus entiende: uso de CPU, RAM, disco, red, temperatura, etc. Sin Node Exporter, Prometheus no sabe nada del hardware.

```
vps-eric      → Node Exporter → expone :9100/metrics
vps-nikte     → Node Exporter → expone :9100/metrics
vps-stephanie → Node Exporter → expone :9100/metrics
```

**Métricas que expone:**
- CPU: uso por núcleo, modo (user, system, idle)
- Memoria: RAM usada, libre, caché, swap
- Disco: espacio usado, operaciones de lectura/escritura, latencia
- Red: bytes enviados/recibidos por interfaz, errores
- Sistema: carga del sistema, procesos activos, uptime

---

### Loki — El recolector de logs

Es como Prometheus pero en vez de números guarda texto — los logs de tus aplicaciones y del sistema. Solo indexa los metadatos (de qué pod/nodo viene el log) pero no el contenido completo, por eso es muy eficiente en almacenamiento. Se complementa con **Promtail**, un agente que lee los logs de cada nodo y los envía a Loki.

```
Pods/Sistema → Promtail (lee logs) → Loki (almacena) → Grafana (visualiza)
```

**Características clave:**
- No indexa el contenido completo, solo etiquetas (pod, namespace, nodo)
- Lenguaje de consulta: LogQL
- Diseñado para integrarse nativamente con Grafana
- Mucho más económico en almacenamiento que soluciones como Elasticsearch

---

### Grafana — El panel de control visual

Es la interfaz donde ves todo. Se conecta a Prometheus para mostrar gráficas de métricas y a Loki para mostrar logs. No almacena nada por sí solo — es puro visual. Tiene dashboards prediseñados para Kubernetes que puedes importar con un click.

```
Grafana
├── Fuente de datos: Prometheus → gráficas de CPU, RAM, pods, etc.
└── Fuente de datos: Loki       → logs de backend, frontend, Oracle
```

**Características clave:**
- Dashboards interactivos y personalizables
- Biblioteca de dashboards comunitarios listos para importar
- Sistema de alertas visual
- Soporte para múltiples fuentes de datos simultáneas

---

### Virtualmin — Panel de administración web

Es una interfaz web instalada directamente en el sistema operativo (no en Kubernetes) que permite administrar el servidor como si fuera un hosting: crear dominios, configurar Nginx/Apache, gestionar SSL, correo, DNS, bases de datos, usuarios del sistema, etc. Es como tener cPanel pero open source y gratuito.

**Características clave:**
- Gestión de dominios virtuales y subdominios
- Configuración de certificados SSL (Let's Encrypt integrado)
- Administración de usuarios del sistema
- Gestión de bases de datos MySQL/PostgreSQL
- Configuración de servidores web (Nginx/Apache)
- Servidor de correo electrónico

> **Nota importante:** Virtualmin se instala en el **master** directamente sobre Oracle Linux, fuera de Kubernetes. Usa el puerto 10000 para su panel web. Hay que asegurarse de no colisionar con servicios del cluster en los puertos 80 y 443.

---

## Arquitectura del monitoreo

```
┌─────────────────────────────────────────────────────┐
│  Grafana (en k8s — namespace: monitoring)           │
│   ├── Dashboard: métricas de nodos                  │
│   ├── Dashboard: métricas de pods Kubernetes        │
│   └── Dashboard: logs de aplicaciones               │
└──────────────┬──────────────────────┬───────────────┘
               │                      │
          Prometheus                Loki
          (en k8s)                (en k8s)
               │                      │
        ┌──────┴──────┐        ┌──────┴──────┐
        │ Node        │        │  Promtail   │
        │ Exporter    │        │  (DaemonSet)│
        │ (DaemonSet) │        │             │
        └─────────────┘        └─────────────┘
        vps-eric + vps-nikte + vps-stephanie
```

---

## Flujo de datos

### Métricas (números)
```
Sistema Operativo / Pods
        ↓
  Node Exporter (:9100)
        ↓ scrape cada 15s
   Prometheus (almacena series temporales)
        ↓ consulta PromQL
    Grafana (visualiza gráficas)
```

### Logs (texto)
```
Archivos de log / stdout de contenedores
        ↓
  Promtail (lee y etiqueta logs)
        ↓ push
   Loki (almacena por etiquetas)
        ↓ consulta LogQL
    Grafana (visualiza logs)
```

---

## Implementación prevista

El stack de monitoreo se desplegará en Kubernetes usando **Helm** en un namespace dedicado `monitoring`, mientras que Virtualmin se instalará directamente en el sistema operativo del master.

| Componente     | Método de instalación | Nodo          | Puerto |
|----------------|-----------------------|---------------|--------|
| Prometheus     | Helm (k8s)            | Automático    | 9090   |
| Grafana        | Helm (k8s)            | Automático    | 3000   |
| Loki           | Helm (k8s)            | Automático    | 3100   |
| Promtail       | Helm DaemonSet (k8s)  | Todos         | -      |
| Node Exporter  | Helm DaemonSet (k8s)  | Todos         | 9100   |
| Virtualmin     | Script directo (OS)   | vps-eric      | 10000  |
