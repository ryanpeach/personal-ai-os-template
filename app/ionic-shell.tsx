'use client';

import { IonApp, setupIonicReact } from '@ionic/react';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/display.css';
import './globals.css';

setupIonicReact();

export function IonicShell({ children }: { children: React.ReactNode }) {
  return <IonApp>{children}</IonApp>;
}
