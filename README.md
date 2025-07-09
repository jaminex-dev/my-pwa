# Mi PWA Offline

Una Progressive Web App que funciona offline usando PouchDB/CouchDB para sincronización de datos.

## 🚀 Características Principales

- **💾 Almacenamiento Offline**: Datos guardados localmente con PouchDB
- **🔄 Sincronización Diferida**: Sincronización automática cuando se recupera la conexión
- **📱 Progressive Web App**: Funciona como app nativa en móviles
- **🌐 Trabajo Offline**: Funciona completamente sin conexión
- **🔍 Panel de Debug**: Herramientas integradas para diagnóstico
- **🔧 Configuración Centralizada**: Configuración CORS y credenciales automáticas
- **📊 Diagnóstico Completo**: Página de diagnóstico y herramientas de prueba

## 🛠️ Funcionalidades de Sincronización

### Sincronización Diferida Mejorada
- **Reconexión Automática**: Detecta automáticamente cuando se recupera la conexión
- **Sincronización Inmediata**: Los datos offline se sincronizan automáticamente al reconectar
- **Manejo de Errores**: Reintentos automáticos con backoff exponencial
- **Sincronización Continua**: Mantiene sincronización en tiempo real cuando hay conexión

### Herramientas de Debug
- **Panel de Debug**: Estado en tiempo real de SW, DB, red y sincronización
- **Interfaz de Prueba**: `test-sync.html` para probar escenarios de sincronización
- **Diagnóstico PWA**: `diagnostico.html` para verificar estado de la PWA
- **Logs Detallados**: Información completa sobre el estado de sincronización

## 🗂️ Estructura del Proyecto

```
my-pwa/
├── index.html          # Página principal de la PWA
├── manifest.json       # Manifiesto PWA
├── sw.js              # Service Worker para cache offline
├── test-sync.html     # 🆕 Interfaz de prueba de sincronización
├── diagnostico.html   # 🆕 Página de diagnóstico PWA
├── test-sync.js       # 🆕 Script de pruebas
├── css/
│   └── style.css      # Estilos principales
├── js/
│   ├── app.js         # Lógica principal de la aplicación
│   ├── database.js    # 🔄 Gestión de base de datos y sincronización
│   ├── ui.js          # Gestión de interfaz de usuario
│   ├── config.js      # 🔧 Configuración centralizada
│   └── debug.js       # 🆕 Panel de debug y herramientas
├── icons/             # Iconos PWA generados
│   ├── icon-192.svg   # Icono 192x192 (fondo azul + "MX")
│   ├── icon-512.svg   # Icono 512x512 (fondo azul + "MX")
│   ├── icon-192.png   # Versión PNG del icono 192x192
│   └── icon-512.png   # Versión PNG del icono 512x512
├── README.md          # Documentación principal
└── TROUBLESHOOTING.md # 🆕 Guía de solución de problemas
```

## 🧪 Pruebas de Sincronización

### Interfaz de Prueba (`test-sync.html`)
Una interfaz completa para probar todos los aspectos de la sincronización:
- **Estado en tiempo real** de conexión y sincronización
- **Agregar datos offline** para probar funcionalidad offline
- **Forzar sincronización** para probar reconexión manual
- **Reset de conexión** para probar recuperación de errores
- **Limpiar datos** para empezar pruebas desde cero

### Cómo Probar la Sincronización
```bash
# 1. Abre test-sync.html en tu navegador
# 2. Verifica que aparezca "Online" en el estado
# 3. Haz clic en "Agregar Datos Offline"
# 4. Desconecta la red (o simula offline)
# 5. Agrega más datos offline
# 6. Reconecta la red
# 7. Haz clic en "Forzar Sincronización"
# 8. Verifica que los datos se sincronicen automáticamente
```

### Indicadores de Éxito
- ✅ Estado cambia a "Online - Sync Activo"
- ✅ Los datos offline aparecen en CouchDB
- ✅ No hay errores en la consola del navegador
- ✅ El panel de debug muestra sync exitoso

## 🔧 Configuración

### 1. CouchDB (Configurado automáticamente)
La PWA está configurada para conectarse a tu servidor CouchDB:
- **Servidor**: 10.1.1.134:5984
- **Usuario**: admin
- **Base de datos**: myapp

La configuración se hace automáticamente al cargar la app. Si hay problemas de conexión, la app funcionará solo en modo offline.

### 2. Iconos PWA (Incluidos)
Los iconos PWA ya están incluidos:
- ✅ `icon-192.svg` (192x192px) - Fondo azul con "MX"
- ✅ `icon-512.svg` (512x512px) - Fondo azul con "MX"

## Uso

### Desarrollo Local
```bash
# Servir con cualquier servidor HTTP
python -m http.server 8000
# o
npx serve .
# o
php -S localhost:8000
```

### Características de la App

- **Agregar tareas**: Escribe en el input y presiona Enter o el botón
- **Marcar completadas**: Click en el checkbox
- **Eliminar**: Click en el botón de basura
- **Estado de conexión**: Se muestra en el header

### Funcionamiento

1. **Online con CouchDB**: Datos se guardan local y se sincronizan automáticamente
2. **Online sin CouchDB**: Datos se guardan solo localmente
3. **Offline**: Todo funciona normal, datos se guardan localmente

## Personalización

### Cambiar URL de CouchDB
En `js/database.js`:
```javascript
this.couchdbUrl = 'http://tu-servidor:5984/tu-base-datos';
```

### Agregar más campos
Modificar la estructura del documento en `js/app.js`:
```javascript
await this.db.create({
  type: 'task',
  title: title,
  description: description, // Nuevo campo
  priority: 'normal',       // Nuevo campo
  completed: false
});
```

## Tecnologías Usadas

- **PouchDB**: Base de datos local (IndexedDB)
- **CouchDB**: Base de datos servidor (opcional)
- **Service Worker**: Cache offline
- **Progressive Web App**: Instalable y offline-first
