<template>
  <div class="user-manage">
    <a-card size="small">
      <a-space style="margin-bottom:12px;">
        <a-button type="primary" @click="handleAdd" v-permission="'system:user:create'">
          <plus-outlined /> 新增用户
        </a-button>
      </a-space>
      <a-table :columns="columns" :data-source="users" :loading="loading" :pagination="{ showSizeChanger: true, showTotal: t => `共 ${t} 条` }" row-key="id" size="middle" :scroll="{ x: 'max-content' }" @resizeColumn="onResizeColumn">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'roles'">
            <a-space wrap size="small"><a-tag v-for="r in (record.roleNames || [])" :key="r" color="blue">{{ r }}</a-tag></a-space>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 1 ? 'green' : 'red'">{{ record.status === 1 ? '启用' : '停用' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-button size="small" @click="handleEdit(record)" v-permission="'system:user:edit'">编辑</a-button>
              <a-button size="small" @click="handleToggle(record)" v-permission="'system:user:disable'">{{ record.status === 1 ? '停用' : '启用' }}</a-button>
              <a-button size="small" @click="openPwdModal(record)" v-permission="'system:user:password'">修改密码</a-button>
              <a-popconfirm title="确认删除?" @confirm="handleDelete(record)">
                <a-button size="small" danger v-permission="'system:user:delete'">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="pwdModalVisible" title="修改密码" cancel-text="取消" ok-text="确认" @ok="handleChangePwd" @cancel="pwdModalVisible = false" :confirm-loading="saving">
      <a-form layout="vertical"><a-form-item label="新密码" required><a-input-password v-model:value="pwdForm.password" placeholder="至少6位" /></a-form-item></a-form>
    </a-modal>

    <a-modal v-model:open="modalVisible" :title="editingId ? '编辑用户' : '新增用户'" cancel-text="取消" ok-text="确认" @ok="handleSave" @cancel="modalVisible = false" :confirm-loading="saving">
      <a-form layout="vertical" :model="form">
        <a-form-item label="用户编码" required><a-input v-model:value="form.username" placeholder="请输入用户编码" /></a-form-item>
        <a-form-item label="用户名称" required><a-input v-model:value="form.nickname" placeholder="请输入用户名称" /></a-form-item>
        <a-form-item v-if="!editingId" label="密码" required><a-input-password v-model:value="form.password" placeholder="请输入密码" /></a-form-item>
        <a-form-item label="角色"><a-select v-model:value="form.roleIds" mode="multiple" placeholder="请选择角色"><a-select-option v-for="r in allRoles" :key="r.id" :value="r.id">{{ r.name }}</a-select-option></a-select></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { PlusOutlined } from '@ant-design/icons-vue';
import { listUsers, createUser, updateUser, deleteUser, changePassword } from '../../api/userApi.js';
import { listRoles } from '../../api/roleApi.js';

const columns = ref([
  { title: '用户编码', dataIndex: 'username', key: 'username', resizable: true, width: 150 },
  { title: '用户名称', dataIndex: 'nickname', key: 'nickname', resizable: true, width: 150 },
  { title: '角色', dataIndex: 'roles', key: 'roles', resizable: true, width: 200 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 80 },
  { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 170 },
  { title: '操作', key: 'action', width: 300 },
]);

function onResizeColumn(w, col) {
  const idx = columns.value.findIndex(c => c.key === col.key);
  if (idx >= 0) columns.value[idx].width = w;
}

const users = ref([]);
const allRoles = ref([]);
const loading = ref(false);
const saving = ref(false);
const pwdModalVisible = ref(false);
const pwdForm = reactive({ userId: null, password: '' });
const modalVisible = ref(false);
const editingId = ref(null);
const form = reactive({ username: '', nickname: '', password: '', roleIds: [] });

async function loadData() {
  loading.value = true;
  try {
    const [{ rows }] = await Promise.all([listUsers({ pageSize: 100 }), listRoles().then(r => allRoles.value = r)]);
    users.value = (Array.isArray(rows) ? rows : []).map(u => ({
      ...u,
      roleIds: u.roleIds || [],
      roleNames: (u.roleIds || []).map(rid => {
        const r = allRoles.value.find(rr => rr.id === rid);
        return r ? r.name : '';
      }).filter(Boolean),
    }));
  } catch (e) {
    message.error('加载失败');
  } finally {
    loading.value = false;
  }
}

function handleAdd() { editingId.value = null; form.username = ''; form.nickname = ''; form.password = ''; form.roleIds = []; modalVisible.value = true; }
function handleEdit(record) { editingId.value = record.id; form.username = record.username; form.nickname = record.nickname; form.password = ''; form.roleIds = [...(record.roleIds || [])]; modalVisible.value = true; }

async function handleSave() {
  if (!form.username || !form.nickname) { message.warning('请填写必填项'); return; }
  saving.value = true;
  try {
    if (editingId.value) {
      await updateUser(editingId.value, { nickname: form.nickname, roleIds: form.roleIds, status: undefined });
    } else {
      if (!form.password) { message.warning('请输入密码'); saving.value = false; return; }
      await createUser({ username: form.username, nickname: form.nickname, password: form.password, roleIds: form.roleIds });
    }
    message.success('保存成功');
    modalVisible.value = false;
    loadData();
  } catch (e) {
    message.error('保存失败：' + (e.message || ''));
  } finally {
    saving.value = false;
  }
}

function openPwdModal(record) { pwdForm.userId = record.id; pwdForm.password = ''; pwdModalVisible.value = true; }

async function handleChangePwd() {
  if (!pwdForm.password || pwdForm.password.length < 6) { message.warning('密码至少6位'); return; }
  saving.value = true;
  try { await changePassword(pwdForm.userId, pwdForm.password); message.success('密码已修改'); pwdModalVisible.value = false; }
  catch (e) { message.error('修改失败：' + (e.message || '')); }
  finally { saving.value = false; }
}

async function handleToggle(record) {
  try {
    await updateUser(record.id, { status: record.status === 1 ? 0 : 1 });
    loadData();
  } catch (e) { message.error('操作失败'); }
}

async function handleDelete(record) {
  try {
    await deleteUser(record.id);
    message.success('删除成功');
    loadData();
  } catch (e) { message.error('删除失败：' + (e.message || '')); }
}

onMounted(loadData);
</script>
