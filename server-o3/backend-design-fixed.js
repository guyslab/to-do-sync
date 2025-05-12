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
// Configuration object
var config = {
    edition: {
        expirationMinutes: 3
    }
};
// Implementations
var DefaultTask = /** @class */ (function () {
    function DefaultTask(_data, _dataTx, _idGenerator, isNew) {
        this._data = _data;
        this._dataTx = _dataTx;
        this._idGenerator = _idGenerator;
        this._state = this.createInitialState();
        this._expirationMinutes = config.edition.expirationMinutes;
        if (isNew)
            this._dataTx.register('task', this._data.id, this._data);
    }
    DefaultTask.prototype.complete = function () { this._state.complete(); };
    DefaultTask.prototype.incomplete = function () { this._state.incomplete(); };
    DefaultTask.prototype.setTitle = function (title, lockKey) { this._state.setTitle(title, lockKey); };
    DefaultTask.prototype.delete = function () { this._state.delete(); };
    DefaultTask.prototype.lockTitle = function () { return this._state.lockTitle(); };
    DefaultTask.prototype.toDto = function () {
        return {
            id: this._data.id,
            title: this._data.title,
            complete: this._data.complete,
            createdAt: this._data.createdAt
        };
    };
    // task context
    DefaultTask.prototype.markComplete = function (complete) {
        this._data.complete = complete;
        this._dataTx.register('task', this._data.id, this._data);
    };
    DefaultTask.prototype.setTitleData = function (title) {
        this._data.title = title;
        this._dataTx.register('task', this._data.id, this._data);
    };
    DefaultTask.prototype.markDeleted = function () {
        this._data.deleted = true;
        this._dataTx.register('task', this._data.id, this._data);
    };
    DefaultTask.prototype.setKey = function () {
        var newKey = this.createNewKey();
        this._data.lockKey = newKey.key;
        this._data.lockExpiresAt = newKey.expiresAt;
        this._dataTx.register('task', this._data.id, this._data);
        this._state = this.createInitialState();
        return newKey;
    };
    DefaultTask.prototype.tryDisposeKey = function (key) {
        if (this._data.lockKey != key)
            return false;
        this.clearLockKey();
        return true;
    };
    DefaultTask.prototype.isReleased = function () {
        return !this._data.lockKey || this._data.lockExpiresAt < new Date();
    };
    DefaultTask.prototype.clearLockKey = function () {
        this._data.lockKey = undefined;
        this._data.lockExpiresAt = undefined;
        this._dataTx.register('task', this._data.id, this._data);
        this._state = this.createInitialState();
    };
    DefaultTask.prototype.createInitialState = function () {
        if (this.isReleased())
            return new NotEditingTaskState(this);
        return new EditingTitleTaskState(this);
    };
    DefaultTask.prototype.createNewKey = function () {
        return {
            key: this._idGenerator.create(),
            expiresAt: new Date(Date.now() + this._expirationMinutes * 60 * 1000)
        };
    };
    return DefaultTask;
}());
var EditingTitleTaskState = /** @class */ (function () {
    function EditingTitleTaskState(_ctx) {
        this._ctx = _ctx;
    }
    EditingTitleTaskState.prototype.complete = function () { throw new Error("locked"); };
    EditingTitleTaskState.prototype.incomplete = function () { throw new Error("locked"); };
    EditingTitleTaskState.prototype.setTitle = function (title, lockKey) {
        if (this._ctx.tryDisposeKey(lockKey))
            this._ctx.setTitleData(title);
        else
            throw new Error("locked");
    };
    EditingTitleTaskState.prototype.delete = function () { throw new Error("locked"); };
    EditingTitleTaskState.prototype.lockTitle = function () { throw new Error("locked"); };
    EditingTitleTaskState.prototype.toDto = function () { throw new Error("Method not implemented."); };
    return EditingTitleTaskState;
}());
var NotEditingTaskState = /** @class */ (function () {
    function NotEditingTaskState(_ctx) {
        this._ctx = _ctx;
    }
    NotEditingTaskState.prototype.complete = function () { this._ctx.markComplete(true); };
    NotEditingTaskState.prototype.incomplete = function () { this._ctx.markComplete(false); };
    NotEditingTaskState.prototype.setTitle = function (title, lockKey) { throw new Error("unlocked"); };
    NotEditingTaskState.prototype.delete = function () { this._ctx.markDeleted(); };
    NotEditingTaskState.prototype.lockTitle = function () {
        var ctx = this._ctx;
        if (ctx.isReleased && !ctx.isReleased())
            throw new Error('locked');
        return this._ctx.setKey();
    };
    NotEditingTaskState.prototype.toDto = function () { throw new Error("Method not implemented."); };
    return NotEditingTaskState;
}());
var DefaultTaskService = /** @class */ (function () {
    function DefaultTaskService(_taskRepository, _taskFactory, _unitOfWork, _outbox) {
        this._taskRepository = _taskRepository;
        this._taskFactory = _taskFactory;
        this._unitOfWork = _unitOfWork;
        this._outbox = _outbox;
    }
    DefaultTaskService.prototype.getAll = function (includeComplete) {
        return __awaiter(this, void 0, void 0, function () {
            var tasks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._taskRepository.getAll(includeComplete)];
                    case 1:
                        tasks = _a.sent();
                        return [2 /*return*/, tasks.map(function (task) { return task.toDto(); })];
                }
            });
        });
    };
    DefaultTaskService.prototype.complete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._taskRepository.getById(id)];
                    case 1:
                        task = _a.sent();
                        if (!task)
                            throw new Error("notFound");
                        task.complete();
                        this._outbox.register('task_complete', { taskId: id });
                        return [4 /*yield*/, this._unitOfWork.commit()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DefaultTaskService.prototype.incomplete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._taskRepository.getById(id)];
                    case 1:
                        task = _a.sent();
                        if (!task)
                            throw new Error("notFound");
                        task.incomplete();
                        this._outbox.register('task_incomplete', { taskId: id });
                        return [4 /*yield*/, this._unitOfWork.commit()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DefaultTaskService.prototype.beginEdition = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var task, key;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._taskRepository.getById(id)];
                    case 1:
                        task = _a.sent();
                        if (!task)
                            throw new Error("notFound");
                        key = task.lockTitle();
                        return [4 /*yield*/, this._unitOfWork.commit()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, {
                                key: key.key,
                                expiresAt: key.expiresAt
                            }];
                }
            });
        });
    };
    DefaultTaskService.prototype.endEdition = function (id, title, lockKey) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._taskRepository.getById(id)];
                    case 1:
                        task = _a.sent();
                        if (!task)
                            throw new Error("notFound");
                        task.setTitle(title, lockKey);
                        this._outbox.register('task_renamed', { taskId: id, title: title });
                        return [4 /*yield*/, this._unitOfWork.commit()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DefaultTaskService.prototype.delete = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var task;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._taskRepository.getById(id)];
                    case 1:
                        task = _a.sent();
                        if (!task)
                            throw new Error("notFound");
                        task.delete();
                        this._outbox.register('task_deleted', { taskId: id });
                        return [4 /*yield*/, this._unitOfWork.commit()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    DefaultTaskService.prototype.create = function (title) {
        return __awaiter(this, void 0, void 0, function () {
            var task, id;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        task = this._taskFactory.createByTitle(title);
                        id = task.toDto().id;
                        this._outbox.register('task_created', { taskId: id, title: title });
                        return [4 /*yield*/, this._unitOfWork.commit()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, id];
                }
            });
        });
    };
    return DefaultTaskService;
}());
var DefaultTaskRepository = /** @class */ (function () {
    function DefaultTaskRepository(_dataQuerier, _taskFactory) {
        this._dataQuerier = _dataQuerier;
        this._taskFactory = _taskFactory;
        this._collection = "task";
    }
    DefaultTaskRepository.prototype.getAll = function (includeComplete) {
        return __awaiter(this, void 0, void 0, function () {
            var taskDataList;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._dataQuerier.queryByLiteral(this._collection, { deleted: false, complete: includeComplete })];
                    case 1:
                        taskDataList = _a.sent();
                        return [2 /*return*/, taskDataList.map(function (data) { return _this._taskFactory.createByData(data); })];
                }
            });
        });
    };
    DefaultTaskRepository.prototype.getById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var taskDataList, taskData;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._dataQuerier.queryByLiteral(this._collection, { deleted: false, id: id })];
                    case 1:
                        taskDataList = _a.sent();
                        if (!taskDataList.length)
                            return [2 /*return*/, null];
                        taskData = taskDataList[0];
                        if (!taskData)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this._taskFactory.createByData(taskData)];
                }
            });
        });
    };
    return DefaultTaskRepository;
}());
var DefaultTaskFactory = /** @class */ (function () {
    function DefaultTaskFactory(_tx, _idGenerator) {
        this._tx = _tx;
        this._idGenerator = _idGenerator;
    }
    DefaultTaskFactory.prototype.createByData = function (data) {
        return new DefaultTask(data, this._tx, this._idGenerator, false);
    };
    DefaultTaskFactory.prototype.createByTitle = function (title) {
        var data = {
            id: this._idGenerator.create(),
            title: title,
            complete: false,
            deleted: false,
            createdAt: new Date()
        };
        return new DefaultTask(data, this._tx, this._idGenerator, true);
    };
    return DefaultTaskFactory;
}());
var DefaultUnitOfWork = /** @class */ (function () {
    function DefaultUnitOfWork(_tx, _outbox) {
        this._tx = _tx;
        this._outbox = _outbox;
    }
    DefaultUnitOfWork.prototype.commit = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._tx.commit()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this._outbox.commit()];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DefaultUnitOfWork;
}());
var DefaultDataTransaction = /** @class */ (function () {
    function DefaultDataTransaction(_dataModifier) {
        this._dataModifier = _dataModifier;
        this._changes = new Map();
    }
    DefaultDataTransaction.prototype.register = function (typeName, id, data) {
        if (!this._changes.has(typeName)) {
            this._changes.set(typeName, new Map());
        }
        this._changes.get(typeName).set(id, data);
    };
    DefaultDataTransaction.prototype.commit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, typeName, entities, _c, _d, _e, id, data;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _i = 0, _a = this._changes.entries();
                        _f.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], typeName = _b[0], entities = _b[1];
                        _c = 0, _d = entities.entries();
                        _f.label = 2;
                    case 2:
                        if (!(_c < _d.length)) return [3 /*break*/, 5];
                        _e = _d[_c], id = _e[0], data = _e[1];
                        return [4 /*yield*/, this._dataModifier.upsert(typeName, id, data)];
                    case 3:
                        _f.sent();
                        _f.label = 4;
                    case 4:
                        _c++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        this._changes.clear();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DefaultDataTransaction;
}());
var DefaultDataCollectionModifier = /** @class */ (function () {
    function DefaultDataCollectionModifier(_db) {
        this._db = _db;
    }
    DefaultDataCollectionModifier.prototype.upsert = function (collection, id, data) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._db.collection(collection).updateOne({ id: id }, { $set: data }, { upsert: true })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DefaultDataCollectionModifier;
}());
var DefaultDataCollectionQuerier = /** @class */ (function () {
    function DefaultDataCollectionQuerier(_db) {
        this._db = _db;
    }
    DefaultDataCollectionQuerier.prototype.queryByLiteral = function (collection, literal) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._db.collection(collection).find(literal).toArray()];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    return DefaultDataCollectionQuerier;
}());
var DefaultMessagesOutbox = /** @class */ (function () {
    function DefaultMessagesOutbox(_publisher) {
        this._publisher = _publisher;
        this._messages = new Map();
    }
    DefaultMessagesOutbox.prototype.register = function (msgType, msgPayload) {
        if (!this._messages.has(msgType)) {
            this._messages.set(msgType, []);
        }
        this._messages.get(msgType).push(msgPayload);
    };
    DefaultMessagesOutbox.prototype.commit = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, _b, msgType, payloads, _c, payloads_1, payload;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _i = 0, _a = this._messages.entries();
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        _b = _a[_i], msgType = _b[0], payloads = _b[1];
                        _c = 0, payloads_1 = payloads;
                        _d.label = 2;
                    case 2:
                        if (!(_c < payloads_1.length)) return [3 /*break*/, 5];
                        payload = payloads_1[_c];
                        return [4 /*yield*/, this._publisher.publish(msgType, payload)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        _c++;
                        return [3 /*break*/, 2];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        this._messages.clear();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DefaultMessagesOutbox;
}());
var DefaultMessagesPublisher = /** @class */ (function () {
    function DefaultMessagesPublisher(_wsServer) {
        this._wsServer = _wsServer;
    }
    DefaultMessagesPublisher.prototype.publish = function (msgType, msgPayload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._wsServer.emit(msgType, msgPayload)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DefaultMessagesPublisher;
}());
// Simple UUID generator implementation
var UuidGenerator = /** @class */ (function () {
    function UuidGenerator() {
    }
    UuidGenerator.prototype.create = function () {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0;
            var v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    };
    return UuidGenerator;
}());
// Example Express/Fastify integration (optional)
/*
const express = require('express');
const app = express();
app.use(express.json());

app.get('/tasks', async (req, res) => {
  const includeComplete = req.query.includeComplete === 'true';
  const tasks = await taskService.getAll(includeComplete);
  res.json({ tasks, total: tasks.length });
});

app.put('/tasks/:taskId/completion', async (req, res) => {
  const { taskId } = req.params;
  const { complete } = req.body as { complete: boolean };
  if (complete) await taskService.complete(taskId);
  else await taskService.incomplete(taskId);
  res.sendStatus(200);
});

app.post('/tasks/:taskId/editions', async (req, res) => {
  try {
    const { taskId } = req.params;
    const key = await taskService.beginEdition(taskId);
    res.status(201)
       .location(`/tasks/${taskId}/editions/${key.key}`)
       .json({ editionId: key.key, expires: key.expiresAt });
  } catch (err) {
    if (err.message === 'locked') return res.sendStatus(409);
    throw err;
  }
});

app.put('/tasks/:taskId/editions/:editionId', async (req, res) => {
  try {
    const { taskId, editionId } = req.params;
    const { title } = req.body as { title: string };
    await taskService.endEdition(taskId, title, editionId);
    res.sendStatus(200);
  } catch (err) {
    if (err.message === 'locked') return res.sendStatus(409);
    throw err;
  }
});

app.delete('/tasks/:taskId', async (req, res) => {
  await taskService.delete(req.params.taskId);
  res.sendStatus(204);
});
*/
// Integration test for the locking workflow
/*
// Quick test of the locking workflow
async function testLockingWorkflow() {
  console.log("Testing task locking workflow...");
  
  // Setup dependencies
  const idGenerator = new UuidGenerator();
  const db = {}; // Mock DB
  const dataModifier = new DefaultDataCollectionModifier(db);
  const dataQuerier = new DefaultDataCollectionQuerier(db);
  const dataTx = new DefaultDataTransaction(dataModifier);
  const wsServer = { emit: async () => {} }; // Mock WebSocket server
  const publisher = new DefaultMessagesPublisher(wsServer);
  const outbox = new DefaultMessagesOutbox(publisher);
  const unitOfWork = new DefaultUnitOfWork(dataTx, outbox);
  const taskFactory = new DefaultTaskFactory(dataTx, idGenerator);
  const taskRepository = new DefaultTaskRepository(dataQuerier, taskFactory);
  const taskService = new DefaultTaskService(taskRepository, taskFactory, unitOfWork, outbox);
  
  // Create a new task
  const id = await taskService.create('Write docs');
  console.log(`Created task with ID: ${id}`);
  
  // Begin edition and get the key
  const { key } = await taskService.beginEdition(id);
  console.log(`Began edition with key: ${key}`);
  
  // End edition with the correct key
  await taskService.endEdition(id, 'Write much better docs', key);
  console.log("Successfully ended edition with correct key");
  
  // Begin edition again (should work since lock was released)
  const edition2 = await taskService.beginEdition(id);
  console.log(`Began second edition with key: ${edition2.key}`);
  
  // Try to end edition with wrong key
  const wrongKey = '123';
  try {
    await taskService.endEdition(id, 'oops', wrongKey);
  } catch (e) {
    console.log(`Expected error with wrong key: ${e.message}`); // "locked"
  }
  
  // End edition with correct key
  await taskService.endEdition(id, 'Final version of docs', edition2.key);
  console.log("Successfully ended second edition with correct key");
  
  console.log("Locking workflow test completed successfully");
}

// Run the test
// testLockingWorkflow().catch(console.error);
*/
