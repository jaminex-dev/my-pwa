// Herramientas de debugging para PWA
class PWADebugger {
  constructor() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    // Esperar a que CONFIG esté disponible
    if (typeof CONFIG === 'undefined') {
      setTimeout(() => this.init(), 500);
      return;
    }

    // Solo mostrar en modo debug
    if (!CONFIG.isDebugMode()) {
      return;
    }

    this.createDebugPanel();
    this.startHealthCheck();
  }

  createDebugPanel() {
    if (!document.body) {
      setTimeout(() => this.createDebugPanel(), 100);
      return;
    }

    const isInLAN = CONFIG.isInLAN();
    const modeIcon = isInLAN ? '🏠' : '🌐';
    const modeText = isInLAN ? 'Red LAN' : 'Internet';
    const hostname = window.location.hostname;

    const panel = document.createElement('div');
    panel.id = 'debug-panel';
    panel.style.cssText = `
      position: fixed;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      font-size: 12px;
      z-index: 10000;
      max-width: 350px;
      cursor: move;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    `;

    panel.innerHTML = `
      <div style="margin-bottom: 10px; font-weight: bold; color: #4CAF50;">
        🐛 PWA Debug Panel
      </div>
      <div style="margin-bottom: 5px; color: #FFC107; font-size: 11px;">
        ${modeIcon} Modo: ${modeText} (${hostname})
      </div>
      <div id="debug-status">
        <div id="sw-status">🔄 Verificando Service Worker...</div>
        <div id="db-status">🔄 Verificando Base de Datos...</div>
        <div id="network-status">🔄 Verificando Red...</div>
        <div id="couch-status">🔄 Verificando CouchDB...</div>
        <div id="sync-status">🔄 Verificando Sincronización...</div>
      </div>
      <div style="margin-top: 10px;">
        <button onclick="pwaDebugger.testAll()" style="margin-right: 5px; padding: 5px; font-size: 10px; background: #2196F3; color: white; border: none; border-radius: 3px;">Test Todo</button>
        <button onclick="pwaDebugger.clearData()" style="margin-right: 5px; padding: 5px; font-size: 10px; background: #f44336; color: white; border: none; border-radius: 3px;">Limpiar</button>
        ${isInLAN ? '<button onclick="pwaDebugger.forceSync()" style="margin-right: 5px; padding: 5px; font-size: 10px; background: #4CAF50; color: white; border: none; border-radius: 3px;">Sync</button>' : ''}
        <button onclick="pwaDebugger.showInfo()" style="padding: 5px; font-size: 10px; background: #FF9800; color: white; border: none; border-radius: 3px;">Info</button>
      </div>
    `;

    document.body.appendChild(panel);
    this.makeDebugPanelDraggable(panel);
  }

  makeDebugPanelDraggable(panel) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY;

    panel.addEventListener('mousedown', (e) => {
      isDragging = true;
      initialX = e.clientX - panel.offsetLeft;
      initialY = e.clientY - panel.offsetTop;
    });

    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        panel.style.left = currentX + 'px';
        panel.style.top = currentY + 'px';
      }
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
    });
  }

  updateStatus(elementId, message, isSuccess = true) {
    const element = document.getElementById(elementId);
    if (element) {
      const icon = isSuccess ? '✅' : '❌';
      element.innerHTML = `${icon} ${message}`;
      element.style.color = isSuccess ? '#4CAF50' : '#f44336';
    }
  }

  async startHealthCheck() {
    // Service Worker
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        this.updateStatus('sw-status', 'Service Worker activo', !!registration);
      } catch (error) {
        this.updateStatus('sw-status', 'Service Worker error', false);
      }
    } else {
      this.updateStatus('sw-status', 'Service Worker no soportado', false);
    }

    // Base de datos local
    try {
      if (window.app && window.app.db) {
        const dbInfo = await window.app.db.localDB.info();
        const pendingData = await window.app.db.getPendingSyncData();
        const connectionStatus = await window.app.db.getConnectionStatus();
        
        this.updateStatus('db-status', `DB: ${dbInfo.doc_count} docs locales`, true);
        
        // Mostrar estado de sincronización detallado
        if (connectionStatus.canSync) {
          const syncStatus = window.app.db.syncHandler ? 'Sync activo' : 'Sync pausado';
          this.updateStatus('sync-status', `${syncStatus}: ${pendingData.length} docs`, true);
        } else if (connectionStatus.hasLocalData && !connectionStatus.canSync) {
          this.updateStatus('sync-status', `Pendiente: ${pendingData.length} docs por sincronizar`, false);
        } else {
          this.updateStatus('sync-status', 'No hay datos para sincronizar', true);
        }
      } else {
        this.updateStatus('db-status', 'DB inicializando...', true);
        this.updateStatus('sync-status', 'Sync inicializando...', true);
      }
    } catch (error) {
      this.updateStatus('db-status', 'Error en DB: ' + error.message, false);
      this.updateStatus('sync-status', 'Error en sync', false);
    }

    // Red
    this.updateStatus('network-status', navigator.onLine ? 'Online' : 'Offline', navigator.onLine);
    
    // CouchDB
    await this.checkCouchDB();

    // Actualizar eventos de red
    window.addEventListener('online', () => {
      this.updateStatus('network-status', 'Online', true);
      this.checkCouchDB();
    });
    window.addEventListener('offline', () => {
      this.updateStatus('network-status', 'Offline', false);
      this.updateStatus('couch-status', 'Sin conexión', false);
    });
  }

  async checkCouchDB() {
    const couchStatus = document.getElementById('couch-status');
    if (!couchStatus) return;
    
    try {
      // Solo verificar si estamos en LAN
      if (!CONFIG.isInLAN()) {
        this.updateStatus('couch-status', 'CouchDB omitido - no es LAN', true);
        return;
      }
      
      // Verificar si ya tenemos info del database manager
      if (window.app && window.app.db) {
        const dbStatus = window.app.db.getStatus();
        if (dbStatus.couchAvailable) {
          this.updateStatus('couch-status', 'CouchDB conectado', true);
          return;
        } else if (dbStatus.isInLAN) {
          this.updateStatus('couch-status', 'CouchDB no disponible', false);
          return;
        }
      }
      
      // Si no tenemos info del DB manager, hacer verificación manual con timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      try {
        const response = await fetch(`${CONFIG.couchdb.protocol}://${CONFIG.couchdb.host}:${CONFIG.couchdb.port}/`, {
          method: 'GET',
          headers: {
            'Authorization': 'Basic ' + btoa(`${CONFIG.couchdb.credentials.username}:${CONFIG.couchdb.credentials.password}`)
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        this.updateStatus('couch-status', response.ok ? 'CouchDB conectado' : 'Error de auth', response.ok);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === 'AbortError') {
          this.updateStatus('couch-status', 'CouchDB timeout', false);
        } else {
          throw fetchError;
        }
      }
    } catch (error) {
      this.updateStatus('couch-status', 'CouchDB no disponible', false);
    }
  }

  async testAll() {
    console.log('🧪 Ejecutando tests...');
    
    // Test 1: IndexedDB
    try {
      const testDB = new PouchDB('test_db');
      await testDB.put({ _id: 'test', data: 'test' });
      await testDB.get('test');
      await testDB.destroy();
      console.log('✅ IndexedDB funcionando');
    } catch (error) {
      console.error('❌ IndexedDB error:', error);
    }

    // Test 2: Service Worker
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        console.log(registration ? '✅ Service Worker activo' : '❌ Service Worker no registrado');
      }
    } catch (error) {
      console.error('❌ Service Worker error:', error);
    }

    // Test 3: CouchDB
    try {
      if (CONFIG.isInLAN()) {
        const response = await fetch(CONFIG.getCouchDBServerUrl());
        console.log(response.ok ? '✅ CouchDB accesible' : '❌ CouchDB no accesible');
      } else {
        console.log('🌐 CouchDB omitido - no es entorno LAN');
      }
    } catch (error) {
      console.error('❌ CouchDB error:', error);
    }

    // Test 4: Manifest
    try {
      const manifestResponse = await fetch('/manifest.json');
      console.log(manifestResponse.ok ? '✅ Manifest accesible' : '❌ Manifest error');
    } catch (error) {
      console.error('❌ Manifest error:', error);
    }

    console.log('🧪 Tests completados');
  }

  async forceSync() {
    console.log('🔄 Forzando sincronización...');
    
    if (window.app && window.app.db) {
      this.updateStatus('sync-status', 'Sincronizando...', true);
      
      try {
        // Verificar estado antes de sync
        const connectionStatus = await window.app.db.getConnectionStatus();
        console.log('📊 Estado de conexión:', connectionStatus);
        
        if (!connectionStatus.canSync) {
          console.log('⚠️ No se puede sincronizar - verificando conexión...');
          await window.app.db.checkRemoteConnection();
        }
        
        const result = await window.app.db.forceSyncNow();
        
        if (result) {
          console.log('✅ Sincronización forzada exitosa');
          this.updateStatus('sync-status', 'Sync completado', true);
        } else {
          console.log('❌ No se pudo sincronizar');
          this.updateStatus('sync-status', 'Error en sync', false);
        }
        
        // Actualizar todos los estados
        setTimeout(() => this.startHealthCheck(), 1000);
        
      } catch (error) {
        console.error('❌ Error en sincronización forzada:', error);
        this.updateStatus('sync-status', 'Error: ' + error.message, false);
      }
    } else {
      console.log('⚠️ App no inicializada');
    }
  }

  async resetConnection() {
    console.log('🔄 Reiniciando conexión...');
    
    if (window.app && window.app.db) {
      this.updateStatus('couch-status', 'Reiniciando...', true);
      this.updateStatus('sync-status', 'Reiniciando...', true);
      
      try {
        await window.app.db.resetConnection();
        console.log('✅ Conexión reiniciada');
        
        // Actualizar estados después de un delay
        setTimeout(() => this.startHealthCheck(), 3000);
        
      } catch (error) {
        console.error('❌ Error reiniciando conexión:', error);
        this.updateStatus('couch-status', 'Error reiniciando', false);
      }
    } else {
      console.log('⚠️ App no inicializada');
    }
  }

  async showInfo() {
    const envInfo = CONFIG.getEnvironmentInfo();
    const dbStatus = window.app?.db?.getStatus() || {};
    
    const info = `
🌐 INFORMACIÓN DEL ENTORNO:
• Hostname: ${envInfo.hostname}
• Protocolo: ${envInfo.protocol}
• En LAN: ${envInfo.isInLAN ? 'Sí' : 'No'}
• Online: ${envInfo.online ? 'Sí' : 'No'}

📊 ESTADO DE LA BASE DE DATOS:
• CouchDB disponible: ${dbStatus.couchAvailable ? 'Sí' : 'No'}
• Sincronización activa: ${dbStatus.syncActive ? 'Sí' : 'No'}
• Conexión remota: ${dbStatus.remoteDB ? 'Sí' : 'No'}

🔧 CONFIGURACIÓN:
• Modo debug: ${CONFIG.isDebugMode() ? 'Sí' : 'No'}
• CouchDB URL: ${CONFIG.getCouchDBUrl() || 'No disponible'}
    `;
    
    alert(info);
  }

  async clearData() {
    if (confirm('¿Limpiar todos los datos locales?')) {
      try {
        const localDB = new PouchDB('myapp_local');
        await localDB.destroy();
        localStorage.clear();
        sessionStorage.clear();
        
        // Limpiar cache
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        
        console.log('🧹 Datos limpiados');
        window.location.reload();
      } catch (error) {
        console.error('Error limpiando datos:', error);
      }
    }
  }
}

// Crear instancia global
const pwaDebugger = new PWADebugger();
