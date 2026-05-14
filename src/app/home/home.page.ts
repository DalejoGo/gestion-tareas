import { Component, OnInit } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Storage } from '@ionic/storage-angular';
import { IFocusItem, ISubItem } from './itask.interface';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {

  items: IFocusItem[] = [];
  today: string = '';
  editingId: number | null = null;
  editingTitle: string = '';

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
    if (saved) {
      const parsed = JSON.parse(saved);
      this.items = parsed.map((item: any) => ({
        ...item,
        subtasks: item.subtasks ?? [],
        expanded: item.expanded ?? false,
      }));
    }
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

  // ── AGREGAR TAREA ─────────────────────────────────────────────────
  async addItem() {
    const alert = await this.alertCtrl.create({
      header: 'Nueva tarea',
      inputs: [{ name: 'title', type: 'text', placeholder: 'En que vas a enfocarte?' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Crear',
          handler: async (data) => {
            if (!data.title || data.title.trim() === '') {
              this.showToast('Escribe el nombre de la tarea', 'warning');
              return;
            }
            this.items.unshift({ id: Date.now(), title: data.title.trim(), done: false, subtasks: [], expanded: false });
            await this.save();
            this.showToast('Tarea creada', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  // ── EDICION INLINE ────────────────────────────────────────────────
  startEdit(item: IFocusItem) {
    this.editingId = item.id;
    this.editingTitle = item.title;
  }

  async confirmEdit(item: IFocusItem) {
    if (this.editingId !== item.id) return;
    const title = this.editingTitle.trim();
    if (title && title !== item.title) {
      const i = this.items.findIndex(t => t.id === item.id);
      this.items[i].title = title;
      await this.save();
    }
    this.editingId = null;
    this.editingTitle = '';
  }

  cancelEdit() {
    this.editingId = null;
    this.editingTitle = '';
  }

  // ── ELIMINAR TAREA ────────────────────────────────────────────────
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

  // ── TOGGLE TAREA ──────────────────────────────────────────────────
  async toggleItem(item: IFocusItem) {
    const i = this.items.findIndex(t => t.id === item.id);
    this.items[i].done = !this.items[i].done;
    await this.save();
  }

  // ── EXPANDIR / COLAPSAR ───────────────────────────────────────────
  async toggleExpand(item: IFocusItem) {
    const i = this.items.findIndex(t => t.id === item.id);
    this.items[i].expanded = !this.items[i].expanded;
    await this.save();
  }

  // ── SUB-ITEMS ─────────────────────────────────────────────────────
  async addSubItem(item: IFocusItem) {
    const alert = await this.alertCtrl.create({
      header: 'Nueva sub-tarea',
      inputs: [{ name: 'title', type: 'text', placeholder: 'Detalle de la tarea...' }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Agregar',
          handler: async (data) => {
            if (!data.title || data.title.trim() === '') {
              this.showToast('Escribe el nombre', 'warning');
              return;
            }
            const i = this.items.findIndex(t => t.id === item.id);
            this.items[i].subtasks.push({ id: Date.now(), title: data.title.trim(), done: false });
            await this.save();
          }
        }
      ]
    });
    await alert.present();
  }

  async toggleSubItem(item: IFocusItem, sub: ISubItem) {
    const i = this.items.findIndex(t => t.id === item.id);
    const si = this.items[i].subtasks.findIndex(s => s.id === sub.id);
    this.items[i].subtasks[si].done = !this.items[i].subtasks[si].done;
    await this.save();
  }

  async removeSubItem(item: IFocusItem, sub: ISubItem) {
    const i = this.items.findIndex(t => t.id === item.id);
    this.items[i].subtasks = this.items[i].subtasks.filter(s => s.id !== sub.id);
    await this.save();
  }

  // ── TOAST ─────────────────────────────────────────────────────────
  async showToast(message: string, color: string) {
    const toast = await this.toastCtrl.create({ message, duration: 2000, position: 'top', color });
    await toast.present();
  }
}
