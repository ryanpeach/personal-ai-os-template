import { TestBed } from '@angular/core/testing';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Todo } from '@personal-ai-os/shared';
import { TodoService } from './todo.service';
import { SUPABASE_CLIENT } from '../../supabase.client';

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

// Minimal chainable stub matching the surface of supabase.from(...) used by TodoService.
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

describe('TodoService', () => {
  let service: TodoService;
  let stub: ReturnType<typeof createSupabaseStub>;

  beforeEach(() => {
    stub = createSupabaseStub();
    TestBed.configureTestingModule({
      providers: [{ provide: SUPABASE_CLIENT, useValue: stub.client }],
    });
    service = TestBed.inject(TodoService);
  });

  it('loadAll selects from todos and populates the signal', async () => {
    stub.respondWith({ data: [MOCK_ROW], error: null });
    await service.loadAll();
    expect(stub.calls).toEqual([{ table: 'todos', op: 'select', filters: [] }]);
    expect(service.todos()).toEqual([MOCK_TODO]);
  });

  it('create inserts a todo and appends to the signal', async () => {
    stub.respondWith({ data: MOCK_ROW, error: null });
    await service.create('Buy milk');
    expect(stub.calls).toEqual([
      { table: 'todos', op: 'insert', payload: { title: 'Buy milk' }, filters: [] },
    ]);
    expect(service.todos()).toContainEqual(MOCK_TODO);
  });

  it('update patches the todo by id and replaces it in the signal', async () => {
    service.todos.set([MOCK_TODO]);
    const updatedRow: TodoRow = { ...MOCK_ROW, done: true };
    stub.respondWith({ data: updatedRow, error: null });
    await service.update(1, { done: true });
    expect(stub.calls).toEqual([
      {
        table: 'todos',
        op: 'update',
        payload: { done: true },
        filters: [{ col: 'id', val: 1 }],
      },
    ]);
    expect(service.todos()[0]?.done).toBe(true);
  });

  it('remove deletes the todo by id and removes it from the signal', async () => {
    service.todos.set([MOCK_TODO]);
    stub.respondWith({ data: null, error: null });
    await service.remove(1);
    expect(stub.calls).toEqual([
      { table: 'todos', op: 'delete', filters: [{ col: 'id', val: 1 }] },
    ]);
    expect(service.todos()).toEqual([]);
  });
});
