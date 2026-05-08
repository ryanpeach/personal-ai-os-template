import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import type { Todo } from '@personal-ai-os/shared';

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly http = inject(HttpClient);
  readonly todos = signal<Todo[]>([]);

  loadAll(): void {
    this.http.get<Todo[]>('/api/todos').subscribe((todos) => this.todos.set(todos));
  }

  create(title: string): void {
    this.http.post<Todo>('/api/todos', { title }).subscribe((todo) => {
      this.todos.update((list) => [...list, todo]);
    });
  }

  update(id: number, patch: { title?: string; done?: boolean }): void {
    this.http.patch<Todo>(`/api/todos/${id}`, patch).subscribe((updated) => {
      this.todos.update((list) => list.map((t) => (t.id === id ? updated : t)));
    });
  }

  remove(id: number): void {
    this.http.delete(`/api/todos/${id}`).subscribe(() => {
      this.todos.update((list) => list.filter((t) => t.id !== id));
    });
  }
}
