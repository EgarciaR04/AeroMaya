# Contexto del Proyecto Aeromaya — Para continuar conversación

## Descripción del proyecto
Aplicación de reservas de vuelos "Aeromaya" desplegada en Kubernetes sobre DigitalOcean con Oracle Linux.

**Stack:**
- Frontend: Angular 20 + Nginx
- Backend: Spring Boot + Java 21 + Oracle JDBC
- Base de datos: Oracle Free 23ai (imagen: gvenzl/oracle-free)
- Registry de imágenes: Docker Hub (usuario: erivas04)

---

## Infraestructura del cluster

| Nodo | Hostname | IP | Rol |
|---|---|---|---|
| Master | vps-eric | 192.241.135.107 | Control plane |
| Worker 1 | vps-stephanie | 147.182.138.185 | Pods generales |
| Worker 2 | vps-nikte | 198.211.100.110 | Pods generales + Oracle |

**Configuraciones importantes del cluster:**
- Sistema operativo: Oracle Linux 10 con kernel UEK 6.12.0-202.76.4.4
- CNI: Calico (en namespaces calico-system y calico-apiserver)
- CRI: containerd (sin Docker en los nodos)
- SELinux: Permissive en todos los nodos
- Swap: deshabilitado en todos los nodos
- Módulos de kernel cargados: ip_set, ip_set_hash_net, ip_set_hash_ip, xt_set
- Archivo persistente de módulos: /etc/modules-load.d/calico-ipset.conf

---

## Estado actual de los pods

### Namespace aeromaya
```
backend (3 réplicas)   → imagen: erivas04/aeromaya-backend:latest
frontend (3 réplicas)  → imagen: erivas04/aeromaya-frontend:latest
oracle-db (1 réplica)  → imagen: gvenzl/oracle-free:latest
                          datos en: /data/oracle en vps-nikte
                          nodeSelector: role=oracle en vps-nikte
```

**Acceso al frontend:** http://147.182.138.185:30080 o http://198.211.100.110:30080

### Namespace monitoring
```
kube-prometheus-stack (Prometheus + Grafana + Node Exporter + AlertManager)
loki (Loki 3.x en modo SingleBinary)
promtail (DaemonSet en los 3 nodos)
```

**Acceso a Grafana:** http://147.182.138.185:32000
- Usuario: admin
- Contraseña: Aeromaya1234!

---

## Manifiestos Kubernetes (carpeta k8s/)

```
k8s/
├── 00-namespace.yaml
├── 01-backend-deployment.yaml   (con vars Oracle + initContainer wait-for-oracle)
├── 02-backend-service.yaml      (ClusterIP)
├── 03-frontend-deployment.yaml
├── 04-frontend-service.yaml     (NodePort 30080)
├── 05-oracle-secret.yaml        (credenciales Oracle)
├── 06-oracle-deployment.yaml    (Deployment con nodeSelector role=oracle)
├── 07-oracle-service.yaml       (ClusterIP)
└── 08-oracle-pv.yaml            (PV hostPath + PVC en vps-nikte)
```

**Credenciales Oracle:**
- Oracle SYS/SYSTEM password: Oracle1234
- Usuario app: aeromaya / Aeromaya1234
- JDBC URL: jdbc:oracle:thin:@oracle-service:1521/FREEPDB1

---

## Configuración de monitoreo (carpeta monitoring/)

### Archivos de valores Helm
- `monitoring/prometheus-values.yaml` — kube-prometheus-stack con SMTP configurado
- `monitoring/loki-values.yaml` — ya no se usa (se instaló con flags directos)

### Comandos de instalación usados
```bash
# Prometheus + Grafana + Node Exporter
helm install kube-prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring --values ~/prometheus-values.yaml

# Loki 3.x
helm upgrade --install loki grafana/loki \
  --namespace monitoring \
  --set deploymentMode=SingleBinary \
  --set loki.auth_enabled=false \
  --set loki.commonConfig.replication_factor=1 \
  --set loki.storage.type=filesystem \
  --set loki.useTestSchema=true \
  --set singleBinary.replicas=1 \
  --set read.replicas=0 \
  --set write.replicas=0 \
  --set backend.replicas=0 \
  --set chunksCache.enabled=false \
  --set resultsCache.enabled=false \
  --set monitoring.selfMonitoring.enabled=false \
  --set monitoring.selfMonitoring.grafanaAgent.installOperator=false \
  --set test.enabled=false

# Promtail
helm upgrade --install promtail grafana/promtail \
  --namespace monitoring \
  --set config.lokiAddress=http://loki-gateway.monitoring.svc.cluster.local/loki/api/v1/push
```

### Datasources configurados en Grafana
- Prometheus: configurado automáticamente por kube-prometheus-stack
- Loki: URL http://loki-gateway.monitoring.svc.cluster.local

---

## Pendiente de implementar

### 1. Alertas de monitoreo
Se intentó configurar notificaciones por email pero DigitalOcean bloquea el puerto SMTP 587 en droplets nuevos. Opciones:
- **Telegram** (recomendado): funciona sobre HTTPS puerto 443, más fácil
- **Ticket a DigitalOcean**: solicitar desbloqueo del puerto 587 en soporte

Alertas planeadas:
- CPU alta: uso > 80% por más de 5 minutos
- Memoria alta: uso > 85% por más de 5 minutos
- Pod caído: reinicios > 3 en la última hora
- Servicio caído: pod no en estado Running

### 2. Virtualmin en el master
Instalar Virtualmin directamente en vps-eric (192.241.135.107) sobre Oracle Linux.
Panel accesible en puerto 10000. Cuidar no colisionar con puertos de Kubernetes.

### 3. Ingress Controller
Configurar un Ingress Controller para acceder al frontend con un dominio real en vez del NodePort 30080.

### 4. HorizontalPodAutoscaler (HPA)
Configurar escalado automático de pods según carga de CPU/memoria.

---

## Problemas conocidos y soluciones aplicadas

| Problema | Causa | Solución |
|---|---|---|
| Calico 0/1 en workers | Módulos ip_set no cargados | Instalar kernel-uek-modules-extra + modprobe |
| Kubelet falla al reiniciar | Swap activado por nuevo kernel | swapoff -a + comentar en /etc/fstab |
| kubectl logs falla (no route to host) | SELinux Enforcing | setenforce 0 + editar /etc/selinux/config |
| ImagePullBackOff | Registry k8scp:5000 inexistente | Usar Docker Hub (erivas04) |
| Loki incompatible con Grafana 11 | loki-stack instala Loki 2.x | Instalar grafana/loki 3.x |
| SMTP timeout | DO bloquea puerto 587 | Pendiente: usar Telegram o ticket a DO |

---

## Repositorios Helm agregados
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
```
