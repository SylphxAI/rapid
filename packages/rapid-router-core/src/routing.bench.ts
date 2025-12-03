import { bench, describe } from 'vitest';
import { createRouter } from './routing';

describe('router primitives', () => {
  bench('create router', () => {
    createRouter([
      { path: '/', component: 'Home' },
      { path: '/users/:id', component: 'User' },
    ]);
  });

  bench('match simple route', () => {
    const router = createRouter([
      { path: '/', component: 'Home' },
      { path: '/about', component: 'About' },
    ]);

    return () => {
      router.match('/about');
    };
  });

  bench('match parameterized route', () => {
    const router = createRouter([{ path: '/users/:id', component: 'User' }]);

    let i = 0;
    return () => {
      router.match(`/users/${i++}`);
    };
  });

  bench('match wildcard route', () => {
    const router = createRouter([{ path: '/docs/*', component: 'Docs' }]);

    let i = 0;
    return () => {
      router.match(`/docs/section${i++}/page`);
    };
  });

  bench('match optional params', () => {
    const router = createRouter([{ path: '/posts/:id?', component: 'Posts' }]);

    let i = 0;
    return () => {
      router.match(i++ % 2 ? '/posts/123' : '/posts');
    };
  });
});

describe('router with multiple routes', () => {
  bench('match from 10 routes', () => {
    const router = createRouter([
      { path: '/', component: 'Home' },
      { path: '/about', component: 'About' },
      { path: '/contact', component: 'Contact' },
      { path: '/users', component: 'Users' },
      { path: '/users/:id', component: 'User' },
      { path: '/posts', component: 'Posts' },
      { path: '/posts/:id', component: 'Post' },
      { path: '/settings', component: 'Settings' },
      { path: '/profile', component: 'Profile' },
      { path: '/admin/*', component: 'Admin' },
    ]);

    const paths = ['/', '/about', '/users/123', '/posts/456', '/admin/dashboard'];
    let i = 0;

    return () => {
      const path = paths[i++ % paths.length];
      if (path) router.match(path);
    };
  });

  bench('match from 50 routes', () => {
    const routes = Array.from({ length: 50 }, (_, i) => ({
      path: `/route${i}`,
      component: `Component${i}`,
    }));
    const router = createRouter(routes);

    let i = 0;
    return () => {
      router.match(`/route${i++ % 50}`);
    };
  });

  bench('no match (fallback)', () => {
    const router = createRouter([
      { path: '/', component: 'Home' },
      { path: '/about', component: 'About' },
    ]);

    let i = 0;
    return () => {
      router.match(`/nonexistent${i++}`);
    };
  });
});

describe('router patterns', () => {
  bench('nested route matching', () => {
    const router = createRouter([
      { path: '/admin/users/:id/settings/:tab', component: 'AdminUserSettings' },
    ]);

    let i = 0;
    return () => {
      router.match(`/admin/users/${i % 100}/settings/profile`);
      i++;
    };
  });

  bench('query string parsing', () => {
    const router = createRouter([{ path: '/search', component: 'Search' }]);

    let i = 0;
    return () => {
      router.match(`/search?q=test${i}&page=${i % 10}`);
      i++;
    };
  });

  bench('complex path extraction', () => {
    const router = createRouter([
      { path: '/api/:version/users/:userId/posts/:postId', component: 'ApiRoute' },
    ]);

    let i = 0;
    return () => {
      router.match(`/api/v${i % 3}/users/${i % 100}/posts/${i % 1000}`);
      i++;
    };
  });
});

describe('router navigation', () => {
  bench('navigate to simple path', () => {
    const router = createRouter([
      { path: '/', component: 'Home' },
      { path: '/about', component: 'About' },
    ]);

    return () => {
      router.navigate('/about');
    };
  });

  bench('navigate with params', () => {
    const router = createRouter([{ path: '/users/:id', component: 'User' }]);

    let i = 0;
    return () => {
      router.navigate(`/users/${i++}`);
    };
  });

  bench('navigate with query', () => {
    const router = createRouter([{ path: '/search', component: 'Search' }]);

    let i = 0;
    return () => {
      router.navigate(`/search?q=query${i++}`);
    };
  });
});
