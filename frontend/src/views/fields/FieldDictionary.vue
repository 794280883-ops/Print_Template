<template>
  <div class="field-dict">
    <a-card size="small">
      <a-tabs v-model:activeKey="activeType">
        <a-tab-pane key="LOCATION" tab="库位字段" />
        <a-tab-pane key="CONTAINER" tab="容器字段" />
        <a-tab-pane key="PRODUCT" tab="商品字段" />
      </a-tabs>

      <a-table
        :columns="columns"
        :data-source="fields"
        :pagination="false"
        size="middle"
        row-key="code"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'required'">
            <a-tag :color="record.required ? 'red' : 'default'">
              {{ record.required ? '必填' : '选填' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'example'">
            <code>{{ record.example }}</code>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { FIELD_DICT } from '../../data/constants.js';

const activeType = ref('LOCATION');

const columns = [
  { title: '中文名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '字段编码', dataIndex: 'code', key: 'code', width: 200 },
  { title: '类型', dataIndex: 'type', key: 'type', width: 80 },
  { title: '必填', dataIndex: 'required', key: 'required', width: 80 },
  { title: '示例值', key: 'example', width: 200 },
  { title: '说明', dataIndex: 'desc', key: 'desc', ellipsis: true },
];

const fields = computed(() => {
  return (FIELD_DICT[activeType.value] || []).map(f => ({
    ...f,
    required: !!f.required,
  }));
});
</script>

<style scoped>
.field-dict { padding: 0; }
</style>
