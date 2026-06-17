<template>
  <a-layout style="min-height: 100vh">
    <SideMenu v-model:collapsed="collapsed" @open-tab="openTab" />
    <a-layout>
      <TopHeader @toggle-collapse="collapsed = !collapsed" />
      <div v-if="tabs.length" style="background:#fff;border-bottom:1px solid #f0f0f0;padding:0 16px;display:flex;align-items:center;gap:0;position:relative;">
        <div
          v-for="tab in tabs" :key="tab.path"
          :style="{
            padding:'6px 14px',cursor:'pointer',fontSize:'13px',
            borderBottom: activeTab === tab.path ? '2px solid #1677ff' : '2px solid transparent',
            color: activeTab === tab.path ? '#1677ff' : '#666',
            fontWeight: activeTab === tab.path ? 500 : 400,
            whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:'6px'
          }"
          @click="switchTab(tab.path)"
          @contextmenu.prevent="showContextMenu($event, tab)"
        >
          <span>{{ tab.title }}</span>
          <span @click.stop="closeTab(tab.path)" style="font-size:11px;color:#999;cursor:pointer;line-height:1;">✕</span>
        </div>
        <!-- Right-click context menu -->
        <div v-if="ctxVisible" :style="{position:'fixed',left:ctxX+'px',top:ctxY+'px',zIndex:1050,background:'#fff',border:'1px solid #e8e8e8',borderRadius:'4px',boxShadow:'0 2px 8px rgba(0,0,0,.1)',padding:'4px 0',minWidth:'100px'}">
          <div @click="closeTab(ctxTab.path);ctxVisible=false" style="padding:6px 16px;cursor:pointer;font-size:13px;" @mouseenter="e=>e.target.style.background='#f5f5f5'" @mouseleave="e=>e.target.style.background=''">关闭</div>
          <div @click="closeOthers(ctxTab.path);ctxVisible=false" style="padding:6px 16px;cursor:pointer;font-size:13px;" @mouseenter="e=>e.target.style.background='#f5f5f5'" @mouseleave="e=>e.target.style.background=''">关闭其它</div>
          <div @click="closeAll();ctxVisible=false" style="padding:6px 16px;cursor:pointer;font-size:13px;" @mouseenter="e=>e.target.style.background='#f5f5f5'" @mouseleave="e=>e.target.style.background=''">关闭所有</div>
        </div>
      </div>
      <div v-if="ctxVisible" style="position:fixed;inset:0;z-index:1049;" @click="ctxVisible=false"></div>
      <a-layout-content :style="{ margin: tabs.length ? '12px 16px' : '16px', padding: '16px', background: '#fff', borderRadius: '8px', minHeight: '280px' }">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SideMenu from './SideMenu.vue';
import TopHeader from './TopHeader.vue';

const collapsed = ref(false);
const router = useRouter();
const route = useRoute();
const tabs = ref([]);
const activeTab = ref('');
const ctxVisible = ref(false);
const ctxX = ref(0);
const ctxY = ref(0);
const ctxTab = ref(null);

const PATH_LABEL = {
  '/templates': '模板列表',
  '/fields': '模版字段',
  '/business': '业务数据',
  '/system/users': '用户管理',
  '/system/roles': '角色管理',
  '/system/menus': '菜单管理',
};

watch(() => route.path, (path) => {
  if (path === '/login' || path === '/403' || path === '/') return;
  const existing = tabs.value.find(t => t.path === path);
  if (!existing) {
    tabs.value.push({ path, title: PATH_LABEL[path] || path });
  }
  activeTab.value = path;
}, { immediate: true });

function showContextMenu(e, tab) {
  ctxX.value = e.clientX;
  ctxY.value = e.clientY;
  ctxTab.value = tab;
  ctxVisible.value = true;
}

function openTab({ path, title }) {
  const existing = tabs.value.find(t => t.path === path);
  if (existing) { activeTab.value = path; router.push(path); return; }
  tabs.value.push({ path, title: title || PATH_LABEL[path] || path });
  activeTab.value = path;
  router.push(path);
}

function switchTab(path) { activeTab.value = path; router.push(path); }

function closeTab(path) {
  removeTab(path);
  if (activeTab.value === path) activateNext(path);
}

function closeOthers(path) {
  tabs.value = tabs.value.filter(t => t.path === path);
  activeTab.value = path;
}

function closeAll() {
  tabs.value = [];
  router.push('/templates');
}

function removeTab(path) {
  const idx = tabs.value.findIndex(t => t.path === path);
  if (idx >= 0) tabs.value.splice(idx, 1);
}

function activateNext(closedPath) {
  const next = tabs.value[tabs.value.length - 1];
  if (next) { activeTab.value = next.path; router.push(next.path); }
  else { activeTab.value = ''; router.push('/templates'); }
}

onMounted(() => {
  const path = route.path;
  if (path !== '/login' && path !== '/403' && path !== '/') {
    tabs.value = [{ path, title: PATH_LABEL[path] || path }];
    activeTab.value = path;
  }
});
</script>
