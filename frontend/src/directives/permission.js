import { usePermissionStore } from '../stores/permission.js';

export default {
  mounted(el, binding) {
    const store = usePermissionStore();
    const permission = binding.value;
    const mode = binding.arg; // undefined = remove, 'disabled' = disable

    if (!permission) return;

    if (!store.hasPermission(permission)) {
      if (mode === 'disabled') {
        el.disabled = true;
        el.classList.add('ant-btn-disabled');
      } else {
        el.parentNode?.removeChild(el);
      }
    }
  },
};
