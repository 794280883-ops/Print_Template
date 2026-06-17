<template>
  <div class="login-card">
    <div class="login-header">
      <h2>打印模版系统</h2>
      <p class="login-subtitle">可视化打印模板设计与管理平台</p>
    </div>
    <a-form
      :model="form"
      layout="vertical"
      @finish="handleLogin"
      autocomplete="off"
    >
      <a-form-item label="用户名" name="username"
        :rules="[{ required: true, message: '请输入用户名' }]">
        <a-input v-model:value="form.username" placeholder="请输入用户名" size="large">
          <template #prefix><user-outlined /></template>
        </a-input>
      </a-form-item>

      <a-form-item label="密码" name="password"
        :rules="[{ required: true, message: '请输入密码' }]">
        <a-input-password v-model:value="form.password" placeholder="请输入密码" size="large">
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
import { message } from 'ant-design-vue';
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
  try {
    await store.login({ username: form.username, password: form.password });
    router.push('/');
  } catch (e) {
    message.error(e.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-card {
  width: 380px;
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  padding: 44px 36px 36px;
  backdrop-filter: blur(10px);
  position: relative;
  z-index: 1;
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
