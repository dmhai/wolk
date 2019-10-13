import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
  mode: 'hash',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/notesList/:id',
      name: 'notesList',
      component: () => import(/* webpackChunkName: "notesList" */ './views/NotesList.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import(/* webpackChunkName: "login" */ './views/Login.vue'),
    },
    {
      path: '/overview',
      name: 'overview',
      component: () => import(/* webpackChunkName: "overview" */ './views/Overview.vue'),
    },
    {
      path: '/addNotebook',
      name: 'addNotebook',
      component: () => import(/* webpackChunkName: "addNotebook" */ './views/AddNotebook.vue'),
    },
    {
      path: '/updateNotebook/:id',
      name: 'updateNotebook',
      component: () => import(/* webpackChunkName: "updateNotebook" */ './views/UpdateNotebook.vue'),
    },
  ],
});
