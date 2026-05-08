import { routes } from './app.routes';

describe('app routes', () => {
  it('redirects root to home', () => {
    const root = routes.find((r) => r.path === '');
    expect(root?.redirectTo).toBe('home');
  });

  it('has home route', () => {
    const home = routes.find((r) => r.path === 'home');
    expect(home).toBeDefined();
  });

  it('has todo route', () => {
    const todo = routes.find((r) => r.path === 'apps/todo');
    expect(todo).toBeDefined();
  });

  it('has wildcard fallback to home', () => {
    const wildcard = routes.find((r) => r.path === '**');
    expect(wildcard?.redirectTo).toBe('home');
  });
});
