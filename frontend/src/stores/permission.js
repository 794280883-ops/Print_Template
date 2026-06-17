import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { login as loginApi } from '../api/authApi.js';

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
  const saved = loadSession();
  const user = ref(saved?.user || null);
  const permissions = ref(saved?.permissions || []);
  const menus = ref(saved?.menus || []);
  const token = ref(saved?.token || '');

  const hasUser = computed(() => !!user.value);

  function hasPermission(code) {
    if (!code) return true;
    return permissions.value.includes(code);
  }

  function getToken() { return token.value; }

  function persist() {
    saveSession({
      user: user.value,
      permissions: permissions.value,
      menus: menus.value,
      token: token.value,
    });
  }

  async function login(credentials) {
    const result = await loginApi(credentials.username, credentials.password);
    user.value = result.user;
    permissions.value = result.permissions;
    menus.value = result.menus;
    token.value = result.token;
    persist();
  }

  function logout() {
    user.value = null;
    permissions.value = [];
    menus.value = [];
    token.value = '';
    localStorage.removeItem(SESSION_KEY);
  }

  return {
    user, permissions, menus, token,
    hasUser, hasPermission, getToken,
    login, logout,
  };
});
