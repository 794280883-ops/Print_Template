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

const SESSION_KEY = 'wms_session';

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(data) {
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch { /* noop */ }
}

export const usePermissionStore = defineStore('permission', () => {
  // -- State --
  // 从 localStorage 恢复登录态，避免页面刷新或 goto 导航后丢失
  const saved = loadSession();
  const user = ref(saved?.user || null);
  const roles = ref(saved?.roles || []);
  const permissions = ref(saved?.permissions || []);

  // -- Getters --
  const hasUser = computed(() => !!user.value);

  function hasPermission(code) {
    if (!code) return true;
    return permissions.value.includes(code);
  }

  function persist() {
    saveSession({
      user: user.value,
      roles: roles.value,
      permissions: permissions.value,
    });
  }

  // -- Actions --
  function login(credentials) {
    user.value = {
      id: 1,
      username: credentials.username || 'admin',
      nickname: '系统管理员',
      avatar: '',
    };
    roles.value = ['admin'];
    permissions.value = [...ALL_PERMISSIONS];
    persist();
  }

  function logout() {
    user.value = null;
    roles.value = [];
    permissions.value = [];
    localStorage.removeItem(SESSION_KEY);
  }

  return {
    user, roles, permissions,
    hasUser, hasPermission,
    login, logout,
  };
});
