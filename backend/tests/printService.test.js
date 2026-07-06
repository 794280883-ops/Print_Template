import assert from "node:assert/strict";
import test from "node:test";
import * as printService from "../src/services/printService.js";

test("collectPrintedRecordIds returns unique DB ids only", () => {
  assert.deepEqual(
    printService.collectPrintedRecordIds([
      { _dbId: 11, locationCode: "A01" },
      { _dbId: 12, locationCode: "A02" },
      { _dbId: 11, locationCode: "A01" },
      { locationCode: "A03" },
    ]),
    [11, 12],
  );
});

test("incrementPrintedRecords increments each selected record once regardless of copies", async () => {
  const calls = [];
  const result = await printService.incrementPrintedRecords(
    [
      { _dbId: 11, locationCode: "A01" },
      { _dbId: 12, locationCode: "A02" },
    ],
    { copies: 5 },
    {
      incrementPrintCountByIds: async (ids) => {
        calls.push(ids);
        return ids.length;
      },
    },
  );

  assert.equal(result, 2);
  assert.deepEqual(calls, [[11, 12]]);
});
