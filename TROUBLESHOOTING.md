# 🚨 Guía de Solución de Problemas PWA

## 🔍 Panel de Debug

Durante desarrollo (localhost), verás un panel de debug en la esquina superior izquierda que muestra:
- Estado del Service Worker
- Conexión a internet
- Uso de almacenamiento
- Estado de CouchDB

## ❌ Problemas Comunes

### 1. "No se puede conectar a CouchDB"

**Posibles causas:**
- CouchDB no está ejecutándose en 10.1.1.134:5984
- Firewall bloqueando conexión
- Credenciales incorrectas

**Soluciones:**
```bash
# Verificar que CouchDB esté corriendo
telnet 10.1.1.134 5984

# Probar conexión desde navegador
http://10.1.1.134:5984/_utils

# Verificar credenciales en js/config.js
```

### 2. "Error de CORS"

**Síntomas:** Console shows CORS errors
**Solución:** Configurar CORS en CouchDB admin panel:
1. Ir a http://10.1.1.134:5984/_utils
2. Config → CORS
3. Enable CORS: true
4. Origins: *

### 3. "PWA no se instala"

**Requisitos para instalación:**
- ✅ Servir por HTTPS (o localhost)
- ✅ Manifest.json válido
- ✅ Service Worker registrado
- ✅ Iconos de 192px y 512px

**Verificar:**
- Abrir DevTools → Application → Manifest
- Application → Service Workers

### 4. "No funciona offline"

**Verificar:**
1. Service Worker registrado correctamente
2. Cache poblado (DevTools → Application → Storage)
3. IndexedDB funcionando (DevTools → Application → IndexedDB)

### 5. "Datos no se sincronizan"

**Pasos de debug:**
1. Verificar conexión a CouchDB en panel debug
2. Revisar console por errores de sync
3. Verificar permisos de base de datos

## 🧪 Tests Automáticos

Usar el botón "Test Todo" en el panel debug para verificar:
- IndexedDB
- Service Worker
- CouchDB
- Manifest

## 🛠️ Comandos Útiles

### Limpiar todo y empezar de cero
```javascript
// En console del navegador
pwaDebugger.clearData()
```

### Verificar estado de sync
```javascript
// En console del navegador
app.db.syncHandler
```

### Forzar sync manual
```javascript
// En console del navegador
app.db.checkRemoteConnection()
```

### Verificar configuración
```javascript
// En console del navegador
CONFIG
```

## 📋 Checklist de Despliegue

Antes de production:

- [ ] Cambiar URLs de desarrollo por producción
- [ ] Generar iconos PNG desde SVG para mejor compatibilidad
- [ ] Configurar HTTPS
- [ ] Configurar CORS en CouchDB
- [ ] Remover panel de debug
- [ ] Minificar archivos JS/CSS
- [ ] Configurar cache headers
- [ ] Probar en dispositivos móviles

## 🔧 Configuración Avanzada

### Cambiar servidor CouchDB
Editar `js/config.js`:
```javascript
const CONFIG = {
  couchdb: {
    host: 'tu-servidor.com',
    port: '5984',
    protocol: 'https', // cambiar a https en producción
    database: 'myapp',
    credentials: {
      username: 'admin',
      password: 'password'
    }
  }
  // ...existing code...
};
```

### Agregar autenticación más segura
```javascript
// La autenticación ya está implementada de forma segura en CONFIG
// Para tokens JWT u otros métodos:
const db = new PouchDB(url, {
  ajax: {
    headers: {
      'Authorization': 'Bearer ' + token
    }
  }
});
```

## 🆕 Nuevas Características

### Panel de Debug Interactivo
- **Arrastrable**: Puedes mover el panel por la pantalla
- **Estado en tiempo real**: Actualización automática de estados
- **Tests integrados**: Botón para probar todos los componentes
- **Limpieza de datos**: Botón para resetear completamente la app

### Configuración Centralizada
- **CONFIG global**: Toda la configuración en un solo lugar
- **Auto-configuración**: CORS y base de datos se configuran automáticamente
- **Logs condicionales**: Solo muestra logs en desarrollo

### Manejo de Errores Mejorado
- **Timeouts configurables**: Evita esperas infinitas
- **Reconexión automática**: Se reconecta cuando vuelve la red
- **Fallback graceful**: Siempre funciona offline aunque falle CouchDB
