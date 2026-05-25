'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Todo } from '@personal-ai-os/shared';
import { getSupabaseClient } from './supabase-client';
import { createTodo, deleteTodo, fetchTodos, updateTodo } from './todos';

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const loadAll = useCallback(async () => {
    setTodos(await fetchTodos(getSupabaseClient()));
  }, []);

  const add = useCallback(async (title: string) => {
    const created = await createTodo(getSupabaseClient(), title);
    if (created) setTodos((list) => [...list, created]);
  }, []);

  const toggle = useCallback(async (todo: Todo) => {
    const updated = await updateTodo(getSupabaseClient(), todo.id, { done: !todo.done });
    if (updated) setTodos((list) => list.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const remove = useCallback(async (id: number) => {
    await deleteTodo(getSupabaseClient(), id);
    setTodos((list) => list.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    void loadAll().catch((err) => console.error('loadAll failed', err));
  }, [loadAll]);

  return { todos, add, toggle, remove };
}
