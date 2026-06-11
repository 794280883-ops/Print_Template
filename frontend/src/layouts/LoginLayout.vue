<template>
  <div class="login-layout">
    <router-view />
  </div>
</template>

<script setup>
</script>

<style scoped>
.login-layout {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #eef4fb 0%, #f3f6fb 100%);
}
</style>
