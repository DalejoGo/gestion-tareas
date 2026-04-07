import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { ITask } from './itask.interface';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  tasks: ITask[] = [];

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private storage: Storage
  ) {}

  async ngOnInit() {
    await this.storage.create();
    const saved = await this.storage.get('tasks');
    if (saved) this.tasks = JSON.parse(saved);
  }

  // Cuántas tareas faltan por hacer
  get pendientes(): number {
    return this.tasks.filter(t => !t.done).length;
  }

  // Porcentaje completado
  get progreso(): number {
    if (this.tasks.length === 0) return 0;
    const hechas = this.tasks.filter(t => t.done).length;
    return Math.round((hechas / this.tasks.length) * 100);
  }

  // Guardar en el storage del celular
  private async guardar() {
    await this.storage.set('tasks', JSON.stringify(this.tasks));
  }

  // ── AGREGAR ──────────────────────────────────────────────────────
  async agregar() {
    const alert = await this.alertCtrl.create({
      header: '✏️ Nueva tarea',
      inputs: [{
        name: 'titulo',
        type: 'text',
        placeholder: 'Escribe tu tarea aquí...'
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: async (data) => {
            if (!data.titulo || data.titulo.trim() === '') {
              this.mostrarToast('Escribe el nombre de la tarea', 'warning');
              return;
            }
            this.tasks.unshift({
              id: Date.now(),
              title: data.titulo.trim(),
              done: false
            });
            await this.guardar();
            this.mostrarToast('Tarea agregada', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  // ── EDITAR ───────────────────────────────────────────────────────
  async editar(tarea: ITask) {
    const alert = await this.alertCtrl.create({
      header: '✏️ Editar tarea',
      inputs: [{
        name: 'titulo',
        type: 'text',
        value: tarea.title,
        placeholder: 'Nombre de la tarea'
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (!data.titulo || data.titulo.trim() === '') {
              this.mostrarToast('El nombre no puede estar vacío', 'warning');
              return;
            }
            const i = this.tasks.findIndex(t => t.id === tarea.id);
            this.tasks[i].title = data.titulo.trim();
            await this.guardar();
            this.mostrarToast('Tarea actualizada', 'primary');
          }
        }
      ]
    });
    await alert.present();
  }

  // ── ELIMINAR ─────────────────────────────────────────────────────
  async eliminar(tarea: ITask) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar tarea',
      message: `¿Eliminar "${tarea.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            this.tasks = this.tasks.filter(t => t.id !== tarea.id);
            await this.guardar();
            this.mostrarToast('Tarea eliminada', 'danger');
          }
        }
      ]
    });
    await alert.present();
  }

  // ── MARCAR HECHA / PENDIENTE ─────────────────────────────────────
  async marcarHecha(tarea: ITask) {
    const i = this.tasks.findIndex(t => t.id === tarea.id);
    this.tasks[i].done = !this.tasks[i].done;
    await this.guardar();
  }

  // ── TOAST (mensajito arriba) ─────────────────────────────────────
  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastCtrl.create({
      message: mensaje,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }
}