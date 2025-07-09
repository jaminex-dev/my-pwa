class DatabaseManager {
  constructor() {
    this.localDB = new PouchDB('myapp_local');
    this.remoteDB = null;
    this.isOnline = navigator.onLine;
    this.syncHandler = null;
    this.isInLAN = false;
    this.couchAvailable = false;
    this.syncCheckInterval = null;
    
    this.init();
  }

  async init() {
    // Esperar a que CONFIG esté disponible
    if (typeof CONFIG === 'undefined') {
      setTimeout(() => this.init(), 500);
      return;
    }

    // Verificar si estamos en red LAN
    this.isInLAN = CONFIG.isInLAN();
    
    console.log(`🌐 Modo: ${this.isInLAN ? 'Red LAN' : 'Internet/Vercel'}`);
    
    // Solo intentar CouchDB si estamos en LAN
    if (this.isInLAN) {
      await this.checkCouchDBConnection();
    } else {
      this.updateConnectionStatus('🌐 Modo Internet - Solo local');
      console.log('📱 Modo Internet: Los datos se guardan solo localmente');
    }
    
    // Eventos de red
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
    
    // Verificar estado inicial
    if (CONFIG.app.debug) {
      const envInfo = CONFIG.getEnvironmentInfo();
      console.log('📊 Información del entorno:', envInfo);
    }

    // Verificar periódicamente cambios de red
    this.startNetworkDetection();
  }

  startNetworkDetection() {
    // Solo verificar CouchDB si estamos en LAN
    if (!this.isInLAN) {
      console.log('🌐 Modo Internet: Detección de red CouchDB deshabilitada');
      return;
    }
    
    // Verificar cada 30 segundos si podemos conectar a CouchDB
    this.syncCheckInterval = setInterval(async () => {
      if (!this.couchAvailable && this.isOnline) {
        const canConnect = await CONFIG.isCouchDBAvailable();
        if (canConnect && !this.isInLAN) {
          console.log('🏠 Red LAN detectada - Conectando a CouchDB');
          this.isInLAN = true;
          await this.checkCouchDBConnection();
        }
      }
    }, 30000);
  }

  async checkCouchDBConnection() {
    // No intentar conectar si no estamos en LAN
    if (!this.isInLAN) {
      console.log('🌐 Modo Internet: CouchDB deshabilitado');
      return;
    }
    
    try {
      // Verificar disponibilidad de CouchDB
      const available = await CONFIG.isCouchDBAvailable();
      
      if (!available) {
        throw new Error('CouchDB no disponible');
      }

      // Crear conexión remota
      this.remoteDB = new PouchDB(CONFIG.getCouchDBUrl(), {
        auth: {
          username: CONFIG.couchdb.credentials.username,
          password: CONFIG.couchdb.credentials.password
        },
        ajax: {
          timeout: 10000,
          withCredentials: false
        }
      });
      
      // Verificar conexión
      const info = await this.remoteDB.info();
      
      this.couchAvailable = true;
      console.log('✅ CouchDB disponible - Sincronización activa');
      console.log('📊 Info CouchDB:', info.db_name, 'docs:', info.doc_count);
      
      this.updateConnectionStatus('🌐 LAN + CouchDB - Conectado');
      this.startSync();
      
    } catch (error) {
      this.couchAvailable = false;
      console.log('📱 CouchDB no disponible - Solo modo local');
      this.updateConnectionStatus(this.isInLAN ? '📱 LAN - Solo local' : '🌐 Internet - Solo local');
      this.remoteDB = null;
    }
  }

  startSync() {
    if (!this.remoteDB || !this.couchAvailable) return;

    this.stopSync();

    try {
      // Sincronización inicial
      this.localDB.sync(this.remoteDB, {
        retry: false
      }).then(() => {
        console.log('🔄 Sincronización inicial completada');
        
        // Iniciar sincronización continua
        this.syncHandler = this.localDB.sync(this.remoteDB, {
          live: true,
          retry: true,
          timeout: 30000,
          batch_size: 100
        }).on('change', (info) => {
          if (CONFIG.app.debug) {
            console.log('🔄 Sincronización:', info.direction, info.change.docs.length, 'documentos');
          }
          this.updateConnectionStatus('🔄 Sincronizando...');
          setTimeout(() => {
            this.updateConnectionStatus('✅ LAN + CouchDB - Sincronizado');
          }, 1000);
          
          window.dispatchEvent(new CustomEvent('dbSync', { detail: info }));
        }).on('error', (err) => {
          console.error('❌ Error de sincronización:', err);
          this.updateConnectionStatus('⚠️ Error de sincronización');
          this.couchAvailable = false;
          
          // Reintentar después de 10 segundos
          setTimeout(() => this.checkCouchDBConnection(), 10000);
        }).on('denied', (err) => {
          console.error('❌ Sincronización denegada:', err.message);
          this.updateConnectionStatus('⚠️ Acceso denegado');
        }).on('complete', (info) => {
          if (CONFIG.app.debug) {
            console.log('✅ Sincronización completada');
          }
          this.updateConnectionStatus('✅ LAN + CouchDB - Sincronizado');
        });
      });

    } catch (error) {
      console.error('Error iniciando sincronización:', error);
    }
  }

  stopSync() {
    if (this.syncHandler) {
      try {
        this.syncHandler.cancel();
      } catch (error) {
        console.log('Error cancelando sync:', error);
      }
      this.syncHandler = null;
    }
  }

  handleOnline() {
    console.log('🌐 Conexión detectada');
    this.isOnline = true;
    
    // Solo intentar CouchDB si estamos en LAN
    if (this.isInLAN) {
      this.checkCouchDBConnection();
    }
  }

  handleOffline() {
    console.log('📱 Modo offline');
    this.isOnline = false;
    this.stopSync();
    this.updateConnectionStatus('📱 Offline - Solo local');
  }

  updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
      statusElement.textContent = status;
    }
  }

  // CRUD Operations - Siempre guarda local, sync automático si disponible
  async create(doc) {
    try {
      doc._id = doc._id || Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
      doc.createdAt = new Date().toISOString();
      doc.environment = this.isInLAN ? 'LAN' : 'Internet';
      doc.deviceInfo = {
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      
      const result = await this.localDB.put(doc);
      
      if (CONFIG.app.debug) {
        console.log('📝 Guardado localmente:', result.id);
        if (this.couchAvailable) {
          console.log('🔄 Se sincronizará automáticamente con CouchDB');
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error creando:', error);
      throw error;
    }
  }

  async getAll(type = null) {
    try {
      const result = await this.localDB.allDocs({ include_docs: true });
      let docs = result.rows.map(row => row.doc);
      
      if (type) {
        docs = docs.filter(doc => doc.type === type);
      }
      
      return docs;
    } catch (error) {
      console.error('Error leyendo:', error);
      return [];
    }
  }

  async update(doc) {
    try {
      doc.updatedAt = new Date().toISOString();
      const result = await this.localDB.put(doc);
      
      if (CONFIG.app.debug) {
        console.log('✏️ Actualizado:', result.id);
      }
      
      return result;
    } catch (error) {
      console.error('Error actualizando:', error);
      throw error;
    }
  }

  async delete(docId) {
    try {
      const doc = await this.localDB.get(docId);
      const result = await this.localDB.remove(doc);
      
      if (CONFIG.app.debug) {
        console.log('🗑️ Eliminado:', result.id);
      }
      
      return result;
    } catch (error) {
      console.error('Error eliminando:', error);
      throw error;
    }
  }

  async get(docId) {
    try {
      return await this.localDB.get(docId);
    } catch (error) {
      console.error('Error obteniendo documento:', error);
      return null;
    }
  }

  // Métodos de utilidad
  async forceSyncNow() {
    if (!this.remoteDB || !this.couchAvailable) {
      console.log('⚠️ No hay conexión CouchDB para sincronizar');
      return false;
    }

    try {
      console.log('🔄 Forzando sincronización...');
      this.updateConnectionStatus('🔄 Sincronizando...');
      
      const result = await this.localDB.sync(this.remoteDB, {
        timeout: 30000,
        batch_size: 100
      });
      
      console.log('✅ Sincronización manual completada');
      this.updateConnectionStatus('✅ LAN + CouchDB - Sincronizado');
      return true;
    } catch (error) {
      console.error('❌ Error en sincronización manual:', error);
      this.updateConnectionStatus('⚠️ Error sincronizando');
      return false;
    }
  }

  async getPendingSyncData() {
    try {
      const localDocs = await this.localDB.allDocs({ include_docs: true });
      return localDocs.rows.length;
    } catch (error) {
      console.error('Error obteniendo datos pendientes:', error);
      return 0;
    }
  }

  getStatus() {
    return {
      isInLAN: this.isInLAN,
      couchAvailable: this.couchAvailable,
      isOnline: this.isOnline,
      remoteDB: !!this.remoteDB,
      syncActive: !!this.syncHandler
    };
  }

  async resetConnection() {
    console.log('🔄 Reiniciando conexión...');
    
    this.stopSync();
    this.remoteDB = null;
    this.couchAvailable = false;
    
    if (this.isInLAN) {
      setTimeout(() => this.checkCouchDBConnection(), 2000);
    }
  }

  // Cleanup al cerrar
  destroy() {
    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
    }
    this.stopSync();
  }
}
