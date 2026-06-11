import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Mock: 全量权限码列表
const ALL_PERMISSIONS = [
  // 模板管理
  'template:view', 'template:create', 'template:edit', 'template:delete', 'template:publish',
  // 字段字典
  'field:view',
  // 业务数据
  'business:view', 'business:create', 'business:edit', 'business:delete', 'business:import',
  // 系统管理
  'system:user:view', 'system:user:create', 'system:user:edit', 'system:user:delete',
  'system:role:view', 'system:role:create', 'system:role:edit', 'system:role:delete',
  'system:menu:view', 'system:menu:create', 'system:menu:edit', 'system:menu:delete',
];

export const usePermissionStore = defineStore('permission', () => {
  // -- State --
  const user = ref(null);         // { id, username, nickname, avatar }
  const roles = ref([]);          // ['admin']
  const permissions = ref([]);    // ['template:view', ...]
  const menus = ref([]);          // 有权限的菜单项

  // -- Getters --
  const hasUser = computed(() => !!user.value);

  function hasPermission(code) {
    if (!code) return true; // 无权限要求的路由默认放行
    return permissions.value.includes(code);
  }

  // -- Actions --
  function login(credentials) {
    // Mock: 任意用户名密码均可登录，默认授予全部权限
    // 后续替换为: POST /api/v1/auth/login
    user.value = {
      id: 1,
      username: credentials.username || 'admin',
      nickname: '系统管理员',
      avatar: '',
    };
    roles.value = ['admin'];
    permissions.value = [...ALL_PERMISSIONS];
    // 从 localStorage 恢复菜单配置（Task 9 实现菜单管理后生效）
    const savedMenus = localStorage.getItem('wms_menus');
    menus.value = savedMenus ? JSON.parse(savedMenus) : [];
  }

  function logout() {
    user.value = null;
    roles.value = [];
    permissions.value = [];
    menus.value = [];
  }

  function fetchPermissions() {
    // Mock: 返回全量权限
    // 后续替换为: GET /api/v1/auth/permissions
    permissions.value = [...ALL_PERMISSIONS];
    roles.value = ['admin'];
  }

  return {
    user, roles, permissions, menus,
    hasUser, hasPermission,
    login, logout, fetchPermissions,
  };
});
