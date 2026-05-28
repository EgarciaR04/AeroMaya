# Aeromaya — Áreas Pendientes para Cumplir la Guía de Sistemas Operativos II

> Documento de trabajo del equipo. Lista los requisitos **obligatorios** de la guía complementaria que aún no están cubiertos en el proyecto Aeromaya, explicados por pasos y con las áreas/componentes por donde abarcarlos.
>
> **Alcance:** solo requisitos obligatorios. No se incluyen las "Opciones de Trabajo Adicional" (aunque el equipo de 3 ya las cubre de hecho, ver nota final).

---

## Resumen rápido del estado

| # | Área pendiente | Sección de la guía | Esfuerzo | Tipo |
|---|---|---|---|---|
| 1 | ConfigMap | 9 | Bajo | Falta crear |
| 2 | fail2ban | 13 | Bajo | Falta instalar |
| 3 | docker-compose.yml + evidencia Docker | 10, 15 | Bajo-Medio | Conflicto de arquitectura |
| 4 | Métricas de aplicación (HTTP/latencia/uptime) | 12 | Medio | Falta exponer |
| 5 | SLA / SLI / SLO | 18 | Medio | Falta definir y medir |
| 6 | VirtualMin | 16, 22 | Medio | Falta instalar |
| 7 | HTTPS / TLS (Ingress) | 13 | Medio | Diferido |
| 8 | Simulación de incidentes | 19 | Bajo-Medio | Demostración pendiente |
| V | Verificaciones (no-root, SSH, firewall, región, presupuesto) | 13, 8, 21 | — | Confirmar |

**Orden sugerido (de menor a mayor esfuerzo):**
ConfigMap → fail2ban → docker-compose → métricas de app + SLO (juntos) → VirtualMin → Ingress/TLS → simulación de incidentes (al final, como demo).

---

## 1. ConfigMap

**Por qué:** La sección 9 exige obligatoriamente un ConfigMap. Actualmente el proyecto no tiene ninguno (solo un Secret).

**Idea:** Mover configuración **no sensible** a un ConfigMap. Las credenciales se quedan en el Secret; lo demás va al ConfigMap.

**Pasos:**
1. Identificar qué configuración no es secreta. Candidatos:
   - El `nginx.conf` del frontend.
   - Variables del backend sin credenciales: perfil de Spring (`SPRING_PROFILES_ACTIVE`), zona horaria, nivel de log, host/puerto de Oracle (la URL JDBC sin usuario/password).
2. Crear el manifiesto `k8s/09-app-configmap.yaml` con esos valores.
3. Referenciarlo en los Deployments con `envFrom.configMapRef` (para variables) o como volumen montado (para el `nginx.conf`).
4. Aplicar y reiniciar el deployment afectado: `kubectl apply -f` + `kubectl rollout restart`.
5. Validar: `kubectl get configmap -n aeromaya` y comprobar que el pod lee los valores.

**Áreas a tocar:** manifiestos `k8s/`, deployments de backend y/o frontend.

---

## 2. fail2ban

**Por qué:** La sección 13 (Seguridad Linux) lo marca como obligatorio. No aparece instalado en ningún nodo.

**Pasos (repetir en los 3 nodos: master + 2 workers):**
1. Instalar el paquete (Oracle Linux usa `dnf`; fail2ban suele venir de EPEL):
   - Habilitar EPEL si hace falta y `dnf install fail2ban`.
2. Crear `/etc/fail2ban/jail.local` (no editar `jail.conf` directamente) con una jaula para SSH (`sshd`), definiendo `bantime`, `findtime` y `maxretry`.
3. Habilitar y arrancar el servicio: `systemctl enable --now fail2ban`.
4. Validar: `fail2ban-client status sshd` debe mostrar la jaula activa.

**Áreas a tocar:** sistema operativo de cada nodo (capa Linux, no Kubernetes).

**Evidencia para el informe:** salida de `fail2ban-client status sshd`.

---

## 3. docker-compose.yml + evidencia de Docker

**Por qué (conflicto real):** La sección 10 pide el `docker-compose.yml` como entregable y la sección 15 exige evidencia de `docker ps -a` y `docker images`. Pero los nodos del cluster corren **solo containerd, sin Docker** — esos comandos no funcionarán ahí.

**Dos caminos posibles:**

**Camino A (recomendado) — Compose local + evidencia desde una máquina con Docker:**
1. Escribir un `docker-compose.yml` que defina los 3 servicios (frontend, backend, oracle) para entorno local de desarrollo. Sirve como entregable de "definición local".
2. Levantarlo en una máquina con Docker (la laptop de un integrante, no el cluster).
3. Capturar `docker ps -a` y `docker images` desde esa máquina como evidencia.

**Camino B — Confirmar evidencia equivalente de containerd:**
1. Preguntar al docente si acepta la evidencia equivalente del runtime real del cluster: `crictl ps -a` y `crictl images` (o `nerdctl`).
2. Si acepta, documentar la equivalencia en el informe (sección Troubleshooting).

> Recomendación: hacer el Camino A para no tocar el cluster, y mencionar en el informe que producción usa containerd.

**Áreas a tocar:** repositorio del proyecto (nuevo `docker-compose.yml`), máquina local de un integrante.

---

## 4. Métricas de aplicación (estado HTTP, disponibilidad, tiempo de respuesta)

**Por qué:** La sección 12 exige métricas de **aplicación**, no solo de infraestructura. El kube-prometheus-stack actual cubre SO y Kubernetes, pero no la app.

**Dos enfoques (combinables):**

**Enfoque 1 — Instrumentar el backend (métricas internas):**
1. Agregar Spring Boot Actuator + Micrometer al backend.
2. Exponer el endpoint `/actuator/prometheus`.
3. Crear un `ServiceMonitor` para que Prometheus haga scrape del backend.
4. Validar que aparece como *target* en Prometheus.

**Enfoque 2 — Sondeo externo (disponibilidad y latencia desde fuera):**
1. Desplegar **blackbox-exporter** en el namespace `monitoring`.
2. Configurarlo para sondear las URLs del frontend y backend (probe HTTP).
3. Obtener métricas de up/down, código HTTP y tiempo de respuesta.
4. Crear un `Probe` o job de scrape en Prometheus apuntando al blackbox.

**Pasos finales (ambos enfoques):**
5. Construir un dashboard en Grafana con: estado HTTP, % de disponibilidad, latencia (p50/p95).
6. Validar que los datos llegan.

**Áreas a tocar:** código del backend (Actuator), namespace `monitoring`, Grafana.

> Hacer esto **junto con el punto 5 (SLA/SLI/SLO)**, porque los SLIs se calculan sobre estas mismas métricas.

---

## 5. SLA / SLI / SLO

**Por qué:** La sección 18 lo marca como conceptos requeridos. No basta definirlos en el informe; conviene medirlos en Grafana.

**Propuesta de valores (ajustar según el equipo):**
- **SLA:** 99.5% de disponibilidad.
- **SLIs (indicadores medibles):** % de uptime, latencia p95, tasa de errores HTTP 5xx.
- **SLOs (objetivos):** menos del 1% de errores HTTP 500; latencia p95 por debajo de un umbral definido.

**Pasos:**
1. Definir los valores de SLA/SLI/SLO por escrito (va en el informe).
2. Una vez existan las métricas de aplicación (punto 4), crear consultas en Prometheus que calculen cada SLI.
3. Montar un panel/dashboard de SLO en Grafana que muestre el cumplimiento.
4. (Opcional pero vistoso) Agregar un *error budget* visual.

**Áreas a tocar:** documentación del informe, Prometheus (queries), Grafana (dashboard).

**Dependencia:** requiere el punto 4 hecho primero.

---

## 6. VirtualMin

**Por qué:** Es **evidencia obligatoria** (sección 16) y **entregable** con URL/IP/puerto/usuario/password (sección 22, punto 4). No es opcional.

**Pasos:**
1. Instalar VirtualMin en el nodo master (`vps-eric`, 192.241.135.107) sobre Oracle Linux.
2. **Cuidar colisión de puertos** con Kubernetes: VirtualMin/Webmin escucha en el **10000**; confirmar que no choca con puertos del control plane (API server 6443, etcd 2379-2380, kubelet 10250, etc.).
3. Abrir el puerto 10000 en el firewall del nodo y en el Cloud Firewall de DO.
4. Acceder por `https://192.241.135.107:10000` y completar el asistente inicial.
5. Documentar URL, IP, puerto, usuario y contraseña para el entregable.

**Áreas a tocar:** sistema operativo del master, firewall.

> **Riesgo a vigilar:** instalar VirtualMin en el master puede competir por recursos con el control plane. Monitorear CPU/RAM del master tras instalarlo.

---

## 7. HTTPS / TLS (Ingress) — diferido pero obligatorio

**Por qué:** La sección 13 marca HTTPS y certificados TLS como **obligatorios**. Se puede dejar para más adelante en el orden de trabajo, pero **no se puede omitir** en la entrega final.

**Plan (ya esbozado, en fases):**
- Fase 0: comprar dominio + DNS (registro A) apuntando a un worker + abrir 80/443.
- Fase 1: instalar ingress-nginx con `hostNetwork` (cluster self-managed, no DOKS).
- Fase 2: migrar el frontend de NodePort 30080 a un `Ingress`.
- Fase 3: instalar cert-manager + `ClusterIssuer` Let's Encrypt (HTTP-01).
- Fase 4: activar TLS y validar HTTPS end-to-end.

**Áreas a tocar:** DNS/dominio, namespace de ingress, cert-manager, manifiestos `k8s/`.

---

## 8. Simulación de incidentes

**Por qué:** La sección 19 exige demostrar caída de pod, caída de contenedor, reinicio de servicio y saturación de CPU, mostrando recuperación + monitoreo + alertas.

**Pasos (es una demostración, no infraestructura nueva):**
1. **Caída de pod:** `kubectl delete pod <pod>` y mostrar cómo el Deployment lo recrea.
2. **Caída de contenedor:** matar el proceso dentro del contenedor y observar el reinicio.
3. **Saturación de CPU:** correr `stress-ng` o `stress` dentro de un pod y ver el pico en Grafana.
4. **Reinicio de servicio:** `kubectl rollout restart deployment/<nombre>`.
5. En cada caso, capturar: recuperación automática, métricas en Grafana y **la alerta disparándose**.

**Áreas a tocar:** cluster (demos en vivo), Grafana, sistema de alertas.

**Dependencia:** se apoya en las alertas pendientes (Telegram) para mostrar la notificación.

---

## Verificaciones (probablemente ya hechas, pero deben constar)

Estos puntos quizá ya están resueltos, pero hay que **confirmarlos y documentarlos** porque la guía los exige:

1. **Usuario no-root con sudo** (sección 13) — confirmar que existe y no se opera todo como root.
2. **SSH seguro + claves SSH** (sección 13) — deshabilitar login de root por SSH, usar solo claves.
3. **Firewall** (sección 13) — documentar estado de firewalld / Cloud Firewall de DO en cada nodo.
4. **Región América** (secciones 7-8) — confirmar que los droplets están en una región de América.
5. **Versión Oracle Linux 10.1** (sección 8) — el contexto menciona Oracle Linux 10; confirmar que es exactamente 10.1.
6. **Presupuesto ≤ $20 vs. mínimo 4 vCPU / 6 GB** (secciones 6, 21) — ese mínimo no suele caber en $20/mes a precio de lista en DigitalOcean; aclarar con el docente el criterio (crédito de prueba, etc.) y tener `lscpu` / `free -h` con números defendibles.
7. **RBAC / control de acceso** (sección 13) — kubeadm trae RBAC por defecto; documentarlo.

---

## Nota sobre el equipo de 3 integrantes

Aunque este documento no entra en las "Opciones de Trabajo Adicional", conviene saber que **para equipos de 3 la guía obliga a implementar una o más**. El proyecto ya las cubre o las tiene en curso:

- Opción 7 (Centralización de logs): **Loki ya instalado** ✅
- Opción 4 (Alertas empresariales): en roadmap (Telegram)
- Opción 3 (Backups automatizados): en roadmap
- Opción 2 (Balanceador / Ingress): en roadmap
- Opción 6 (Escalamiento horizontal / HPA): en roadmap

Es decir, por el lado de las opciones el equipo está más que cubierto.
