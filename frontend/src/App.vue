<template>
  <component :is="layout">
    <router-view />
  </component>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import AppLayout from './layouts/AppLayout.vue';
import LoginLayout from './layouts/LoginLayout.vue';

const route = useRoute();
const layout = computed(() => {
  if (route.meta.layout === 'login') return LoginLayout;
  return AppLayout;
});
</script>
