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
        <!-- 文档底版 -->
        <rect x="6" y="4" width="28" height="32" rx="3" stroke="currentColor" stroke-width="2.2" fill="none"/>
        <!-- 折叠角 -->
        <path d="M24 4v6a3 3 0 003 3h6" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <!-- 内部网格线 → 模版 -->
        <line x1="12" y1="17" x2="28" y2="17" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="12" y1="22" x2="28" y2="22" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <line x1="12" y1="27" x2="22" y2="27" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        <!-- 打印标记 -->
        <rect x="15" y="8" width="10" height="4" rx="1" fill="currentColor" opacity="0.3"/>
        <rect x="16" y="8.5" width="8" height="3" rx="0.5" fill="currentColor" opacity="0.6"/>
      </svg>
      <span v-if="!collapsed" class="logo-text">打印模板中心</span>
    </div>
    <a-menu
      mode="inline"
      :selected-keys="selectedKeys"
      :open-keys="openKeys"
      @select="handleMenuSelect"
    >
      <!-- 模板管理 -->
      <a-menu-item-group key="模板管理" title="📋 模板管理">
        <a-menu-item key="/templates">
          <FileTextOutlined />
          <span>模板列表</span>
        </a-menu-item>
      </a-menu-item-group>

      <!-- 字段与数据 -->
      <a-menu-item-group key="字段与数据" title="📖 字段与数据">
        <a-menu-item key="/fields">
          <DatabaseOutlined />
          <span>模版字段</span>
        </a-menu-item>
        <a-menu-item key="/business">
          <TableOutlined />
          <span>业务数据</span>
        </a-menu-item>
      </a-menu-item-group>

      <!-- 系统管理 -->
      <a-menu-item-group key="系统管理" title="⚙️ 系统管理">
        <a-menu-item key="/system/users">
          <UserOutlined />
          <span>用户管理</span>
        </a-menu-item>
        <a-menu-item key="/system/roles">
          <TeamOutlined />
          <span>角色管理</span>
        </a-menu-item>
        <a-menu-item key="/system/menus">
          <MenuOutlined />
          <span>菜单管理</span>
        </a-menu-item>
      </a-menu-item-group>
    </a-menu>
  </a-layout-sider>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  FileTextOutlined,
  DatabaseOutlined,
  TableOutlined,
  UserOutlined,
  TeamOutlined,
  MenuOutlined,
} from '@ant-design/icons-vue';

const props = defineProps({ collapsed: { type: Boolean, default: false } });
const emit = defineEmits(['update:collapsed']);

const router = useRouter();
const route = useRoute();

const selectedKeys = computed(() => [route.path]);

// 按当前路由自动展开对应菜单组
const openKeys = computed(() => {
  const path = route.path;
  if (path === '/templates' || path.startsWith('/templates/')) return ['模板管理'];
  if (path === '/fields' || path === '/business') return ['字段与数据'];
  if (path.startsWith('/system/')) return ['系统管理'];
  return ['模板管理'];
});

function handleMenuSelect({ key }) {
  router.push(key);
}
</script>

<style scoped>
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
  padding: 0 16px;
}
.logo-icon {
  flex-shrink: 0;
  color: var(--wms-blue);
}
.logo-text {
  font-size: 16px;
  font-weight: 600;
  color: var(--wms-blue);
  white-space: nowrap;
  line-height: 1;
}
</style>
