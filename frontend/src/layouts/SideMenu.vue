<template>
  <a-layout-sider
    :collapsed="collapsed"
    @update:collapsed="val => emit('update:collapsed', val)"
    :trigger="null"
    collapsible
    width="220"
    :style="{ background: '#fff', borderRight: '1px solid #f0f0f0' }"
  >
    <div class="logo">
      <svg class="logo-icon" viewBox="0 0 40 40" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="4" width="28" height="32" rx="3" stroke="currentColor" stroke-width="2.2" fill="none"/>
        <path d="M24 4v6a3 3 0 003 3h6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="12" y1="17" x2="28" y2="17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="12" y1="22" x2="28" y2="22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="12" y1="27" x2="22" y2="27" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <rect x="15" y="8" width="10" height="4" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="16" y="8.5" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
      </svg>
      <span v-if="!collapsed" class="logo-text">打印模版系统</span>
    </div>
    <a-menu
      mode="inline"
      :selected-keys="selectedKeys"
      :open-keys="openKeys"
      @select="handleMenuSelect"
    >
      <template v-for="dir in store.menus" :key="dir.id">
        <a-menu-item-group v-if="dir.type === 'directory' && dir.visible" :key="dir.name" :title="dir.name">
          <template v-for="page in dir.children" :key="page.id">
            <a-menu-item v-if="page.type === 'page' && page.visible" :key="page.path">
              <component :is="iconMap[page.icon]" v-if="iconMap[page.icon]" />
              <span>{{ page.name }}</span>
            </a-menu-item>
          </template>
        </a-menu-item-group>
      </template>
    </a-menu>
  </a-layout-sider>
</template>

<script setup>
import { computed, h } from 'vue';
import { useRoute } from 'vue-router';
import { usePermissionStore } from '../stores/permission.js';
import {
  FileTextOutlined, DatabaseOutlined, TableOutlined,
  UserOutlined, TeamOutlined, MenuOutlined,
} from '@ant-design/icons-vue';

const props = defineProps({ collapsed: { type: Boolean, default: false } });
const emit = defineEmits(['update:collapsed', 'openTab']);

const store = usePermissionStore();
const route = useRoute();

const iconMap = {
  FileTextOutlined, DatabaseOutlined, TableOutlined,
  UserOutlined, TeamOutlined, MenuOutlined,
};

const selectedKeys = computed(() => [route.path]);

const openKeys = computed(() => {
  for (const dir of (store.menus || [])) {
    if (dir.children?.some(p => p.path === route.path)) return [dir.name];
  }
  return [];
});

function handleMenuSelect({ key }) {
  // Find page name from store.menus
  let title = key;
  for (const dir of (store.menus || [])) {
    for (const page of (dir.children || [])) {
      if (page.path === key) { title = page.name; break; }
    }
  }
  emit('openTab', { path: key, title });
}
</script>

<style scoped>
.logo {
  height: 56px; display: flex; align-items: center; justify-content: center;
  gap: 10px; border-bottom: 1px solid #f0f0f0; margin-bottom: 8px; padding: 0 16px;
}
.logo-icon { flex-shrink: 0; color: var(--wms-blue); }
.logo-text { font-size: 16px; font-weight: 600; color: var(--wms-blue); white-space: nowrap; line-height: 1; }
</style>
