# CHANGES_FORK.md

Documentation of all changes, additions, and fixes made to the original repository
[AceMagic-S1-LED-TFT-Linux](https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux).

---

## 1. Required system packages

### Mandatory (runtime)

| Package | Usage |
|---|---|
| `network-manager` | Provides the `nmcli` command, required by `wifi_signal.js` |
| `udev` | Rules for the persistent symlink `/dev/acemagic-led` |
| `systemd` | Management of the `s1panel.service` service |
| `libusb-1.0-0` | Access to the LCD panel USB device |
| `libcairo2` | Canvas rendering (native library for the `canvas` npm package) |
| `libpango-1.0-0` | Fonts and text in canvas |
| `libjpeg8` or `libjpeg-turbo8` | JPEG support in canvas |
| `libgif7` | GIF support in canvas |
| `librsvg2-2` | SVG support in canvas |

### Mandatory (native npm module compilation)

| Package | Usage |
|---|---|
| `build-essential` | `gcc`, `make`, etc. to compile native modules (`canvas`, `serialport`) |
| `python3` | Required by `node-gyp` to compile modules |
| `libcairo2-dev` | Cairo headers for compiling `canvas` |
| `libpango1.0-dev` | Pango headers for compiling `canvas` |
| `libjpeg-dev` | JPEG headers for compiling `canvas` |
| `libgif-dev` | GIF headers for compiling `canvas` |
| `librsvg2-dev` | SVG headers for compiling `canvas` |
| `libusb-1.0-0-dev` | USB headers for compiling `@serialport/bindings-cpp` |
| `libudev-dev` | udev headers for compiling `@serialport/bindings-cpp` |

### Node.js (via NVM)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20.19.5
nvm use 20.19.5
```

### Quick install (Debian/Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y \
  network-manager udev systemd \
  libusb-1.0-0 libcairo2 libpango-1.0-0 libjpeg8 libgif7 librsvg2-2 \
  build-essential python3 \
  libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  libusb-1.0-0-dev libudev-dev
```

---

## 2. Web interface changes

### `s1panel/gui/src/assets/main.css`

**New two-column layout:**

- `html` and `body` set to `height: 100%; overflow: hidden` to prevent unwanted body scroll.
- Added class `.layout-root`: main flex container (`display: flex`, `height: 100vh`, `overflow: hidden`, `gap: 0.75rem`, `padding: 0.75rem`).
- Added class `.panel-left`: left scrollable panel (`flex: 1`, `overflow-y: auto`), contains all widget/sensor configuration.
- Added class `.panel-right`: fixed right panel 380 px wide (`overflow-y: auto`, `flex-direction: column`), contains the LCD preview and global settings.
- Added custom scrollbar style for both panels (5 px wide, transparent background, dark grey thumb).

**New loading overlay:**

- Added class `.loading-overlay`: `fixed` position, covers the entire screen (`inset: 0`), semi-transparent black background (`rgba(0,0,0,0.75)`), `z-index: 9999`, centered with flexbox.
- Added class `.loading-content`: centered column with white text to display the spinner and message.

---

### `s1panel/gui/src/App.vue`

**Two-column layout:**

- The main structure was migrated from a PrimeFlex grid (`<div class="p-3"><div class="grid fluid">`) to a `<div class="layout-root">` container.
- **Right panel** (`.panel-right`, 380 px, fixed): contains the LCD preview card and the Settings card.
- **Left panel** (`.panel-left`, flex-1, scrollable): contains the Configuration card with the full widget/sensor accordion.
- The result is that the preview and settings are always visible while editing the configuration.

**Theme change fix (`onThemeChange`):**

- Before: `onThemeChange()` was an empty function (only `console.log`).
- Now:
  1. Queries `/api/config_dirty` to detect unsaved changes.
  2. If there are unsaved changes, shows a confirmation dialog (group `headless2`) asking whether to save or discard.
  3. In either case calls `_doSwitch()`: saves the theme via `api.save_config({ theme })` and reloads the page.

**Loading overlay on theme change:**

- Added reactive property `loading: { show: false, message: '' }` in `data()`.
- Before calling `api.save_config()`, `loading.show = true` is activated with the message `"Applying theme, please wait..."`.
- The template displays the overlay with a PrimeVue `<ProgressSpinner>` while the service restarts and the page reloads.

---

## 3. Sensor changes

### `sensors/cpu_freq.js` — **NEW**

Sensor that monitors the current CPU frequency (core 0) via sysfs.

**Data source:** `/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq`

**Configuration:**

| Field | Type | Description | Default |
|---|---|---|---|
| `max_points` | number | Number of samples in history | 300 |

**Format fields `{N}`:**

| Token | Description | Unit |
|---|---|---|
| `{0}` | Current CPU frequency | MHz |
| `{1}` | Frequency history (for sparkline/chart) | MHz |

**Reported `min`/`max`:** 0 – `scaling_max_freq` read at startup (auto-detected from sysfs).

---

### `sensors/cpu_temp.js` — **EXTENDED**

Individual per-core temperature reading was added.

**Changes from original:**

- New module variable `_core_temps = []`.
- During the hwmon walk, now also collects all paths whose label starts with `"Core "` (in addition to `"Package id 0"`).
- Reads in parallel `temp_input` from Package + all cores in a single `Promise.all`.
- `get_current_value()` updates `_core_temps` with values rounded to integer.

**New format fields `{N}`:**

| Token | Description |
|---|---|
| `{3}` | Core 0 temperature (°C or °F depending on config) |
| `{4}` | Core 1 temperature |
| `{5}` | Core 2 temperature |
| `{6}` | Core 3 temperature |

The previous tokens `{0}`, `{1}`, `{2}` are unchanged (Package, history, unit).

---

### `sensors/memory.js` — **MODIFIED**

**Change in `usage` precision:**

- Before: `usage` was calculated with `.toFixed(2)` → showed values like `28.65%`.
- Now: `usage` uses `.toFixed(0)` → shows integer values like `28%`.

The rest of the logic and format fields are unchanged.

---

### `sensors/nvme_temp.js` — **NEW**

Sensor that monitors NVMe SSD temperature via hwmon/sysfs.

**Data source:** `/sys/class/hwmon/hwmonX/` where `name == 'nvme'`, label `'Composite'`.

**Configuration:**

| Field | Type | Description | Default |
|---|---|---|---|
| `max_points` | number | Number of samples in history | 300 |
| `fahrenheit` | boolean | Display in Fahrenheit | `false` |

**Format fields `{N}`:**

| Token | Description | Unit |
|---|---|---|
| `{0}` | Current Composite temperature | °C or °F |
| `{1}` | Temperature history (for sparkline/chart) | °C or °F |
| `{2}` | Unit character | `"C"` or `"F"` |

**Reported `min`/`max`:** 20 °C (68 °F) – device critical temperature (read from `temp_crit`, default 84 °C if file does not exist).

---

### `sensors/space.js` — **MODIFIED**

**Compatibility with older Node.js versions:**

- Before: exclusively used `fs.statfs()`, available only since Node.js ≥ 19.6.
- Now: detects at runtime whether `fs.statfs` exists; if not, uses `exec('df -B1 <mount_point>')` as fallback for older versions.

**Value precision:**

- Added property `precision: 0` in the `_private` object, so percentages and MB are displayed without decimals.

**Format fields `{N}` are unchanged.**

---

### `sensors/wifi_signal.js` — **NEW**

Sensor that monitors WiFi signal and connection status using `nmcli`.

**Data source:** `nmcli -t -f IN-USE,SSID,SIGNAL,CHAN,RATE dev wifi`

**Configuration:**

| Field | Type | Description | Default |
|---|---|---|---|
| `interface` | string | WiFi interface (for identification only, nmcli reads the active network) | `"wlp3s0"` |
| `max_points` | number | Number of samples in history | 300 |

**Format fields `{N}`:**

| Token | Description | Example |
|---|---|---|
| `{0}` | Network name (SSID) | `"MyNetwork_5G"` |
| `{1}` | Signal strength (0–100) | `72` |
| `{2}` | WiFi channel | `36` |
| `{3}` | Link speed | `"270 Mbit/s"` |
| `{4}` | Signal history (for sparkline/chart) | `0,0,72,71,...` |
| `{5}` | Connection status | `"online"` / `"offline"` |

**Reported `min`/`max`:** 0 – 100 (signal percentage).

---

## 4. API, configuration, and installer changes

### `s1panel/api.js` — **MODIFIED**

**Fix in `save_config`:**

- Before: the `theme` field was completely ignored in `save_config()`; changing the theme from the GUI did not persist it nor restart the service.
- Now: `request.theme` is evaluated. If the value differs from the active theme, `_live_config.theme` and `_file_config.theme` are updated, `config.json` is persisted, and `_restart = true` is set.
- When the service runs as a daemon (`SERVICE=true`), `_restart = true` triggers `process.exit(1)`, allowing systemd to restart the process with the new theme loaded.

---

### `s1panel/config.json` — **MODIFIED**

**Added sensors:**

| Sensor | Key config |
|---|---|
| `sensors/cpu_freq.js` | `max_points: 300` |
| `sensors/nvme_temp.js` | `max_points: 300`, `fahrenheit: false` |
| `sensors/wifi_signal.js` | `interface: "wlp3s0"`, `max_points: 300` |

**Other changes:**

| Field | Before | Now |
|---|---|---|
| `led_config.device` | `"/dev/ttyUSB0"` | `"/dev/acemagic-led"` (persistent udev symlink) |
| `heartbeat` | (absent) | `60000` ms — periodic LED command resend |
| Network interface | `"enp2s0"` / `"wlp2s0"` | `"enp2s0"` / `"wlp3s0"` (actual WiFi interface name) |

---

### `s1panel/install` — **REWRITTEN**

The install script was completely rewritten to:

1. **Use NVM**: automatically loads `~/.nvm/nvm.sh` and activates Node.js v20.19.5 before any operation.
2. **Build the GUI**: runs `npm i` and `npm run build` in the `gui/` directory as part of the installation.
3. **Dynamically detect the Node path**: uses `which node` to get the absolute path of the binary and write it to the systemd service file, ensuring the service uses the correct Node version regardless of the system PATH.
4. **systemd service management**: generates the `/etc/systemd/system/s1panel.service` file using `sudo tee`, then runs `daemon-reload`, `enable`, and `start` in sequence.

---

## 5. `.gitignore` file — **NEW**

A `.gitignore` was added at the repository root with the following exclusions:

| Pattern | Reason |
|---|---|
| `node_modules/`, `s1panel/node_modules/`, `s1panel/gui/node_modules/` | npm dependencies should not be versioned |
| `s1panel/gui/dist/` | Frontend build artifact |
| `s1panel/snap/.snapcraft/`, `parts/`, `stage/`, `prime/`, `*.snap` | Snap build artifacts |
| `*.log`, `npm-debug.log*` | Runtime logs |
| `.DS_Store`, `Thumbs.db` | Operating system files |
| `.vscode/`, `.idea/`, `*.swp`, `*.swo` | Editor configuration |
| `s1panel/fonts.conf` | Automatically generated at runtime |

---

---

# CHANGES_FORK.md (Español)

Documentación de todos los cambios, adiciones y correcciones realizados sobre el repositorio original
[AceMagic-S1-LED-TFT-Linux](https://github.com/tjaworski/AceMagic-S1-LED-TFT-Linux).

---

## 1. Paquetes del sistema requeridos

### Obligatorios (runtime)

| Paquete | Uso |
|---|---|
| `network-manager` | Provee el comando `nmcli`, requerido por `wifi_signal.js` |
| `udev` | Reglas para el symlink persistente `/dev/acemagic-led` |
| `systemd` | Gestión del servicio `s1panel.service` |
| `libusb-1.0-0` | Acceso al dispositivo USB del panel LCD |
| `libcairo2` | Renderizado de canvas (librería nativa del paquete npm `canvas`) |
| `libpango-1.0-0` | Fuentes y texto en canvas |
| `libjpeg8` o `libjpeg-turbo8` | Soporte JPEG en canvas |
| `libgif7` | Soporte GIF en canvas |
| `librsvg2-2` | Soporte SVG en canvas |

### Obligatorios (compilación de módulos nativos npm)

| Paquete | Uso |
|---|---|
| `build-essential` | `gcc`, `make`, etc. para compilar módulos nativos (`canvas`, `serialport`) |
| `python3` | Requerido por `node-gyp` para compilar módulos |
| `libcairo2-dev` | Headers de Cairo para compilar `canvas` |
| `libpango1.0-dev` | Headers de Pango para compilar `canvas` |
| `libjpeg-dev` | Headers JPEG para compilar `canvas` |
| `libgif-dev` | Headers GIF para compilar `canvas` |
| `librsvg2-dev` | Headers SVG para compilar `canvas` |
| `libusb-1.0-0-dev` | Headers USB para compilar `@serialport/bindings-cpp` |
| `libudev-dev` | Headers udev para compilar `@serialport/bindings-cpp` |

### Node.js (via NVM)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install 20.19.5
nvm use 20.19.5
```

### Instalación rápida (Debian/Ubuntu)

```bash
sudo apt-get update
sudo apt-get install -y \
  network-manager udev systemd \
  libusb-1.0-0 libcairo2 libpango-1.0-0 libjpeg8 libgif7 librsvg2-2 \
  build-essential python3 \
  libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev \
  libusb-1.0-0-dev libudev-dev
```

---

## 2. Cambios de interfaz web

### `s1panel/gui/src/assets/main.css`

**Nuevo layout de dos columnas:**

- `html` y `body` configurados con `height: 100%; overflow: hidden` para evitar scroll indeseado en el body.
- Añadida clase `.layout-root`: contenedor flex principal (`display: flex`, `height: 100vh`, `overflow: hidden`, `gap: 0.75rem`, `padding: 0.75rem`).
- Añadida clase `.panel-left`: panel scrollable izquierdo (`flex: 1`, `overflow-y: auto`), contiene toda la configuración de widgets/sensores.
- Añadida clase `.panel-right`: panel fijo derecho de ancho 380 px (`overflow-y: auto`, `flex-direction: column`), contiene la vista previa del LCD y los settings globales.
- Añadido estilo de scrollbar personalizado para ambos paneles (5 px de ancho, fondo transparente, thumb gris oscuro).

**Nuevo overlay de carga:**

- Añadida clase `.loading-overlay`: posición `fixed`, cubre toda la pantalla (`inset: 0`), fondo semitransparente negro (`rgba(0,0,0,0.75)`), `z-index: 9999`, centrado con flexbox.
- Añadida clase `.loading-content`: columna centrada con texto blanco para mostrar el spinner y el mensaje.

---

### `s1panel/gui/src/App.vue`

**Layout de dos columnas:**

- La estructura principal se migró de una grid de PrimeFlex (`<div class="p-3"><div class="grid fluid">`) a un contenedor `<div class="layout-root">`.
- **Panel derecho** (`.panel-right`, 380 px, fijo): contiene la tarjeta de vista previa del LCD y la tarjeta de Settings.
- **Panel izquierdo** (`.panel-left`, flex-1, scrollable): contiene la tarjeta de Configuration con el acordeón completo de widgets/sensores.
- El resultado es que la vista previa y los settings siempre son visibles mientras se edita la configuración.

**Corrección del cambio de tema (`onThemeChange`):**

- Antes: `onThemeChange()` era una función vacía (solo `console.log`).
- Ahora:
  1. Consulta `/api/config_dirty` para detectar cambios sin guardar.
  2. Si hay cambios sin guardar, muestra un diálogo de confirmación (grupo `headless2`) preguntando si guardar o descartar.
  3. En cualquier caso llama a `_doSwitch()`: guarda el tema via `api.save_config({ theme })` y recarga la página.

**Overlay de carga al cambiar tema:**

- Añadida propiedad reactiva `loading: { show: false, message: '' }` en `data()`.
- Antes de llamar a `api.save_config()`, se activa `loading.show = true` con el mensaje `"Applying theme, please wait..."`.
- El template muestra el overlay con un `<ProgressSpinner>` de PrimeVue mientras el servicio se reinicia y la página recarga.

---

## 3. Cambios en sensores

### `sensors/cpu_freq.js` — **NUEVO**

Sensor que monitorea la frecuencia actual de la CPU (core 0) vía sysfs.

**Fuente de datos:** `/sys/devices/system/cpu/cpu0/cpufreq/scaling_cur_freq`

**Configuración:**

| Campo | Tipo | Descripción | Defecto |
|---|---|---|---|
| `max_points` | number | Número de muestras en el historial | 300 |

**Campos de formato `{N}`:**

| Token | Descripción | Unidad |
|---|---|---|
| `{0}` | Frecuencia actual del CPU | MHz |
| `{1}` | Historial de frecuencias (para sparkline/chart) | MHz |

**`min`/`max` reportado:** 0 – `scaling_max_freq` leído al inicio (auto-detectado desde sysfs).

---

### `sensors/cpu_temp.js` — **EXTENDIDO**

Se añadió la lectura de temperaturas por core individual.

**Cambios respecto al original:**

- Nueva variable de módulo `_core_temps = []`.
- Durante el walk de hwmon, ahora también recoge todos los paths cuya label empieza por `"Core "` (además del `"Package id 0"`).
- Lee en paralelo `temp_input` de Package + todos los cores en un solo `Promise.all`.
- `get_current_value()` actualiza `_core_temps` con los valores redondeados a entero.

**Nuevos campos de formato `{N}`:**

| Token | Descripción |
|---|---|
| `{3}` | Temperatura Core 0 (°C o °F según config) |
| `{4}` | Temperatura Core 1 |
| `{5}` | Temperatura Core 2 |
| `{6}` | Temperatura Core 3 |

Los tokens anteriores `{0}`, `{1}`, `{2}` no cambian (Package, historial, unidad).

---

### `sensors/memory.js` — **MODIFICADO**

**Cambio en precisión de `usage`:**

- Antes: `usage` se calculaba con `.toFixed(2)` → mostraba valores como `28.65%`.
- Ahora: `usage` usa `.toFixed(0)` → muestra valores enteros como `28%`.

El resto de la lógica y campos de formato no cambian.

---

### `sensors/nvme_temp.js` — **NUEVO**

Sensor que monitorea la temperatura del SSD NVMe via hwmon/sysfs.

**Fuente de datos:** `/sys/class/hwmon/hwmonX/` donde `name == 'nvme'`, label `'Composite'`.

**Configuración:**

| Campo | Tipo | Descripción | Defecto |
|---|---|---|---|
| `max_points` | number | Número de muestras en el historial | 300 |
| `fahrenheit` | boolean | Mostrar en Fahrenheit | `false` |

**Campos de formato `{N}`:**

| Token | Descripción | Unidad |
|---|---|---|
| `{0}` | Temperatura Composite actual | °C o °F |
| `{1}` | Historial de temperaturas (para sparkline/chart) | °C o °F |
| `{2}` | Carácter de unidad | `"C"` o `"F"` |

**`min`/`max` reportado:** 20 °C (68 °F) – temperatura crítica del dispositivo (leída de `temp_crit`, por defecto 84 °C si no existe el archivo).

---

### `sensors/space.js` — **MODIFICADO**

**Compatibilidad con versiones antiguas de Node.js:**

- Antes: usaba exclusivamente `fs.statfs()`, disponible solo desde Node.js ≥ 19.6.
- Ahora: detecta en runtime si `fs.statfs` existe; si no, utiliza `exec('df -B1 <mount_point>')` como fallback para versiones anteriores de Node.

**Precisión de valores:**

- Añadida propiedad `precision: 0` en el objeto `_private`, de modo que los porcentajes y MB se muestran sin decimales.

**Los campos de formato `{N}` no cambian.**

---

### `sensors/wifi_signal.js` — **NUEVO**

Sensor que monitorea la señal y estado de la conexión WiFi usando `nmcli`.

**Fuente de datos:** `nmcli -t -f IN-USE,SSID,SIGNAL,CHAN,RATE dev wifi`

**Configuración:**

| Campo | Tipo | Descripción | Defecto |
|---|---|---|---|
| `interface` | string | Interfaz WiFi (solo para identificación, nmcli lee la red activa) | `"wlp3s0"` |
| `max_points` | number | Número de muestras en el historial | 300 |

**Campos de formato `{N}`:**

| Token | Descripción | Ejemplo |
|---|---|---|
| `{0}` | Nombre de la red (SSID) | `"MiRed_5G"` |
| `{1}` | Intensidad de señal (0–100) | `72` |
| `{2}` | Canal WiFi | `36` |
| `{3}` | Velocidad de enlace | `"270 Mbit/s"` |
| `{4}` | Historial de señal (para sparkline/chart) | `0,0,72,71,...` |
| `{5}` | Estado de conexión | `"online"` / `"offline"` |

**`min`/`max` reportado:** 0 – 100 (porcentaje de señal).

---

## 4. Cambios en API, configuración e instalador

### `s1panel/api.js` — **MODIFICADO**

**Corrección en `save_config`:**

- Antes: el campo `theme` era completamente ignorado en `save_config()`; cambiar de tema desde la GUI no persistía ni reiniciaba el servicio.
- Ahora: se evalúa `request.theme`. Si el valor es diferente al tema activo, se actualizan `_live_config.theme` y `_file_config.theme`, se persiste el `config.json` y se activa `_restart = true`.
- Cuando el servicio corre como daemon (`SERVICE=true`), `_restart = true` provoca `process.exit(1)`, lo que permite a systemd reiniciar el proceso con el nuevo tema cargado.

---

### `s1panel/config.json` — **MODIFICADO**

**Sensores añadidos:**

| Sensor | Config clave |
|---|---|
| `sensors/cpu_freq.js` | `max_points: 300` |
| `sensors/nvme_temp.js` | `max_points: 300`, `fahrenheit: false` |
| `sensors/wifi_signal.js` | `interface: "wlp3s0"`, `max_points: 300` |

**Otros cambios:**

| Campo | Antes | Ahora |
|---|---|---|
| `led_config.device` | `"/dev/ttyUSB0"` | `"/dev/acemagic-led"` (symlink udev persistente) |
| `heartbeat` | (ausente) | `60000` ms — reenvío periódico del comando LED |
| Interfaz de red | `"enp2s0"` / `"wlp2s0"` | `"enp2s0"` / `"wlp3s0"` (nombre real de la interfaz WiFi) |

---

### `s1panel/install` — **REESCRITO**

El script de instalación fue reescrito completamente para:

1. **Usar NVM**: carga automáticamente `~/.nvm/nvm.sh` y activa Node.js v20.19.5 antes de cualquier operación.
2. **Construir la GUI**: ejecuta `npm i` y `npm run build` en el directorio `gui/` como parte de la instalación.
3. **Detectar la ruta de Node dinámicamente**: usa `which node` para obtener la ruta absoluta del binario y escribirla en el archivo de servicio systemd, garantizando que el servicio use la versión correcta de Node independientemente del PATH del sistema.
4. **Gestión del servicio systemd**: genera el archivo `/etc/systemd/system/s1panel.service` usando `sudo tee`, ejecuta `daemon-reload`, `enable` y `start` en secuencia.

---

## 5. Archivo `.gitignore` — **NUEVO**

Se añadió `.gitignore` en la raíz del repositorio con las siguientes exclusiones:

| Patrón | Motivo |
|---|---|
| `node_modules/`, `s1panel/node_modules/`, `s1panel/gui/node_modules/` | Dependencias npm no deben versionarse |
| `s1panel/gui/dist/` | Artefacto de build del frontend |
| `s1panel/snap/.snapcraft/`, `parts/`, `stage/`, `prime/`, `*.snap` | Artefactos del build snap |
| `*.log`, `npm-debug.log*` | Logs en tiempo de ejecución |
| `.DS_Store`, `Thumbs.db` | Archivos de sistema operativo |
| `.vscode/`, `.idea/`, `*.swp`, `*.swo` | Configuración de editores |
| `s1panel/fonts.conf` | Generado automáticamente en runtime |
