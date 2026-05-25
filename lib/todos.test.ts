import { describe, it, expect, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Todo } from '@personal-ai-os/shared';
import { createTodo, deleteTodo, fetchTodos, updateTodo } from './todos';

interface TodoRow {
  id: number;
  title: string;
  done: boolean;
  created_at: string;
}

const MOCK_ROW: TodoRow = {
  id: 1,
  title: 'Buy milk',
  done: false,
  created_at: '2024-01-01T00:00:00',
};
const MOCK_TODO: Todo = { id: 1, title: 'Buy milk', done: false, createdAt: '2024-01-01T00:00:00' };

interface Call {
  table: string;
  op: 'select' | 'insert' | 'update' | 'delete';
  payload?: unknown;
  filters: Array<{ col: string; val: unknown }>;
}

// Minimal chainable stub matching the surface of supabase.from(...) used by lib/todos.
// Every chain terminator (.order, .single, .then) resolves to the same `nextResponse`.
function createSupabaseStub(): {
  client: SupabaseClient;
  calls: Call[];
  respondWith: (response: { data: unknown; error: null | { message: string } }) => void;
} {
  const calls: Call[] = [];
  let nextResponse: { data: unknown; error: null | { message: string } } = {
    data: null,
    error: null,
  };
  const respondWith = (r: typeof nextResponse) => {
    nextResponse = r;
  };

  function chain(call: Call): Record<string, unknown> & PromiseLike<unknown> {
    const handle = {
      select: () => chain(call),
      order: () => Promise.resolve(nextResponse),
      eq: (col: string, val: unknown) => {
        call.filters.push({ col, val });
        return chain(call);
      },
      single: () => Promise.resolve(nextResponse),
      then: (onFulfilled?: (v: unknown) => unknown, onRejected?: (e: unknown) => unknown) =>
        Promise.resolve(nextResponse).then(onFulfilled, onRejected),
    };
    return handle as unknown as Record<string, unknown> & PromiseLike<unknown>;
  }

  const client = {
    from: (table: string) => ({
      select: () => {
        const call: Call = { table, op: 'select', filters: [] };
        calls.push(call);
        return chain(call);
      },
      insert: (payload: unknown) => {
        const call: Call = { table, op: 'insert', payload, filters: [] };
        calls.push(call);
        return chain(call);
      },
      update: (payload: unknown) => {
        const call: Call = { table, op: 'update', payload, filters: [] };
        calls.push(call);
        return chain(call);
      },
      delete: () => {
        const call: Call = { table, op: 'delete', filters: [] };
        calls.push(call);
        return chain(call);
      },
    }),
  } as unknown as SupabaseClient;

  return { client, calls, respondWith };
}

describe('lib/todos', () => {
  let stub: ReturnType<typeof createSupabaseStub>;

  beforeEach(() => {
    stub = createSupabaseStub();
  });

  it('fetchTodos selects from todos and maps rows', async () => {
    stub.respondWith({ data: [MOCK_ROW], error: null });
    const todos = await fetchTodos(stub.client);
    expect(stub.calls).toEqual([{ table: 'todos', op: 'select', filters: [] }]);
    expect(todos).toEqual([MOCK_TODO]);
  });

  it('createTodo inserts a todo and returns the mapped row', async () => {
    stub.respondWith({ data: MOCK_ROW, error: null });
    const created = await createTodo(stub.client, 'Buy milk');
    expect(stub.calls).toEqual([
      { table: 'todos', op: 'insert', payload: { title: 'Buy milk' }, filters: [] },
    ]);
    expect(created).toEqual(MOCK_TODO);
  });

  it('updateTodo patches the todo by id and returns the mapped row', async () => {
    const updatedRow: TodoRow = { ...MOCK_ROW, done: true };
    stub.respondWith({ data: updatedRow, error: null });
    const updated = await updateTodo(stub.client, 1, { done: true });
    expect(stub.calls).toEqual([
      {
        table: 'todos',
        op: 'update',
        payload: { done: true },
        filters: [{ col: 'id', val: 1 }],
      },
    ]);
    expect(updated?.done).toBe(true);
  });

  it('deleteTodo deletes the todo by id', async () => {
    stub.respondWith({ data: null, error: null });
    await deleteTodo(stub.client, 1);
    expect(stub.calls).toEqual([
      { table: 'todos', op: 'delete', filters: [{ col: 'id', val: 1 }] },
    ]);
  });
});
