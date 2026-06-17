import { usePermissionStore } from '../stores/permission.js';

export default {
  mounted(el, binding) {
    const store = usePermissionStore();
    const permission = binding.value;
    const mode = binding.arg;

    if (!permission) return;

    if (!store.hasPermission(permission)) {
      if (mode === 'disabled') {
        el.disabled = true;
        el.classList.add('ant-btn-disabled');
      } else {
        el.style.display = 'none';
        // Also try DOM removal after a tick for Ant Design wrappers
        setTimeout(() => {
          if (el.parentNode) el.parentNode.removeChild(el);
        }, 0);
      }
    }
  },
};
