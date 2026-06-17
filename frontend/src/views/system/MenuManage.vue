<template>
  <div class="menu-manage" style="display:flex;gap:16px;height:calc(100vh - 120px);">
    <!-- Left: Tree -->
    <a-card size="small" title="菜单树" style="width:320px;flex-shrink:0;overflow:auto;">
      <template #extra>
        <a-space>
          <a-button size="small" type="primary" @click="handleAddRoot" v-permission="'system:menu:create'">新增顶部</a-button>
          <a-button size="small" @click="handleAddChild(currentMenuId)" :disabled="!currentMenuId" v-permission="'system:menu:create'">添加子项</a-button>
        </a-space>
      </template>
      <a-tree
        v-if="treeData.length"
        :tree-data="treeData"
        :selected-keys="selectedKeys"
        :expanded-keys="expandedKeys"
        :field-names="{ children: 'children', title: 'title', key: 'key' }"
        block-node
        @select="handleSelect"
        @expand="handleExpand"
      >
        <template #title="{ title, icon: iconName, type }">
          <span :style="{ color: type === 'directory' ? '#1677ff' : type === 'page' ? '#333' : '#999', fontWeight: type === 'directory' ? 600 : 400 }">
            {{ type === 'directory' ? '📁' : type === 'page' ? '📄' : '🔘' }} {{ title }}
          </span>
        </template>
      </a-tree>
      <div v-else style="text-align:center;color:#999;padding:40px 0;">暂无菜单</div>
    </a-card>

    <!-- Right: Detail -->
    <a-card size="small" :title="currentMenuId ? '编辑菜单' : '选择左侧菜单查看'" style="flex:1;overflow:auto;">
      <div v-if="currentMenuId">
        <template v-if="currentMenu">
          <a-form layout="vertical" :model="form">
            <a-row :gutter="16">
              <a-col :span="12"><a-form-item label="上级菜单"><a-input :value="parentName" disabled /></a-form-item></a-col>
              <a-col :span="12"><a-form-item label="类型"><a-tag :color="currentMenu.type === 'directory' ? 'purple' : currentMenu.type === 'page' ? 'blue' : 'default'">{{ TYPE_MAP[currentMenu.type] }}</a-tag></a-form-item></a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="12"><a-form-item label="名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
              <a-col :span="12"><a-form-item label="类型" required><a-select v-model:value="form.type"><a-select-option value="directory">目录</a-select-option><a-select-option value="page">页面</a-select-option><a-select-option value="button">按钮</a-select-option></a-select></a-form-item></a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col v-if="form.type === 'page'" :span="12"><a-form-item label="路由路径"><a-input v-model:value="form.path" placeholder="/templates" /></a-form-item></a-col>
              <a-col v-if="form.type !== 'directory'" :span="12"><a-form-item label="权限编码"><a-input v-model:value="form.permission_code" placeholder="template:view" /></a-form-item></a-col>
            </a-row>
            <a-row :gutter="16">
              <a-col :span="8"><a-form-item label="图标"><a-input v-model:value="form.icon" placeholder="FileTextOutlined" /></a-form-item></a-col>
              <a-col :span="4"><a-form-item label="排序"><a-input-number v-model:value="form.sort_no" :min="0" style="width:100%" /></a-form-item></a-col>
              <a-col :span="4"><a-form-item label="可见"><a-switch v-model:checked="form.visible" /></a-form-item></a-col>
            </a-row>
          </a-form>
          <div style="border-top:1px solid #f0f0f0;padding-top:12px;margin-top:12px;">
            <a-space>
              <a-button type="primary" :loading="saving" @click="handleSave" v-permission="'system:menu:edit'">保存</a-button>
              <a-button @click="handleResetForm">重置</a-button>
              <a-popconfirm title="确认删除此菜单及其子菜单?" @confirm="handleDelete">
                <a-button danger v-permission="'system:menu:delete'">删除</a-button>
              </a-popconfirm>
            </a-space>
          </div>
        </template>
      </div>
      <div v-else style="text-align:center;color:#999;padding:80px 0;">← 点击左侧菜单节点查看详情</div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { listMenus, createMenu, updateMenu, deleteMenu } from '../../api/menuApi.js';

const TYPE_MAP = { directory: '目录', page: '页面', button: '按钮' };

const menus = ref([]);
const expandedKeys = ref([]);
const allKeys = computed(() => {
  const keys = [];
  function walk(nodes) {
    for (const n of nodes) {
      keys.push(n.key);
      if (n.children) walk(n.children);
    }
  }
  walk(treeData.value);
  return keys;
});
const selectedKeys = ref([]);
const currentMenuId = ref(null);
const saving = ref(false);

const form = ref({ name: '', type: 'page', path: '', permission_code: '', icon: '', sort_no: 0, visible: true });
const editingId = ref(null);
const addingParentId = ref(0);

const treeData = computed(() => buildTree(menus.value, 0));

function buildTree(rows, parentId) {
  return rows
    .filter(r => r.parent_id === parentId)
    .sort((a, b) => (a.sort_no || 0) - (b.sort_no || 0))
    .map(r => ({
      key: r.id,
      title: r.name,
      type: r.type,
      icon: r.icon,
      children: buildTree(rows, r.id),
    }));
}

const currentMenu = computed(() => menus.value.find(m => m.id === currentMenuId.value));
const parentName = computed(() => {
  if (!currentMenu.value) return '';
  const p = menus.value.find(m => m.id === currentMenu.value.parent_id);
  return p ? p.name : '顶级';
});

function findParent(id) {
  const m = menus.value.find(x => x.id === id);
  return m ? m.parent_id : 0;
}

function collectDescendantIds(id, list) {
  list.push(id);
  for (const m of menus.value) {
    if (m.parent_id === id) collectDescendantIds(m.id, list);
  }
}

async function loadData() {
  try { menus.value = await listMenus(); } catch { /* noop */ }
  expandedKeys.value = [...allKeys.value];
}

function handleSelect(keys) {
  if (!keys.length) { currentMenuId.value = null; return; }
  currentMenuId.value = keys[0];
  const m = menus.value.find(x => x.id === keys[0]);
  if (m) {
    editingId.value = m.id;
    form.value = { name: m.name, type: m.type, path: m.path || '', permission_code: m.permission_code || '', icon: m.icon || '', sort_no: m.sort_no || 0, visible: m.visible !== 0 };
  }
}

function handleExpand(keys) { expandedKeys.value = keys; }

function handleAddRoot() {
  currentMenuId.value = null; editingId.value = null; addingParentId.value = 0;
  form.value = { name: '', type: 'directory', path: '', permission_code: '', icon: '', sort_no: 0, visible: true };
}

function handleAddChild(parentId) {
  if (!parentId) { message.info('请先选择左侧菜单节点'); return; }
  const p = menus.value.find(m => m.id === parentId);
  editingId.value = null; addingParentId.value = parentId;
  form.value = {
    name: '', type: p?.type === 'directory' ? 'page' : 'button',
    path: '', permission_code: '', icon: '', sort_no: 0, visible: true,
  };
  currentMenuId.value = parentId; // keep parent selected
}

function handleResetForm() {
  const m = currentMenu.value;
  if (m) {
    form.value = { name: m.name, type: m.type, path: m.path || '', permission_code: m.permission_code || '', icon: m.icon || '', sort_no: m.sort_no || 0, visible: m.visible !== 0 };
  }
}

async function handleSave() {
  if (!form.value.name || !form.value.type) { message.warning('请填写必填项'); return; }
  saving.value = true;
  try {
    const data = { ...form.value, parent_id: editingId.value ? currentMenu.value.parent_id : addingParentId.value };
    if (editingId.value) {
      await updateMenu(editingId.value, data);
    } else {
      await createMenu(data);
    }
    message.success('保存成功');
    await loadData();
    // Keep selection if editing, expand parent
    if (editingId.value) {
      currentMenuId.value = editingId.value;
      selectedKeys.value = [editingId.value];
    }
  } catch (e) { message.error('保存失败：' + (e.message || '')); }
  finally { saving.value = false; }
}

async function handleDelete() {
  if (!currentMenuId.value) return;
  try {
    await deleteMenu(currentMenuId.value);
    message.success('删除成功');
    currentMenuId.value = null;
    await loadData();
  } catch (e) { message.error('删除失败：' + (e.message || '')); }
}

onMounted(loadData);
</script>
