<template>
  <a-layout-header class="top-header">
    <menu-fold-outlined
      class="trigger"
      @click="$emit('toggle-collapse')"
    />
    <div class="header-right">
      <a-dropdown>
        <a-space class="user-info">
          <a-avatar size="small" :src="store.user?.avatar">
            <template #icon><user-outlined /></template>
          </a-avatar>
          <span>{{ store.user?.nickname || '管理员' }}</span>
          <down-outlined style="font-size: 10px;" />
        </a-space>
        <template #overlay>
          <a-menu @click="handleUserMenu">
            <a-menu-item key="logout">
              <logout-outlined />
              <span style="margin-left: 8px;">退出登录</span>
            </a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
    </div>
  </a-layout-header>
</template>

<script setup>
import { useRouter } from 'vue-router';
import {
  MenuFoldOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from '@ant-design/icons-vue';

defineEmits(['toggle-collapse']);
const router = useRouter();

// The permission store will be created in Task 3.
// For now, use a minimal inline fallback.
const store = {
  user: null,
  logout() {
    // Will be replaced by real store in Task 3
    router.push('/login');
  },
};

function handleUserMenu({ key }) {
  if (key === 'logout') {
    store.logout();
    router.push('/login');
  }
}
</script>

<style scoped>
.top-header {
  background: #fff;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  height: 48px;
  line-height: 48px;
}
.trigger {
  font-size: 18px;
  cursor: pointer;
  color: var(--wms-muted);
}
.trigger:hover { color: var(--wms-blue); }
.header-right { display: flex; align-items: center; }
.user-info { cursor: pointer; }
</style>
