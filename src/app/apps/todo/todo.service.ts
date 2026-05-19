import { Injectable, inject, signal } from '@angular/core';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Todo } from '@personal-ai-os/shared';
import { SUPABASE_CLIENT } from '../../supabase.client';

interface TodoRow {
  id: number;
  title: string;
  done: boolean;
  created_at: string;
}

function rowToTodo(row: TodoRow): Todo {
  return { id: row.id, title: row.title, done: row.done, createdAt: row.created_at };
}

function throwIf(error: PostgrestError | null): void {
  if (error) throw error;
}

@Injectable({ providedIn: 'root' })
export class TodoService {
  private readonly supabase = inject(SUPABASE_CLIENT);
  readonly todos = signal<Todo[]>([]);

  async loadAll(): Promise<void> {
    const { data, error } = await this.supabase
      .from('todos')
      .select('id, title, done, created_at')
      .order('id', { ascending: true });
    throwIf(error);
    this.todos.set((data ?? []).map(rowToTodo));
  }

  async create(title: string): Promise<void> {
    const trimmed = title.trim();
    if (!trimmed) return;
    const { data, error } = await this.supabase
      .from('todos')
      .insert({ title: trimmed })
      .select('id, title, done, created_at')
      .single();
    throwIf(error);
    if (data) this.todos.update((list) => [...list, rowToTodo(data)]);
  }

  async update(id: number, patch: { title?: string; done?: boolean }): Promise<void> {
    const { data, error } = await this.supabase
      .from('todos')
      .update(patch)
      .eq('id', id)
      .select('id, title, done, created_at')
      .single();
    throwIf(error);
    if (data) {
      const updated = rowToTodo(data);
      this.todos.update((list) => list.map((t) => (t.id === id ? updated : t)));
    }
  }

  async remove(id: number): Promise<void> {
    const { error } = await this.supabase.from('todos').delete().eq('id', id);
    throwIf(error);
    this.todos.update((list) => list.filter((t) => t.id !== id));
  }
}
