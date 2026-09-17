import assert from "node:assert/strict";
import { chooseFormat } from "./format-decision.js";

assert.equal(chooseFormat({ animated: false, width: 1200 }), "avif");
assert.equal(chooseFormat({ animated: true, width: 1200 }), "webp");
assert.equal(chooseFormat({ animated: false, width: 3000 }), "webp");
console.log("format decisions pass");
