import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/login',
    name: 'Login',
    meta: { layout: 'login' },
    component: () => import('../views/login/LoginPage.vue'),
  },
  {
    path: '/',
    redirect: '/templates',
  },
  {
    path: '/templates',
    name: 'TemplateList',
    meta: { permission: 'template:view', title: '模板列表', icon: 'FileTextOutlined', menuGroup: '模板管理' },
    component: () => import('../views/templates/TemplateList.vue'),
  },
  {
    path: '/templates/:id/designer',
    name: 'TemplateDesigner',
    meta: { permission: 'template:view', title: '模板设计器', hidden: true },
    component: () => import('../views/templates/TemplateDesigner.vue'),
  },
  {
    path: '/fields',
    name: 'FieldDictionary',
    meta: { permission: 'field:view', title: '模版字段', icon: 'DatabaseOutlined' },
    component: () => import('../views/fields/FieldDictionary.vue'),
  },
  {
    path: '/business',
    name: 'BusinessData',
    meta: { permission: 'business:view', title: '业务数据', icon: 'TableOutlined' },
    component: () => import('../views/business/BusinessData.vue'),
  },
  {
    path: '/system/users',
    name: 'UserManage',
    meta: { permission: 'system:user:view', title: '用户管理', icon: 'UserOutlined', menuGroup: '系统管理' },
    component: () => import('../views/system/UserManage.vue'),
  },
  {
    path: '/system/roles',
    name: 'RoleManage',
    meta: { permission: 'system:role:view', title: '角色管理', icon: 'TeamOutlined', menuGroup: '系统管理' },
    component: () => import('../views/system/RoleManage.vue'),
  },
  {
    path: '/system/menus',
    name: 'MenuManage',
    meta: { permission: 'system:menu:view', title: '菜单管理', icon: 'MenuOutlined', menuGroup: '系统管理' },
    component: () => import('../views/system/MenuManage.vue'),
  },
  {
    path: '/403',
    name: 'Forbidden',
    meta: { hidden: true },
    component: () => import('../views/error/Forbidden.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
