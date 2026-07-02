<template>
  <a-config-provider :locale="zhCN">
    <component :is="layout">
      <router-view />
    </component>
  </a-config-provider>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import zhCN from 'ant-design-vue/es/locale/zh_CN';
import AppLayout from './layouts/AppLayout.vue';
import LoginLayout from './layouts/LoginLayout.vue';

const route = useRoute();
const layout = computed(() => {
  if (route.meta.layout === 'login') return LoginLayout;
  return AppLayout;
});
</script>
