<template>
  <div class="login-layout">
    <!-- Decorative background shapes -->
    <div class="bg-shape bg-shape-1"></div>
    <div class="bg-shape bg-shape-2"></div>
    <div class="bg-shape bg-shape-3"></div>
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
  background: linear-gradient(135deg, #0c1f3f 0%, #1a3a6b 25%, #1e5aa8 50%, #2176d4 75%, #1b5cb8 100%);
  position: relative;
  overflow: hidden;
}
/* Decorative circles */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  background: #fff;
}
.bg-shape-1 {
  width: 600px; height: 600px;
  top: -200px; right: -100px;
}
.bg-shape-2 {
  width: 400px; height: 400px;
  bottom: -100px; left: -80px;
}
.bg-shape-3 {
  width: 200px; height: 200px;
  top: 50%; left: 60%;
  opacity: 0.05;
}
</style>
