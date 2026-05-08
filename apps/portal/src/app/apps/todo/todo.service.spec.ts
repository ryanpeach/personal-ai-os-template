import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TodoService } from './todo.service';
import type { Todo } from '@personal-ai-os/shared';

const MOCK_TODO: Todo = { id: 1, title: 'Buy milk', done: false, createdAt: '2024-01-01T00:00:00' };

describe('TodoService', () => {
  let service: TodoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(TodoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('loadAll sends GET /api/todos and populates todos signal', () => {
    service.loadAll();
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('GET');
    req.flush([MOCK_TODO]);
    expect(service.todos()).toEqual([MOCK_TODO]);
  });

  it('create sends POST /api/todos with title and appends to todos signal', () => {
    service.create('Buy milk');
    const req = httpMock.expectOne('/api/todos');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Buy milk' });
    req.flush(MOCK_TODO);
    expect(service.todos()).toContainEqual(MOCK_TODO);
  });

  it('update sends PATCH /api/todos/:id and replaces the todo in signal', () => {
    service.todos.set([MOCK_TODO]);
    service.update(1, { done: true });
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({ done: true });
    const updated: Todo = { ...MOCK_TODO, done: true };
    req.flush(updated);
    expect(service.todos()[0]?.done).toBe(true);
  });

  it('remove sends DELETE /api/todos/:id and removes the todo from signal', () => {
    service.todos.set([MOCK_TODO]);
    service.remove(1);
    const req = httpMock.expectOne('/api/todos/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null, { status: 204, statusText: 'No Content' });
    expect(service.todos()).toEqual([]);
  });
});
