import assert from "node:assert/strict";
import test from "node:test";
import * as recordService from "../src/services/recordService.js";

const { resolveRecordSortOptions } = recordService;

const schema = {
  recordCodeField: { code: "locationCode" },
  sortableFields: [
    { code: "locationCode" },
    { code: "warehouseCode" },
  ],
  systemFields: [
    { code: "printCount", sortable: true },
  ],
};

test("resolveRecordSortOptions keeps sortable fields", () => {
  assert.deepEqual(
    resolveRecordSortOptions({ sortField: "warehouseCode", sortDir: "DESC" }, schema),
    { sortField: "warehouseCode", sortDir: "DESC" },
  );
});

test("resolveRecordSortOptions falls back when field is not sortable", () => {
  assert.deepEqual(
    resolveRecordSortOptions({ sortField: "notSortable", sortDir: "DESC" }, schema),
    { sortField: "locationCode", sortDir: "ASC" },
  );
});

test("resolveRecordSortOptions falls back when field contains unsafe characters", () => {
  assert.deepEqual(
    resolveRecordSortOptions({ sortField: 'locationCode")) DESC --', sortDir: "DESC" }, schema),
    { sortField: "locationCode", sortDir: "ASC" },
  );
});

test("resolveRecordSortOptions allows sortable system fields", () => {
  assert.deepEqual(
    resolveRecordSortOptions({ sortField: "printCount", sortDir: "DESC" }, schema),
    { sortField: "printCount", sortDir: "DESC" },
  );
});

test("getBusinessInputFields excludes system fields", () => {
  assert.deepEqual(
    recordService.getBusinessInputFields({
      fields: [
        { code: "locationCode" },
        { code: "printCount", system: true },
      ],
    }),
    [{ code: "locationCode" }],
  );
});

test("deleteRecords removes selected business records by DB primary key IDs", async () => {
  assert.equal(typeof recordService.deleteRecords, "function");

  const calls = [];
  const result = await recordService.deleteRecords("LOCATION", { ids: [1, 2, 3] }, {
    removeByIds: async (ids) => {
      calls.push({ ids });
      return ids.length;
    },
  });

  assert.deepEqual(calls, [{ ids: [1, 2, 3] }]);
  assert.deepEqual(result, { deleted: 3 });
});

test("deleteRecords rejects empty selection", async () => {
  assert.equal(typeof recordService.deleteRecords, "function");

  await assert.rejects(
    () => recordService.deleteRecords("LOCATION", { ids: [] }, { removeByIds: async () => 0 }),
    /请选择要删除的业务数据/,
  );
});
