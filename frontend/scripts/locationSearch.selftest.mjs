import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

const source = await readFile(new URL("../src/utils/locationSearch.ts", import.meta.url), "utf8");
const output = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2023,
  },
}).outputText;

const module = { exports: {} };
vm.runInNewContext(output, {
  exports: module.exports,
  module,
  console,
  URLSearchParams,
});

const {
  findNearestBuilding,
  getLocationSuggestionMessage,
  hasMapboxToken,
} = module.exports;

const buildings = [
  { id: 1, branch_name: "Quận 1" },
  { id: 2, branch_name: "Bình Thạnh" },
  { id: 3, branch_name: "Thủ Đức" },
];

assert.equal(hasMapboxToken("pk.test"), true);
assert.equal(hasMapboxToken(""), false);
assert.equal(hasMapboxToken(undefined), false);

assert.equal(
  findNearestBuilding(
    { latitude: 10.7945, longitude: 106.722 },
    buildings
  )?.branch_name,
  "Bình Thạnh"
);

assert.equal(
  findNearestBuilding(
    { latitude: 10.842, longitude: 106.83 },
    buildings
  )?.branch_name,
  "Thủ Đức"
);

assert.equal(
  getLocationSuggestionMessage("Landmark 81"),
  "Không có căn hộ nào ở khu vực Landmark 81, đây là danh sách các căn hộ ở khu vực gần Landmark 81."
);

console.log("locationSearch self-test passed");
