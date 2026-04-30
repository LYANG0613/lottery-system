import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Entry',
    component: () => import('../views/EntryPage.vue')
  },
  {
    path: '/lottery',
    name: 'Lottery',
    component: () => import('../views/LotteryPage.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminPage.vue')
  },
  {
    path: '/winners',
    name: 'Winners',
    component: () => import('../views/WinnersPage.vue')
  }
]

const router = createRouter({
  history: createWebHistory('/lottery-system'),
  routes
})

export default router
