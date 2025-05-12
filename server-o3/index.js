"use strict";
// This is a simple test file to demonstrate the integration test
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var setup_1 = require("./setup");
// Integration test for the locking workflow
function testLockingWorkflow() {
    return __awaiter(this, void 0, void 0, function () {
        var taskService, id, key, edition2, wrongKey, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Testing task locking workflow...");
                    taskService = (0, setup_1.setupTaskService)();
                    return [4 /*yield*/, taskService.create('Write docs')];
                case 1:
                    id = _a.sent();
                    console.log("Created task with ID: ".concat(id));
                    return [4 /*yield*/, taskService.beginEdition(id)];
                case 2:
                    key = (_a.sent()).key;
                    console.log("Began edition with key: ".concat(key));
                    // End edition with the correct key
                    return [4 /*yield*/, taskService.endEdition(id, 'Write much better docs', key)];
                case 3:
                    // End edition with the correct key
                    _a.sent();
                    console.log("Successfully ended edition with correct key");
                    return [4 /*yield*/, taskService.beginEdition(id)];
                case 4:
                    edition2 = _a.sent();
                    console.log("Began second edition with key: ".concat(edition2.key));
                    wrongKey = '123';
                    _a.label = 5;
                case 5:
                    _a.trys.push([5, 7, , 8]);
                    return [4 /*yield*/, taskService.endEdition(id, 'oops', wrongKey)];
                case 6:
                    _a.sent();
                    return [3 /*break*/, 8];
                case 7:
                    e_1 = _a.sent();
                    console.log("Expected error with wrong key: ".concat(e_1.message)); // "locked"
                    return [3 /*break*/, 8];
                case 8: 
                // End edition with correct key
                return [4 /*yield*/, taskService.endEdition(id, 'Final version of docs', edition2.key)];
                case 9:
                    // End edition with correct key
                    _a.sent();
                    console.log("Successfully ended second edition with correct key");
                    console.log("Locking workflow test completed successfully");
                    return [2 /*return*/];
            }
        });
    });
}
// Run the test
testLockingWorkflow().catch(console.error);
