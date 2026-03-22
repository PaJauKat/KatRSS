# 🚀 RSS Aggregator CLI

Herramienta de línea de comandos para gestionar y consumir feeds RSS, construida con TypeScript y Drizzle ORM.

## 📋 Comandos Disponibles

### Gestión de Usuarios
Control de cuentas y sesión activa.

* `register <username>` - Crea un nuevo usuario y lo establece como activo.
* `login <username>` - Cambia el usuario actual en la configuración local.
* `users` - Lista todos los usuarios registrados en la base de datos.
* `reset` - **PELIGRO:** Elimina todos los datos (usuarios, feeds y posts).

### Gestión de Feeds
Administración de las fuentes de contenido.

* `addfeed <name> <url>` - Registra un nuevo feed y lo sigue automáticamente (Requiere login).
* `feeds` - Muestra todos los feeds registrados en el sistema.
* `agg <time_between_reqs>` - Inicia el recolector de posts (ej. `1m`, `1h`, `30s`).

### Suscripciones (Social)
Controla qué feeds quieres ver en tu lista personal.

* `follow <url>` - Comienza a seguir un feed existente.
* `unfollow <url>` - Deja de seguir un feed (Requiere login).
* `following` - Lista los feeds que sigues actualmente.

### Lectura de Contenido
Consumo de los posts recolectados por el scraper.

* `posts <limit?>` - Muestra los posts globales almacenados.
* `browser <limit?>` - Muestra los últimos posts de los feeds que **tú sigues**.
    * *Default:* 2 posts.
    * *Orden:* Los más recientes primero.

---

## 🛠️ Desarrollo

1. **Instalar dependencias:**
   ```bash
   npm install