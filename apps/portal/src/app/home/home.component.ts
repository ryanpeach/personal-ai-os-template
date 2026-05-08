import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline } from 'ionicons/icons';

interface SubApp {
  name: string;
  description: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon],
  template: `
    <ion-content class="ion-padding">
      <h1 class="text-2xl font-bold text-center mb-6">Personal AI OS</h1>
      <div class="grid grid-cols-2 gap-4">
        @for (app of apps; track app.route) {
          <ion-card [routerLink]="app.route" class="cursor-pointer m-0 hover:opacity-80 transition-opacity">
            <ion-card-header class="flex flex-col items-center pt-4">
              <ion-icon [name]="app.icon" class="text-5xl text-blue-500 mb-1"></ion-icon>
              <ion-card-title class="text-base text-center">{{ app.name }}</ion-card-title>
            </ion-card-header>
            <ion-card-content class="text-center">
              <p class="text-sm text-gray-500">{{ app.description }}</p>
            </ion-card-content>
          </ion-card>
        }
      </div>
    </ion-content>
  `,
})
export class HomeComponent {
  readonly apps: SubApp[] = [
    {
      name: 'Todo',
      description: 'Manage your tasks',
      route: '/apps/todo',
      icon: 'checkmark-circle-outline',
    },
  ];

  constructor() {
    addIcons({ checkmarkCircleOutline });
  }
}
