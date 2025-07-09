class App {
  constructor() {
    this.db = new DatabaseManager();
    this.ui = new UIManager();
    this.init();
  }

  async init() {
    // Cargar tareas iniciales
    await this.loadTasks();

    // Event listeners
    this.ui.addBtn.addEventListener('click', () => this.addTask());
    this.ui.taskInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.addTask();
    });

    // Escuchar sincronización
    window.addEventListener('dbSync', (event) => {
      console.log('Datos sincronizados, actualizando UI...');
      this.loadTasks();
      
      // Mostrar notificación de sincronización
      const info = event.detail;
      if (info.direction === 'push') {
        this.ui.showMessage('Datos enviados al servidor', 'success');
      } else if (info.direction === 'pull') {
        this.ui.showMessage('Datos recibidos del servidor', 'info');
      }
    });

    // Registrar Service Worker
    this.registerServiceWorker();
  }

  async addTask() {
    const title = this.ui.taskInput.value.trim();
    if (!title) return;

    try {
      await this.db.create({
        type: 'task',
        title: title,
        completed: false
      });

      this.ui.clearInput();
      await this.loadTasks();
      
      // Mensaje diferente según estado de conexión
      if (this.db.remoteDB) {
        this.ui.showMessage('Tarea guardada y sincronizada', 'success');
      } else {
        this.ui.showMessage('Tarea guardada (se sincronizará cuando haya conexión)', 'info');
      }
    } catch (error) {
      this.ui.showMessage('Error al agregar tarea', 'error');
      console.error('Error:', error);
    }
  }

  async loadTasks() {
    try {
      const tasks = await this.db.getAll('task');
      // Ordenar por fecha de creación (más recientes primero)
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      this.ui.renderTasks(tasks);
    } catch (error) {
      console.error('Error cargando tareas:', error);
      this.ui.showMessage('Error al cargar tareas', 'error');
    }
  }

  async toggleTask(taskId) {
    try {
      const task = await this.db.get(taskId);
      if (task) {
        task.completed = !task.completed;
        await this.db.update(task);
        await this.loadTasks();
        this.ui.showMessage('Tarea actualizada', 'success');
      }
    } catch (error) {
      console.error('Error actualizando tarea:', error);
      this.ui.showMessage('Error al actualizar tarea', 'error');
    }
  }

  async deleteTask(taskId) {
    if (!confirm('¿Eliminar esta tarea?')) return;

    try {
      await this.db.delete(taskId);
      await this.loadTasks();
      this.ui.showMessage('Tarea eliminada', 'success');
    } catch (error) {
      console.error('Error eliminando tarea:', error);
      this.ui.showMessage('Error al eliminar tarea', 'error');
    }
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        // Desregistrar SW anterior si existe
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
          console.log('🗑️ SW anterior desregistrado');
        }

        // Registrar nuevo SW
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('✅ Service Worker registrado:', registration.scope);

        // Esperar a que se active
        await new Promise((resolve) => {
          if (registration.active) {
            resolve();
          } else {
            registration.addEventListener('activate', resolve);
          }
        });

        // Verificar que está funcionando
        if (registration.active) {
          console.log('🚀 Service Worker activo y funcionando');
        }

      } catch (error) {
        console.error('❌ Error registrando Service Worker:', error);
      }
    } else {
      console.log('❌ Service Worker no soportado');
    }
  }
}

// Inicializar la app
const app = new App();
