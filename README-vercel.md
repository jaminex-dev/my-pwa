# 🚀 Mi PWA Offline

Una aplicación web progresiva que funciona completamente offline y sincroniza datos automáticamente cuando está en red LAN.

## ✨ Características

- ✅ **Funciona sin internet** - Datos guardados localmente con PouchDB
- ✅ **Instalable como app** - Funciona como aplicación nativa
- ✅ **Sincronización automática** - Cuando estás en red LAN (10.1.1.x)
- ✅ **Acceso web público** - Desde cualquier navegador
- ✅ **Multiplataforma** - Funciona en móviles, tablets y PC
- ✅ **Offline-first** - Siempre disponible, con o sin conexión

## 🌐 Cómo usar

### 📱 Desde Web (Vercel)
1. **Visita**: [https://mi-pwa-offline.vercel.app](https://mi-pwa-offline.vercel.app)
2. **Agrega tareas** - Se guardan localmente automáticamente
3. **Si estás en red LAN** (10.1.1.x), se sincroniza automáticamente con CouchDB

### 💾 Como PWA Instalada
1. **Visita la web** desde tu móvil/PC
2. **Toca "Instalar"** o "Agregar a pantalla inicio"
3. **Usa como app nativa** - Funciona offline completamente
4. **Sincroniza automáticamente** cuando estés en red LAN

## 🔄 Cómo funciona la Sincronización

### 🌐 Modo Internet (Vercel/Web)
- **Almacenamiento**: Solo PouchDB local
- **Sincronización**: No hay (solo local)
- **Persistencia**: Datos se mantienen en el navegador

### 🏠 Modo Red LAN (10.1.1.x)
- **Almacenamiento**: PouchDB local + CouchDB remoto
- **Sincronización**: Automática bidireccional
- **Persistencia**: Datos en navegador + servidor

## 🛠️ Instalación y Uso

### Para usuarios normales:
1. **Abre la URL** en tu navegador
2. **Instala como PWA** (opcional)
3. **Usa la aplicación** - Funciona offline

### Para desarrolladores:
```bash
# Clonar repositorio
git clone <repo-url>

# Servir localmente
python -m http.server 8000
# o
node server.js

# Deploy a Vercel
vercel --prod
```

## 📊 Estados de la Aplicación

| Estado | Descripción | Icono |
|--------|-------------|-------|
| **🌐 Modo Internet** | Solo datos locales | 🌐 |
| **🏠 LAN + CouchDB** | Sincronización activa | ✅ |
| **📱 LAN - Solo local** | En LAN pero sin CouchDB | 📱 |
| **📱 Offline** | Sin conexión | 📱 |

## 🔧 Configuración Técnica

### Red LAN detectada automáticamente:
- `10.1.1.x` (red principal)
- `192.168.x.x` (redes domésticas)
- `172.16.x.x` - `172.31.x.x` (redes privadas)
- `localhost` / `127.0.0.1` (desarrollo)

### CouchDB:
- **Servidor**: `10.1.1.134:5984`
- **Base de datos**: `myapp`
- **Sincronización**: Automática cuando está disponible

## 🐛 Debug y Diagnóstico

### Panel de Debug (solo en desarrollo):
- Aparece automáticamente en desarrollo
- Muestra estado de SW, DB, red y sincronización
- Botones para probar funcionalidades

### Consola del navegador:
```javascript
// Ver estado actual
console.log(window.app.db.getStatus());

// Información del entorno
console.log(CONFIG.getEnvironmentInfo());

// Forzar sincronización
window.app.db.forceSyncNow();
```

## 🚨 Solución de Problemas

### La PWA no se instala:
- Verifica que estés usando HTTPS
- Asegúrate de que el Service Worker esté activo
- Revisa que el manifest.json sea válido

### Los datos no se sincronizan:
- Verifica que estés en red LAN (10.1.1.x)
- Comprueba que CouchDB esté disponible
- Revisa la consola para errores

### La app no funciona offline:
- Verifica que el Service Worker esté registrado
- Revisa que los archivos estén en cache
- Usa las herramientas de Chrome DevTools

## 🎯 Casos de Uso

### 👥 Trabajo en Equipo
- Cada miembro usa la PWA desde su dispositivo
- Cuando están en la oficina (LAN), se sincroniza todo
- Cuando están fuera, trabajan offline

### 📱 Uso Personal
- Accede desde cualquier lugar
- Datos siempre disponibles
- Sincronización automática en casa/oficina

### 🏢 Uso Empresarial
- Deploy público en Vercel
- Sincronización solo en red interna
- Datos sensibles no salen de la LAN

## 🔗 Enlaces Útiles

- **Aplicación Web**: [https://mi-pwa-offline.vercel.app](https://mi-pwa-offline.vercel.app)
- **CouchDB Admin**: [http://10.1.1.134:5984/_utils](http://10.1.1.134:5984/_utils) (solo en LAN)
- **Diagnóstico**: [URL]/diagnostico.html
- **Panel de Control**: [URL]/panel.html

---

**¡Disfruta de tu PWA offline con sincronización inteligente!** 🎉
