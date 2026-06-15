import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Antd, { message } from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import './styles/wms.css';
import App from './App.vue';
import router from './router/index.js';
import permissionDirective from './directives/permission.js';

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(Antd);
app.directive('permission', permissionDirective);

// 全局 message 配置
message.config({
  top: '80px',
  duration: 3,
  maxCount: 3,
});

app.mount('#app');
