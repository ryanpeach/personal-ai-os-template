import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonList,
  IonItem,
  IonCheckbox,
  IonLabel,
  IonButton,
  IonInput,
  IonIcon,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonToolbar,
  IonHeader,
  IonTitle,
  IonBackButton,
  IonButtons,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline, addOutline, arrowBackOutline } from 'ionicons/icons';
import { TodoService } from './todo.service';
import type { Todo } from '@personal-ai-os/shared';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [
    FormsModule,
    IonContent,
    IonList,
    IonItem,
    IonCheckbox,
    IonLabel,
    IonButton,
    IonInput,
    IonIcon,
    IonItemSliding,
    IonItemOptions,
    IonItemOption,
    IonToolbar,
    IonHeader,
    IonTitle,
    IonBackButton,
    IonButtons,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Todo</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <ion-list>
        @for (todo of todoService.todos(); track todo.id) {
          <ion-item-sliding>
            <ion-item>
              <ion-checkbox
                slot="start"
                [checked]="todo.done"
                (ionChange)="toggle(todo)"
              ></ion-checkbox>
              <ion-label [class.line-through]="todo.done" [class.opacity-40]="todo.done">
                {{ todo.title }}
              </ion-label>
            </ion-item>
            <ion-item-options side="end">
              <ion-item-option color="danger" (click)="remove(todo.id)">
                <ion-icon slot="icon-only" name="trash-outline"></ion-icon>
              </ion-item-option>
            </ion-item-options>
          </ion-item-sliding>
        }
      </ion-list>

      <div class="flex gap-2 p-4">
        <ion-input
          [(ngModel)]="newTitle"
          placeholder="Add a task…"
          class="flex-1 border border-gray-200 rounded-lg px-3"
          (keyup.enter)="add()"
        ></ion-input>
        <ion-button (click)="add()" [disabled]="!newTitle.trim()">
          <ion-icon slot="icon-only" name="add-outline"></ion-icon>
        </ion-button>
      </div>
    </ion-content>
  `,
})
export class TodoComponent {
  readonly todoService = inject(TodoService);
  newTitle = '';

  constructor() {
    addIcons({ trashOutline, addOutline, arrowBackOutline });
    void this.todoService.loadAll().catch((err) => console.error('loadAll failed', err));
  }

  add(): void {
    const title = this.newTitle.trim();
    if (!title) return;
    void this.todoService.create(title).catch((err) => console.error('create failed', err));
    this.newTitle = '';
  }

  toggle(todo: Todo): void {
    void this.todoService
      .update(todo.id, { done: !todo.done })
      .catch((err) => console.error('update failed', err));
  }

  remove(id: number): void {
    void this.todoService.remove(id).catch((err) => console.error('remove failed', err));
  }
}
