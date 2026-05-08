import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import AuthView from '../views/AuthView.vue';
import DashboardView from '../views/DashboardView.vue';
import EditorView from '../views/EditorView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/auth' 
  },
  {
    path: '/auth',
    name: 'Auth',
    component: AuthView,
    meta: { title: 'Login - ProsePal' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/editor/:id',
    name: 'Editor',
    component: EditorView,
    meta: { requiresAuth: true }
  },

  {
    path: '/share/:shareId',
    name: 'SharedEditor',
    component: () => import('../views/EditorView.vue'),
    props: { isReadOnly: true },
    meta: { requiresAuth: false } 
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  if (to.meta.title) document.title = to.meta.title as string;
  const token = localStorage.getItem('token');
  
  if (to.meta.requiresAuth && !token) {
    next('/auth');
  } else {
    next();
  }
});

export default router;