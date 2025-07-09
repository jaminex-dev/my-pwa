# 🚀 Deploy a Vercel - Guía Completa

## 📋 Pasos para Deploy

### 1. Preparar el proyecto
```bash
# Verificar que tienes todos los archivos
ls -la

# Archivos necesarios:
# ✅ vercel.json
# ✅ manifest.json
# ✅ sw.js
# ✅ js/config.js (actualizado)
# ✅ js/database.js (nueva versión)
# ✅ .gitignore
```

### 2. Instalar Vercel CLI
```bash
# Instalar globalmente
npm install -g vercel

# O usar npx (sin instalar)
npx vercel
```

### 3. Hacer Deploy
```bash
# Desde el directorio del proyecto
cd my-pwa

# Deploy inicial
vercel

# Deploy a producción
vercel --prod
```

### 4. Configurar dominio (opcional)
```bash
# Agregar dominio personalizado
vercel domains add tu-dominio.com
vercel alias set tu-pwa-deployment.vercel.app tu-dominio.com
```

## 📊 Configuración Vercel

### vercel.json ya está configurado para:
- ✅ Servir archivos estáticos
- ✅ Headers correctos para PWA
- ✅ Cache optimizado
- ✅ Service Worker sin cache

### Variables de entorno (si necesitas):
```bash
# Configurar variables (opcional)
vercel env add VARIABLE_NAME
```

## 🧪 Probar después del Deploy

### 1. Verificar PWA
- [ ] Abrir URL en Chrome
- [ ] Verificar que aparece opción "Instalar"
- [ ] Comprobar Service Worker en DevTools
- [ ] Probar funcionalidad offline

### 2. Probar sincronización
- [ ] Desde internet: Solo datos locales
- [ ] Desde LAN: Sincronización con CouchDB
- [ ] Verificar estados en panel debug

### 3. Probar en móviles
- [ ] Abrir desde móvil
- [ ] Instalar como PWA
- [ ] Probar offline
- [ ] Verificar sync en LAN

## 🔧 Comandos útiles

```bash
# Ver deployments
vercel ls

# Ver logs
vercel logs

# Eliminar deployment
vercel remove

# Ver información del proyecto
vercel inspect
```

## 🚨 Solución de Problemas

### Error: "No se puede instalar PWA"
```bash
# Verificar HTTPS
# Vercel automáticamente usa HTTPS ✅

# Verificar manifest
curl https://tu-app.vercel.app/manifest.json
```

### Error: "Service Worker no funciona"
```bash
# Verificar headers
curl -I https://tu-app.vercel.app/sw.js
# Debe tener: Cache-Control: no-cache
```

### Error: "No sincroniza en LAN"
```bash
# Verificar config.js
# Debe detectar red LAN correctamente
console.log(CONFIG.isInLAN());
```

## 🎯 Resultado Final

Después del deploy tendrás:

### 🌐 URL Pública
- **Producción**: `https://mi-pwa-offline.vercel.app`
- **Accesible**: Desde cualquier lugar del mundo
- **Funcionalidad**: Completa offline-first

### 📱 PWA Instalable
- **Chrome**: Botón "Instalar" automático
- **iOS**: "Agregar a pantalla inicio"
- **Android**: Instalación nativa

### 🔄 Sincronización Inteligente
- **Internet**: Solo PouchDB local
- **LAN**: Sincronización automática con CouchDB
- **Offline**: Completamente funcional

## 🔗 Enlaces Post-Deploy

Una vez deployado, tendrás acceso a:
- **App principal**: `https://tu-app.vercel.app/`
- **Panel de control**: `https://tu-app.vercel.app/panel.html`
- **Diagnóstico**: `https://tu-app.vercel.app/diagnostico.html`
- **Test sync**: `https://tu-app.vercel.app/test-sync.html`

---

**¡Tu PWA estará lista para usar desde cualquier lugar del mundo!** 🌍
