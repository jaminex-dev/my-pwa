// Configuración global de la PWA
window.CONFIG = {
  couchdb: {
    host: '10.1.1.134', // IP correcta de tu CouchDB
    port: '5984',
    protocol: 'http',
    database: 'myapp',
    credentials: {
      username: 'admin',
      password: '1234' // Cambia por la contraseña real de CouchDB
    }
  },
  
  app: {
    name: 'Mi PWA Offline',
    version: '1.0.0',
    debug: true // Activar debug para desarrollo
  },

  // Detectar si estamos en red LAN
  isInLAN() {
    const hostname = window.location.hostname;
    const isLAN = hostname === 'localhost' || 
                  hostname === '127.0.0.1' ||
                  hostname.startsWith('192.168.') ||
                  hostname.startsWith('10.1.1.') ||    // Tu red específica
                  hostname.startsWith('172.16.') ||
                  hostname === '10.1.1.134' ||          // IP específica del servidor
                  (hostname.endsWith('.local') && !hostname.includes('vercel'));
    
    console.log(`🌐 Verificando red - Hostname: ${hostname}, Es LAN: ${isLAN}`);
    return isLAN;
  },

  // Detectar modo debug
  isDebugMode() {
    return this.isInLAN() || 
           window.location.hostname.includes('vercel.app') ||
           window.location.hostname === 'localhost' ||
           window.location.search.includes('debug=true');
  },

  // URL de CouchDB (solo si estamos en LAN)
  getCouchDBUrl() {
    if (!this.isInLAN()) {
      return null; // No CouchDB si no estamos en LAN
    }
    const { protocol, host, port, database } = this.couchdb;
    return `${protocol}://${host}:${port}/${database}`;
  },

  // Verificar si CouchDB está disponible
  async isCouchDBAvailable() {
    if (!this.isInLAN()) {
      console.log('🌐 Modo Internet: CouchDB deshabilitado');
      return false;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${this.couchdb.protocol}://${this.couchdb.host}:${this.couchdb.port}`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      console.log('❌ CouchDB no disponible:', error.message);
      return false;
    }
  },

  // Obtener información del entorno
  getEnvironmentInfo() {
    return {
      isInLAN: this.isInLAN(),
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      userAgent: navigator.userAgent,
      online: navigator.onLine,
      couchdbUrl: this.getCouchDBUrl(),
      networkIP: this.getNetworkInfo()
    };
  },

  // Obtener información de red
  getNetworkInfo() {
    const hostname = window.location.hostname;
    if (hostname.startsWith('10.1.1.')) {
      return {
        network: '10.1.1.x',
        gateway: '10.1.1.1',
        couchdbHost: '10.1.1.134'
      };
    }
    return { network: 'unknown', hostname };
  },

  getCouchDBServerUrl() {
    const { protocol, host, port } = this.couchdb;
    return `${protocol}://${host}:${port}`;
  },

  getAuthHeaders() {
    const { username, password } = this.couchdb.credentials;
    return {
      'Authorization': 'Basic ' + btoa(`${username}:${password}`),
      'Content-Type': 'application/json'
    };
  }
};

// Auto-configurar CouchDB CORS solo si es necesario
async function setupCouchDBCORS() {
  if (!CONFIG.app.debug || !CONFIG.isInLAN()) {
    console.log('🌐 CORS setup omitido - no es entorno LAN');
    return; // Solo en desarrollo y LAN
  }

  try {
    const baseUrl = CONFIG.getCouchDBServerUrl();
    
    // Verificar si CORS ya está configurado
    const corsCheck = await fetch(`${baseUrl}/_node/_local/_config/cors/origins`, {
      method: 'GET',
      headers: CONFIG.getAuthHeaders()
    });

    if (corsCheck.ok) {
      const corsValue = await corsCheck.text();
      if (corsValue.includes('*') || corsValue.includes('localhost')) {
        if (CONFIG.app.debug) console.log('✅ CORS ya configurado');
        return;
      }
    }

    // Configurar CORS si es necesario
    if (CONFIG.app.debug) console.log('🔧 Configurando CORS...');
    
    const corsRequests = [
      { path: 'httpd/enable_cors', value: '"true"' },
      { path: 'cors/origins', value: '"*"' },
      { path: 'cors/credentials', value: '"true"' },
      { path: 'cors/methods', value: '"GET, PUT, POST, HEAD, DELETE"' },
      { path: 'cors/headers', value: '"accept, authorization, content-type, origin, referer, x-csrf-token"' }
    ];

    for (const config of corsRequests) {
      await fetch(`${baseUrl}/_node/_local/_config/${config.path}`, {
        method: 'PUT',
        headers: CONFIG.getAuthHeaders(),
        body: config.value
      });
    }

    if (CONFIG.app.debug) console.log('✅ CORS configurado exitosamente');
  } catch (error) {
    // Error silencioso - no es crítico para el funcionamiento
    if (CONFIG.app.debug) console.log('⚠️ No se pudo configurar CORS automáticamente');
  }
}

// Función para verificar y crear la base de datos
async function ensureDatabaseExists() {
  try {
    const dbUrl = CONFIG.getCouchDBUrl();
    
    // Intentar obtener info de la base de datos
    const dbResponse = await fetch(dbUrl, {
      method: 'GET',
      headers: CONFIG.getAuthHeaders()
    });

    if (dbResponse.ok) {
      if (CONFIG.app.debug) console.log('✅ Base de datos myapp existe');
      return true;
    }

    // Si no existe, intentar crearla
    if (dbResponse.status === 404) {
      const createResponse = await fetch(dbUrl, {
        method: 'PUT',
        headers: CONFIG.getAuthHeaders()
      });

      if (createResponse.ok) {
        if (CONFIG.app.debug) console.log('✅ Base de datos myapp creada');
        return true;
      }
    }

    if (CONFIG.app.debug) console.log('⚠️ No se pudo crear/verificar la base de datos');
    return false;
  } catch (error) {
    if (CONFIG.app.debug) console.log('⚠️ Error verificando base de datos:', error.message);
    return false;
  }
}

// Inicialización automática solo en desarrollo
if (CONFIG.app.debug) {
  // Dar tiempo al DOM para cargar
  setTimeout(async () => {
    await ensureDatabaseExists();
    await setupCouchDBCORS();
  }, 1000);
}
