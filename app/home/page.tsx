'use client';

import { useRouter } from 'next/navigation';
import {
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonIcon,
} from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';

interface SubApp {
  name: string;
  description: string;
  route: string;
  icon: string;
}

const APPS: SubApp[] = [
  {
    name: 'Todo',
    description: 'Manage your tasks',
    route: '/apps/todo',
    icon: checkmarkCircleOutline,
  },
];

export default function HomePage() {
  const router = useRouter();

  return (
    <IonContent className="ion-padding">
      <h1 className="text-2xl font-bold text-center mb-6">Personal AI OS</h1>
      <div className="grid grid-cols-2 gap-4">
        {APPS.map((app) => (
          <IonCard
            key={app.route}
            onClick={() => router.push(app.route)}
            className="cursor-pointer m-0 hover:opacity-80 transition-opacity"
          >
            <IonCardHeader className="flex flex-col items-center pt-4">
              <IonIcon icon={app.icon} className="text-5xl text-blue-500 mb-1" />
              <IonCardTitle className="text-base text-center">{app.name}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent className="text-center">
              <p className="text-sm text-gray-500">{app.description}</p>
            </IonCardContent>
          </IonCard>
        ))}
      </div>
    </IonContent>
  );
}
