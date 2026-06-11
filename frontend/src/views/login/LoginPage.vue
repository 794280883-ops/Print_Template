<template>
  <div class="login-card">
    <div class="login-header">
      <h2>WMS 打印模板中心</h2>
      <p class="login-subtitle">模板管理系统</p>
    </div>
    <a-form
      :model="form"
      layout="vertical"
      @finish="handleLogin"
      autocomplete="off"
    >
      <a-form-item label="用户名" name="username"
        :rules="[{ required: true, message: '请输入用户名' }]">
        <a-input v-model:value="form.username" placeholder="任意用户名均可登录" size="large">
          <template #prefix><user-outlined /></template>
        </a-input>
      </a-form-item>

      <a-form-item label="密码" name="password"
        :rules="[{ required: true, message: '请输入密码' }]">
        <a-input-password v-model:value="form.password" placeholder="任意密码均可登录" size="large">
          <template #prefix><lock-outlined /></template>
        </a-input-password>
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit" block size="large" :loading="loading">
          登 录
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { usePermissionStore } from '../../stores/permission.js';

const router = useRouter();
const store = usePermissionStore();
const loading = ref(false);

const form = reactive({
  username: '',
  password: '',
});

async function handleLogin() {
  loading.value = true;
  // Mock: 模拟网络延迟
  await new Promise(r => setTimeout(r, 500));
  store.login({ username: form.username, password: form.password });
  loading.value = false;
  router.push('/templates');
}
</script>

<style scoped>
.login-card {
  width: 380px;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 14px 32px rgba(16, 24, 40, 0.08);
  padding: 40px 32px 32px;
}
.login-header {
  text-align: center;
  margin-bottom: 32px;
}
.login-header h2 {
  font-size: 22px;
  color: var(--wms-blue);
  margin: 0 0 4px;
}
.login-subtitle {
  color: var(--wms-muted);
  font-size: 13px;
  margin: 0;
}
</style>
