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

test("deleteRecords removes selected business records through repository", async () => {
  assert.equal(typeof recordService.deleteRecords, "function");

  const calls = [];
  const result = await recordService.deleteRecords("location", { codes: [" KW-001 ", "", "KW-002"] }, {
    removeMany: async (moduleCode, recordCodes) => {
      calls.push({ moduleCode, recordCodes });
      return recordCodes.length;
    },
  });

  assert.deepEqual(calls, [{ moduleCode: "LOCATION", recordCodes: ["KW-001", "KW-002"] }]);
  assert.deepEqual(result, { deleted: 2 });
});

test("deleteRecords rejects empty selection", async () => {
  assert.equal(typeof recordService.deleteRecords, "function");

  await assert.rejects(
    () => recordService.deleteRecords("LOCATION", { codes: [] }, { removeMany: async () => 0 }),
    /请选择要删除的业务数据/,
  );
});
