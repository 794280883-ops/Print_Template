import { watch, nextTick, onBeforeUnmount } from 'vue';

/**
 * Make an Ant Design Vue modal draggable by its title bar.
 *
 * Usage:
 *   const { setupDrag } = useDragModal();
 *   // In template:
 *   <a-modal v-model:open="visible" @after-open="setupDrag"> ... </a-modal>
 *
 * OR use with @vue:mounted on the modal wrapper:
 *   <a-modal v-model:open="visible" ref="modalRef"> ... </a-modal>
 *   setupDrag(() => modalRef.value?.$el)
 */
export function useDragModal() {
  let cleanup = null;

  function teardown() {
    if (cleanup) {
      cleanup();
      cleanup = null;
    }
  }

  /**
   * Attach drag behavior to the currently visible Ant Design modal.
   * Call this from @after-open or via a watcher + nextTick.
   */
  function attachDrag() {
    teardown();

    // Ant Design Vue renders modals inside .ant-modal-root which is
    // teleported to document.body. Find the last opened modal wrap.
    const wraps = document.querySelectorAll('.ant-modal-wrap');
    if (!wraps.length) return;

    // Pick the last (most recently opened) modal wrap
    const targetWrap = wraps[wraps.length - 1];
    const modal = targetWrap.querySelector('.ant-modal');
    const header = targetWrap.querySelector('.ant-modal-header');
    if (!modal || !header) return;

    const content = targetWrap.querySelector('.ant-modal-content');
    if (!content) return;

    // Reset any previous transform
    content.style.transform = '';
    content.style.transition = 'none';

    let dragging = false;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;

    header.style.cursor = 'move';
    header.style.userSelect = 'none';

    function onMouseDown(e) {
      // Only drag from the header area, ignore buttons inside
      if (e.target.closest('.ant-modal-close') || e.target.tagName === 'BUTTON') return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      modal.style.transition = 'none';
      document.body.style.userSelect = 'none';
    }

    function onMouseMove(e) {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      offsetX += dx;
      offsetY += dy;
      startX = e.clientX;
      startY = e.clientY;
      content.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
    }

    function onMouseUp() {
      if (!dragging) return;
      dragging = false;
      document.body.style.userSelect = '';
    }

    header.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    cleanup = () => {
      header.style.cursor = '';
      header.style.userSelect = '';
      header.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      if (content) {
        content.style.transform = '';
      }
    };
  }

  // Alternative: auto-attach when a reactive boolean becomes true
  function watchOpen(openRef) {
    watch(openRef, async (val) => {
      if (val) {
        await nextTick();
        // Small delay to let Ant Design finish its open animation
        setTimeout(attachDrag, 150);
      } else {
        teardown();
      }
    });
  }

  onBeforeUnmount(teardown);

  return { attachDrag, watchOpen, teardown };
}
