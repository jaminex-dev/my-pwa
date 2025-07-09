class UIManager {
  constructor() {
    this.tasksList = document.getElementById('tasks-list');
    this.taskInput = document.getElementById('task-input');
    this.addBtn = document.getElementById('add-btn');
  }

  renderTasks(tasks) {
    this.tasksList.innerHTML = '';
    
    if (tasks.length === 0) {
      this.tasksList.innerHTML = '<p class="no-tasks">No hay tareas</p>';
      return;
    }

    tasks.forEach(task => {
      const taskElement = this.createTaskElement(task);
      this.tasksList.appendChild(taskElement);
    });
  }

  createTaskElement(task) {
    const div = document.createElement('div');
    div.className = `task ${task.completed ? 'completed' : ''}`;
    div.innerHTML = `
      <div class="task-content">
        <input type="checkbox" ${task.completed ? 'checked' : ''} 
               onchange="app.toggleTask('${task._id}')">
        <span class="task-title">${task.title}</span>
        <small class="task-date">${new Date(task.createdAt).toLocaleString()}</small>
      </div>
      <button class="delete-btn" onclick="app.deleteTask('${task._id}')">🗑️</button>
    `;
    return div;
  }

  clearInput() {
    this.taskInput.value = '';
  }

  showMessage(message, type = 'info') {
    // Crear notificación simple
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}
