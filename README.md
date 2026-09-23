# Overlay de logros de Steam para OBS

Muestra tu progreso de logros en un juego de Steam como una insignia transparente,
pensada para pegarse en OBS como **fuente de navegador** y refrescarse sola durante
todo el stream.

```
┌─────────────────────────────────────┐
│  [img]  Vampire Survivors    20/243 │
│         ███░░░░░░░░░░░░░░░░░░    8% │
└─────────────────────────────────────┘
```

Cuando desbloqueas un logro, el número sube y la insignia da un destello dorado.

---

## Requisitos

- Node.js 20 o superior
- Una cuenta de Steam con el **perfil y los detalles de juego en público**
  (si están en privado la API responde vacía y no se verá nada)

## Configuración

Crea un archivo `.env` en la raíz:

```
STEAM_API_KEY=tu_clave
STEAM_ID=tu_steamid64
```

- **`STEAM_API_KEY`**: se saca en <https://steamcommunity.com/dev/apikey>
- **`STEAM_ID`**: tu SteamID64, el número de 17 dígitos. Si no lo sabes, lo puedes
  buscar en <https://steamid.io> con la URL de tu perfil.

El `.env` está en `.gitignore`, así que no se sube al repositorio.

## Desarrollo local

```bash
npm install
npx netlify dev
```

Abre <http://localhost:8888>.

> **Importante: `npm run dev` a secas no sirve.** Levanta solo Vite, sin las Netlify
> Functions, así que todas las llamadas a `/api/*` devuelven 404 y el overlay se queda
> en blanco. Usa siempre `npx netlify dev`, que levanta ambas cosas en el puerto 8888.

## Cómo obtener la URL del overlay

1. Abre <http://localhost:8888> (o tu sitio desplegado).
2. Busca el juego en el campo de búsqueda.
3. Pulsa **Copiar URL**.

Solo aparecen los juegos con estadísticas públicas, que son los únicos que exponen
logros por la API.

## Parámetros de la URL

| Parámetro | Por defecto | Qué hace |
|---|---|---|
| `appid` | — | Obligatorio. El id del juego en Steam. |
| `interval` | `60` | Segundos entre refrescos. Rango 30–300 (en modo demo, desde 5). |
| `debug` | apagado | Muestra los errores y la hora del último refresco en pantalla. Sin esto, si algo falla el overlay queda invisible. |
| `demo` | apagado | Hace subir el contador solo. Ver [Modo demo](#modo-demo). |
| `demoStep` | `1` | Logros que suma el demo en cada refresco. |

Ejemplo:

```
https://tu-sitio.netlify.app/overlay?appid=1794680&interval=30
```

## Configuración en OBS

1. En **Fuentes**, pulsa **+** → **Navegador**.
2. Pega la URL del overlay.
3. Pon el tamaño en **460 × 110**.
4. **Desmarca estas dos casillas:**
   - *Apagar la fuente cuando no esté visible*
   - *Actualizar el navegador cuando la escena se active*

El paso 4 importa: con esas casillas activadas OBS recarga la página entera cada vez
que cambias de escena. Al recargar se pierde el conteo anterior, así que el overlay no
tiene con qué comparar y **el destello de logro nuevo nunca se dispara**. Dejándolas
desmarcadas la página sigue viva y se pone al día sola al volver a la escena.

No hace falta tocar el CSS personalizado: el overlay ya tiene fondo transparente.

## Modo demo

Los logros de Steam no se desbloquean cuando uno quiere. Puedes jugar media hora sin
que el número se mueva, y entonces es imposible saber si el overlay está refrescando
o simplemente no hay nada nuevo que mostrar.

El modo demo resuelve eso: hace subir el contador de forma artificial y predecible,
pasando por la cadena real completa (petición al servidor, anticaché, polling y
animación), para que puedas comprobarlo con los ojos en menos de un minuto.

```
http://localhost:8888/overlay?appid=1794680&demo=1&interval=5&demoStep=25
```

Con esa URL, cada 5 segundos deberías ver:

- el contador subir de 25 en 25,
- la barra crecer un 10% aproximadamente,
- un destello dorado alrededor de la insignia,
- y la etiqueta **DEMO** junto al nombre del juego.

Al llegar al total, el ciclo vuelve a empezar. En la página principal tienes un botón
**Copiar URL de prueba (demo)** que ya arma esa URL por ti.

La etiqueta **DEMO** está justamente para que no salgas en vivo con números falsos si
se te olvida quitar el parámetro. El modo demo funciona incluso sin `STEAM_API_KEY`
configurada: si Steam no responde, usa datos inventados.

## Despliegue

El proyecto está pensado para Netlify:

```bash
npx netlify deploy --prod
```

Después, en el panel de Netlify, ve a **Site configuration → Environment variables** y
carga `STEAM_API_KEY` y `STEAM_ID`. El `.env` local no se sube, así que sin este paso
las funciones fallarán en producción.

## Solución de problemas

| Síntoma | Qué mirar |
|---|---|
| El overlay no muestra nada | Añade `&debug=1` a la URL: en vez de quedar invisible te dirá el error concreto. |
| En OBS no aparece nada, pero en el navegador sí | Si la URL apunta a `localhost:8888`, necesitas `npx netlify dev` corriendo. Para usarlo sin la terminal abierta, despliega y usa la URL de Netlify. |
| Sale un recuadro negro tapando la escena | Caché vieja del navegador de OBS. Clic derecho en la fuente → *Actualizar caché de la página actual*. |
| Los números no cambian nunca | Añade `&debug=1` y mira el reloj del último refresco: si avanza, el overlay funciona y es que no has desbloqueado logros. Si no avanza, revisa la consola (ver abajo). |
| El destello dorado nunca aparece | Revisa las dos casillas del paso 4 de [Configuración en OBS](#configuración-en-obs). |

### Depurar dentro de OBS

OBS usa Chromium por dentro y se le pueden abrir las DevTools. Cierra OBS y ábrelo así
(el `cd` previo es obligatorio, si no OBS no arranca):

```
cd /d D:\obs-studio\bin\64bit
obs64.exe --remote-debugging-port=9222
```

Luego abre <http://localhost:9222> en Chrome y haz clic en la página del overlay.
Tienes la pestaña **Network** completa para ver cada petición, su código de estado y si
se está sirviendo desde caché, además de la consola.

## Estructura

```
netlify/functions/   endpoints /api/library y /api/achievements
netlify/lib/         construcción de las URLs de la Steam Web API
shared/types.ts      tipos compartidos entre frontend y functions
src/pages/Home.tsx   buscador de juegos y generador de la URL
src/pages/Overlay.tsx  la insignia que se pega en OBS
```
