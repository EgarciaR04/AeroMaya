# Guía de Implementación CI/CD con GitHub Actions — Aeromaya

## Contexto

Pipeline de CI/CD implementado en `.github/workflows/cicd.yaml` que:
- Construye las imágenes Docker de backend y frontend en paralelo
- Las sube a Docker Hub (`erivas04`)
- Hace `kubectl rollout restart` en el cluster de DigitalOcean

**Secrets guardados en el Environment de GitHub llamado `AEROMAYA PROD`.**

---

## Prerequisitos

- Acceso SSH al master (`vps-eric`: 192.241.135.107)
- Cuenta de Docker Hub activa (`erivas04`)
- Repositorio en GitHub con el código del proyecto
- El pipeline ya está en `.github/workflows/cicd.yaml`

---

## Paso 1 — Abrir el puerto 6443 en DigitalOcean

GitHub Actions necesita conectarse al API server de Kubernetes (puerto 6443) desde internet.

En el panel de DigitalOcean:
1. Ve a **Networking → Firewalls**
2. Click en el firewall asociado a tus droplets
3. Pestaña **Inbound Rules → Add Rule**
   - Type: `TCP`
   - Ports: `6443`
   - Sources: `All IPv4` y `All IPv6`
4. Click **Save**

Verifica desde tu máquina local:

```bash
curl -k https://192.241.135.107:6443/healthz
```

**Resultado esperado:** `ok`

> **Nota:** No usar `firewall-cmd` en los nodos — el firewall del cluster se gestiona solo desde el panel de DigitalOcean (Cloud Firewall).

---

## Paso 2 — Generar el KUBECONFIG_B64 con IP pública

El kubeconfig del cluster usa el alias `k8scp` definido en `/etc/hosts`, que GitHub Actions no puede resolver. Se genera una versión solo para el secret con la IP pública sustituida, sin modificar el kubeconfig local.

Conéctate al master y ejecuta:

```bash
sed 's|https://k8scp:6443|https://192.241.135.107:6443|g' ~/.kube/config | base64 -w 0
```

Copia todo el output (una sola línea larga en base64). Lo necesitas en el Paso 4.

---

## Paso 3 — Crear Access Token en Docker Hub

1. Entra a [hub.docker.com](https://hub.docker.com)
2. Click en tu usuario → **Account Settings**
3. En el menú lateral: **Security → Personal access tokens**
4. Click **Generate new token**
   - Description: `github-actions-aeromaya`
   - Permissions: `Read & Write`
5. Click **Generate** — copia el token ahora, no lo podrás ver de nuevo

---

## Paso 4 — Configurar los Secrets en el Environment `AEROMAYA PROD`

1. Ve a tu repositorio en GitHub
2. **Settings → Environments → AEROMAYA PROD**
3. Agrega los tres secrets:

| Nombre del secret | Valor |
|---|---|
| `DOCKER_USERNAME` | `erivas04` |
| `DOCKER_PASSWORD` | El Access Token del Paso 3 |
| `KUBECONFIG_B64` | El output en base64 del Paso 2 |

> **Importante:** Los secrets deben estar dentro del environment `AEROMAYA PROD`, no en Repository secrets, porque el workflow declara `environment: AEROMAYA PROD` en cada job.

---

## Paso 5 — Subir el código al repositorio

Desde tu máquina local, en la carpeta del proyecto:

```bash
git add .github/workflows/cicd.yaml k8s/03-frontend-deployment.yaml
git commit -m "add CI/CD pipeline with GitHub Actions"
git push origin main
```

---

## Paso 6 — Verificar que el pipeline se dispara

1. Ve a tu repositorio en GitHub → pestaña **Actions**
2. Debe aparecer un workflow corriendo llamado **CI/CD Aeromaya**
3. Click en él para ver los 3 jobs:

```
Build & Push Backend  ──┐
                        ├──► Deploy to Kubernetes
Build & Push Frontend ──┘
```

Los dos primeros corren en paralelo. El deploy espera a que ambos terminen.

---

## Paso 7 — Confirmar el deploy en el cluster

Una vez que el job `Deploy to Kubernetes` termine con check verde:

```bash
kubectl get pods -n aeromaya
```

Los pods deben estar en `Running` con `AGE` reciente (segundos o pocos minutos).

---

## Paso 8 — Smoke test

Abre el navegador en:

```
http://147.182.138.185:30080
```

La app debe cargar normalmente. Haz una búsqueda de vuelos para confirmar que el backend responde.

---

## Resumen visual del flujo

```
git push origin main
        │
        ▼
    GitHub Actions (environment: AEROMAYA PROD)
        │
        ├── Build Backend  → erivas04/aeromaya-backend:latest + :sha
        ├── Build Frontend → erivas04/aeromaya-frontend:latest + :sha
        │
        └── Deploy
              kubectl rollout restart backend  -n aeromaya
              kubectl rollout restart frontend -n aeromaya
                        │
                        ▼
              Cluster DigitalOcean
              (nodos hacen pull de Docker Hub)
```

---

## Detalles técnicos del workflow

- **Archivo:** `.github/workflows/cicd.yaml`
- **Imágenes Docker:** `erivas04/aeromaya-backend` y `erivas04/aeromaya-frontend`
- **Tags generados:** `latest` + SHA corto del commit (ej. `a1b2c3d`)
- **Cache:** GitHub Actions cache por scope (`backend` / `frontend`) para acelerar builds
- **En PRs:** solo hace build (sin push ni deploy) para validar que compila
- **En push a main:** build completo + push a Docker Hub + deploy al cluster

---

## Problemas conocidos y soluciones

| Síntoma en Actions | Causa | Solución |
|---|---|---|
| `Error: Username` en docker/login | Secrets en environment no declarado en el job | Agregar `environment: AEROMAYA PROD` a cada job |
| `Unable to connect to the server` en deploy | Puerto 6443 bloqueado o alias `k8scp` no resuelto | Paso 1 y Paso 2 |
| `error: illegal base64 data` | KUBECONFIG_B64 mal copiado | Repetir Paso 2 |
| `denied: requested access to the resource is denied` | Token de Docker Hub incorrecto | Repetir Paso 3 y 4 |
| `ImagePullBackOff` en el cluster | La imagen no se subió a Docker Hub | Revisar job Build en Actions |
| El workflow no se dispara | Error de sintaxis en el YAML | Verificar indentación del archivo |

---

## Correcciones aplicadas al código

- `k8s/03-frontend-deployment.yaml`: imagen corregida de `MASTER_IP:5000/aeromaya-frontend:latest` a `erivas04/aeromaya-frontend:latest`
