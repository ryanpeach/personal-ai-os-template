import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js';
import type { Todo } from '@personal-ai-os/shared';

interface TodoRow {
  id: number;
  title: string;
  done: boolean;
  created_at: string;
}

const COLUMNS = 'id, title, done, created_at';

function rowToTodo(row: TodoRow): Todo {
  return { id: row.id, title: row.title, done: row.done, createdAt: row.created_at };
}

function throwIf(error: PostgrestError | null): void {
  if (error) throw error;
}

export async function fetchTodos(supabase: SupabaseClient): Promise<Todo[]> {
  const { data, error } = await supabase
    .from('todos')
    .select(COLUMNS)
    .order('id', { ascending: true });
  throwIf(error);
  return (data ?? []).map(rowToTodo);
}

export async function createTodo(supabase: SupabaseClient, title: string): Promise<Todo | null> {
  const trimmed = title.trim();
  if (!trimmed) return null;
  const { data, error } = await supabase
    .from('todos')
    .insert({ title: trimmed })
    .select(COLUMNS)
    .single();
  throwIf(error);
  return data ? rowToTodo(data) : null;
}

export async function updateTodo(
  supabase: SupabaseClient,
  id: number,
  patch: { title?: string; done?: boolean },
): Promise<Todo | null> {
  const { data, error } = await supabase
    .from('todos')
    .update(patch)
    .eq('id', id)
    .select(COLUMNS)
    .single();
  throwIf(error);
  return data ? rowToTodo(data) : null;
}

export async function deleteTodo(supabase: SupabaseClient, id: number): Promise<void> {
  const { error } = await supabase.from('todos').delete().eq('id', id);
  throwIf(error);
}
