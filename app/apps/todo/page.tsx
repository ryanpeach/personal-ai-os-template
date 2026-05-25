'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  IonButtons,
} from '@ionic/react';
import { trashOutline, addOutline, arrowBackOutline } from 'ionicons/icons';
import { useTodos } from '../../../lib/use-todos';

export default function TodoPage() {
  const router = useRouter();
  const { todos, add, toggle, remove } = useTodos();
  const [newTitle, setNewTitle] = useState('');

  const handleAdd = () => {
    const title = newTitle.trim();
    if (!title) return;
    void add(title).catch((err) => console.error('create failed', err));
    setNewTitle('');
  };

  return (
    <>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton onClick={() => router.push('/home')}>
              <IonIcon slot="icon-only" icon={arrowBackOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>Todo</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonList>
          {todos.map((todo) => (
            <IonItemSliding key={todo.id}>
              <IonItem>
                <IonCheckbox
                  slot="start"
                  checked={todo.done}
                  onIonChange={() =>
                    void toggle(todo).catch((err) => console.error('update failed', err))
                  }
                />
                <IonLabel className={todo.done ? 'line-through opacity-40' : ''}>
                  {todo.title}
                </IonLabel>
              </IonItem>
              <IonItemOptions side="end">
                <IonItemOption
                  color="danger"
                  onClick={() =>
                    void remove(todo.id).catch((err) => console.error('remove failed', err))
                  }
                >
                  <IonIcon slot="icon-only" icon={trashOutline} />
                </IonItemOption>
              </IonItemOptions>
            </IonItemSliding>
          ))}
        </IonList>

        <div className="flex gap-2 p-4">
          <IonInput
            value={newTitle}
            placeholder="Add a task…"
            className="flex-1 border border-gray-200 rounded-lg px-3"
            onIonInput={(e) => setNewTitle(e.detail.value ?? '')}
            onKeyUp={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
          />
          <IonButton onClick={handleAdd} disabled={!newTitle.trim()}>
            <IonIcon slot="icon-only" icon={addOutline} />
          </IonButton>
        </div>
      </IonContent>
    </>
  );
}
