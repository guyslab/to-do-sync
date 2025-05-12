Below is a “first aid kit” for your current code base.  
I only touch the places that (1) do not compile, (2) violate the intent expressed in your OpenAPI / AsyncAPI specs or (3) break the flow of the domain-model-to-infrastructure layers.  
Everything else I leave exactly as you wrote it so you can diff the changes quickly.

──────────────────────── 1.  Type-level mistakes
1.1  Misspelled constructor  
class EditingTitleTaskState / NotEditingTaskState
```ts
// BEFORE
constrctor( private _ctx: TaskContext) { }
// AFTER
constructor(private _ctx: TaskContext) {}
```

1.2  Wrong method names in repository  
```ts
// BEFORE
const taskDataList = await _dataQuerier.getByLiteral( … )
// AFTER
const taskDataList = await this._dataQuerier.queryByLiteral( … )
```

1.3  MessagesOutbox uses a map called _messages but the code refers to _changes  
```ts
class DefaultMessagesOutbox implements MessagesOutbox {
  private _messages: Map<string, any[]> = new Map();
  constructor(private _publisher: MessagesPublisher) {}

  register<TMsg>(msgType: string, msgPayload: TMsg): void {
    if (!this._messages.has(msgType)) {
      this._messages.set(msgType, []);
    }
    this._messages.get(msgType)!.push(msgPayload);
  }

  async commit(): Promise<void> {
    for (const [msgType, payloads] of this._messages.entries()) {
      for (const payload of payloads) await this._publisher.publish(msgType, payload);
    }
    this._messages.clear();
  }
}
```

1.4  DataTransaction.commit clears inside the outer loop → clears only first collection  
Move `this._changes.clear()` outside both loops.
```ts
async commit(): Promise<void> {
  for (const [typeName, entities] of this._changes.entries()) {
    for (const [id, data] of entities.entries()) {
      await this._dataModifier.upsert(typeName, id, data);
    }
  }
  this._changes.clear();
}
```

1.5  DataCollectionModifier.upsert takes `collection` string but DataTransaction.register passes the “type name” which is also used as a collection name elsewhere, so keep it consistent.

1.6  createNewKey() is referenced but missing  
```ts
private createNewKey(): TaskKey {
  return {
    key: this._idGenerator.create(),      // reuse the same IdGenerator dependency
    expiresAt: new Date(Date.now() + this._expirationMinutes * 60 * 1000)
  };
}
```

1.7  isReleased() comparison is reversed  
If the expiration date is in the future the lock is still **active**.
```ts
private isReleased(): boolean {
  return !this._data.lockKey || this._data.lockExpiresAt! < new Date();
}
```

──────────────────────── 2.  Behavioural / business-rule gaps
2.1  Attempting to lock an already-locked task should raise the same
exception that OpenAPI maps to HTTP 409.
Add guard in NotEditingTaskState.lockTitle().
```ts
lockTitle(): TaskKey {
  if (!this._ctx['isReleased']?.()) throw new Error('locked');
  return this._ctx.setKey();
}
```

2.2  DefaultTask.createInitialState() must switch itself when a lock is created/removed.  
You already have two concrete states; call createInitialState() again whenever the lock situation changes.
Simplest fix – inside setKey() and clearLockKey():
```ts
this._state = this.createInitialState();
```

──────────────────────── 3.  Unit-of-work composition order
Persist the data first, then publish messages, finally return to caller.
Your DefaultUnitOfWork already does that correctly, just make sure every service method ends with:
```ts
await this._unitOfWork.commit();
```
(which you already do).

──────────────────────── 4.  Glue code for Express / Fastify (optional)
If you want to expose the OpenAPI endpoints quickly, wire them like:

```ts
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
```

──────────────────────── 5.  Quick test of the locking workflow
```ts
const id = await taskService.create('Write docs');
const { key } = await taskService.beginEdition(id);   // returns edition key
await taskService.endEdition(id, 'Write much better docs', key); // ok
await taskService.beginEdition(id); // ok again because lock was released

// Wrong key
const wrongKey = '123';
try { await taskService.endEdition(id, 'oops', wrongKey); }
catch (e) { console.log(e.message); } // "locked"
```

──────────────────────── 6.  Things you may want to tackle next
• The Task aggregate currently exposes its data object to the outside world via toDto() but the method itself is still missing.  
• Consider putting the IdGenerator behind an interface so createNewKey() can use it without direct coupling.  
• Persist `deleted: true` tasks in a separate collection if you expect many deletes.

That should compile, satisfy the OpenAPI / AsyncAPI contract and correctly generate your WebSocket events. Good luck!
