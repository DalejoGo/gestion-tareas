import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { IFocusItem } from './itask.interface';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  items: IFocusItem[] = [];
  today: string = '';

  constructor(
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private storage: Storage
  ) {}

  async ngOnInit() {
    const date = new Date();
    const formatted = date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    this.today = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    await this.storage.create();
    const saved = await this.storage.get('focustask_items');
    if (saved) this.items = JSON.parse(saved);
  }

  get pending(): number {
    return this.items.filter(t => !t.done).length;
  }

  get completion(): number {
    if (this.items.length === 0) return 0;
    const done = this.items.filter(t => t.done).length;
    return Math.round((done / this.items.length) * 100);
  }

  private async save() {
    await this.storage.set('focustask_items', JSON.stringify(this.items));
  }

  async addItem() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva tarea',
      inputs: [{
        name: 'title',
        type: 'text',
        placeholder: 'En que vas a enfocarte?'
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data) => {
            if (!data.title || data.title.trim() === '') {
              this.showToast('Escribe el nombre de la tarea', 'warning');
              return;
            }
            this.items.unshift({
              id: Date.now(),
              title: data.title.trim(),
              done: false
            });
            await this.save();
            this.showToast('Tarea creada', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  async editItem(item: IFocusItem) {
    const alert = await this.alertCtrl.create({
      header: 'Editar tarea',
      inputs: [{
        name: 'title',
        type: 'text',
        value: item.title,
        placeholder: 'Nombre de la tarea'
      }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (data) => {
            if (!data.title || data.title.trim() === '') {
              this.showToast('El nombre no puede estar vacio', 'warning');
              return;
            }
            const i = this.items.findIndex(t => t.id === item.id);
            this.items[i].title = data.title.trim();
            await this.save();
            this.showToast('Tarea actualizada', 'primary');
          }
        }
      ]
    });
    await alert.present();
  }

  async removeItem(item: IFocusItem) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar tarea',
      message: `Deseas eliminar "${item.title}"?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            this.items = this.items.filter(t => t.id !== item.id);
            await this.save();
            this.showToast('Tarea eliminada', 'danger');
          }
        }
      ]
    });
    await alert.present();
  }

  async toggleItem(item: IFocusItem) {
    const i = this.items.findIndex(t => t.id === item.id);
    this.items[i].done = !this.items[i].done;
    await this.save();
  }

  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      position: 'top',
      color
    });
    await toast.present();
  }
}
