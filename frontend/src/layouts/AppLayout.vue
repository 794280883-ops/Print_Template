<template>
  <a-layout style="min-height: 100vh">
    <SideMenu />
    <a-layout>
      <TopHeader />
      <a-layout-content :style="{ margin: '16px', padding: '16px', background: '#fff', borderRadius: '8px', minHeight: '280px' }">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import SideMenu from './SideMenu.vue';
import TopHeader from './TopHeader.vue';
</script>
