<template>
  <div class="home-page">
    <div class="home-content">
      <svg viewBox="0 0 80 80" width="80" height="80" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="12" y="8" width="56" height="64" rx="6" stroke="#1677ff" stroke-width="3" fill="none"/>
        <path d="M48 8v12a6 6 0 006 6h12" stroke="#1677ff" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <line x1="24" y1="34" x2="56" y2="34" stroke="#1677ff" stroke-width="2" stroke-linecap="round"/>
        <line x1="24" y1="44" x2="56" y2="44" stroke="#1677ff" stroke-width="2" stroke-linecap="round"/>
        <line x1="24" y1="54" x2="44" y2="54" stroke="#1677ff" stroke-width="2" stroke-linecap="round"/>
        <rect x="30" y="16" width="20" height="8" rx="2" fill="#1677ff" opacity="0.2"/>
        <rect x="32" y="17" width="16" height="6" rx="1" fill="#1677ff" opacity="0.4"/>
      </svg>
      <h1>打印模版系统</h1>
      <p>可视化打印模板设计与管理平台</p>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  display: flex; align-items: center; justify-content: center;
  min-height: calc(100vh - 160px);
}
.home-content {
  text-align: center; color: #333;
}
.home-content h1 {
  font-size: 28px; color: #1677ff; margin: 20px 0 8px; font-weight: 600;
}
.home-content p {
  font-size: 15px; color: #999; margin: 0;
}
</style>
