import { createApp } from 'vue';
import { createPinia } from 'pinia';
import Avatar from 'ant-design-vue/es/avatar';
import Button from 'ant-design-vue/es/button';
import Card from 'ant-design-vue/es/card';
import Checkbox from 'ant-design-vue/es/checkbox';
import Col from 'ant-design-vue/es/col';
import ConfigProvider from 'ant-design-vue/es/config-provider';
import DatePicker from 'ant-design-vue/es/date-picker';
import Dropdown from 'ant-design-vue/es/dropdown';
import Form from 'ant-design-vue/es/form';
import Input from 'ant-design-vue/es/input';
import InputNumber from 'ant-design-vue/es/input-number';
import Layout from 'ant-design-vue/es/layout';
import Menu from 'ant-design-vue/es/menu';
import Modal from 'ant-design-vue/es/modal';
import Pagination from 'ant-design-vue/es/pagination';
import Popconfirm from 'ant-design-vue/es/popconfirm';
import Radio from 'ant-design-vue/es/radio';
import Result from 'ant-design-vue/es/result';
import Row from 'ant-design-vue/es/row';
import Select from 'ant-design-vue/es/select';
import Space from 'ant-design-vue/es/space';
import Switch from 'ant-design-vue/es/switch';
import Table from 'ant-design-vue/es/table';
import Tabs from 'ant-design-vue/es/tabs';
import Tag from 'ant-design-vue/es/tag';
import Tree from 'ant-design-vue/es/tree';
import message from 'ant-design-vue/es/message';
import 'ant-design-vue/dist/reset.css';
import './styles/wms.css';
import App from './App.vue';
import router from './router/index.js';
import permissionDirective from './directives/permission.js';

const app = createApp(App);
const antComponents = [
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  DatePicker,
  Dropdown,
  Form,
  Input,
  InputNumber,
  Layout,
  Menu,
  Modal,
  Pagination,
  Popconfirm,
  Radio,
  Result,
  Row,
  Select,
  Space,
  Switch,
  Table,
  Tabs,
  Tag,
  Tree,
];

app.use(createPinia());
app.use(router);
antComponents.forEach((component) => app.use(component));
app.directive('permission', permissionDirective);

// 全局 message 配置
message.config({
  top: '80px',
  duration: 3,
  maxCount: 3,
});

app.mount('#app');
