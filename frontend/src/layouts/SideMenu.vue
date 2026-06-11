<template>
  <a-layout-sider
    v-model:collapsed="collapsed"
    :trigger="null"
    collapsible
    :style="{ background: '#fff', borderRight: '1px solid #f0f0f0' }"
  >
    <div class="logo">
      <span v-if="!collapsed" class="logo-text">WMS 打印模板中心</span>
      <span v-else class="logo-text-compact">WMS</span>
    </div>
    <a-menu
      mode="inline"
      :selected-keys="selectedKeys"
      :open-keys="openKeys"
      @select="handleMenuSelect"
    >
      <template v-for="group in menuGroups" :key="group.key">
        <a-menu-item-group v-if="group.children && group.children.length > 0" :title="group.key">
          <a-menu-item
            v-for="item in group.children"
            :key="item.path"
          >
            <component :is="item.icon" v-if="item.icon" />
            <span>{{ item.title }}</span>
          </a-menu-item>
        </a-menu-item-group>
        <a-menu-item
          v-else-if="group.items && group.items.length === 1"
          :key="group.items[0].path"
        >
          <component :is="group.items[0].icon" v-if="group.items[0].icon" />
          <span>{{ group.items[0].title }}</span>
        </a-menu-item>
      </template>
    </a-menu>
  </a-layout-sider>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const collapsed = ref(false);

// Build menu groups from routes
const menuRoutes = router.getRoutes().filter(r => !r.meta.hidden && r.path !== '/' && r.path !== '/login' && r.path !== '/403');

const menuGroups = computed(() => {
  const groups = new Map();
  for (const r of menuRoutes) {
    const group = r.meta.menuGroup || 'default';
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(r);
  }
  const result = [];
  for (const [key, items] of groups) {
    if (key === 'default') {
      result.push({ key, items });
    } else {
      result.push({ key, children: items });
    }
  }
  return result;
});

const selectedKeys = computed(() => [route.path]);

const openKeys = ref(
  menuRoutes
    .filter(r => r.meta.menuGroup && route.path.startsWith(r.path.split('/').slice(0, 3).join('/')))
    .map(r => r.path)
);

function handleMenuSelect({ key }) {
  router.push(key);
}
</script>

<style scoped>
.logo {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 8px;
}
.logo-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--wms-blue);
  white-space: nowrap;
}
.logo-text-compact {
  font-size: 14px;
  font-weight: 700;
  color: var(--wms-blue);
}
</style>
