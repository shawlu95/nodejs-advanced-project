## Node Blogging App

- requires login (see [passport.js](./services/passport.js))
- segregate environment CI, CD (see [config](./config/))
- mongo db atlas
- google client id & secret

```bash
npm i

cd client
npm i

cd ..
npm run dev
```

### API Endpoints

- `GET /auth/google`: start OAuth flow to log user in
- `GET /auth/google/callback`: where users get sent to after OAuth flow
- `GET /auth/logout`: logout current user
- `GET /auth/current_user`: get current user
- `GET /api/blogs/:id`: get blog by id
- `GET /api/blogs`: get all blogs of logged-in user
- `POST /api/blogs`: create new blog

### Learning Experience

Adding a cache server between express app and mongodb. When a query is issued for the first time, the results are stored in the cache server (key-value store). If the same query is requested, the cached result is sent back, without touching the mongodb server.

- The cache server only handles read request, not write
- We use `node-redis` library to interact with redis
- Use brew to install redis on Mac
- key should be **consistent** and **unique**, user A get his blogs, user B doesn't get A's blogs
  - `{ _user: req.user.id }` is unique for each user
  - the mongo query is issued to blog collection, which should be part of key
  - use `query.getOptions` to get a unique & consistent JSON repr of the query to use as key
- clean code: refactor redis-related code into the `exec` function
- cache update policy:
- cache eviction policy: simple way is auto timeout with time-to-live
  - example `client.set('color', 'red', 'EX', 5)` with 5 second expiry
- future-proof policy: carefully craft the cache key, include mongo collection into key

```bash
which brew
brew install redis

# auto-start redis when machine starts up
brew services start redis

# confirm it's started
redis-cli ping
```

Manipulate value in redis via `node-redis`.

```javascript
const redis = require('redis');
const client = redis.createClient('redis://127.0.0.1:6379');
client.set('foo', 'bar');
client.get('foo', (err, val) => console.log(val));

// short cut to log (err, val)
client.get('foo', console.log);

const foo = await client.get('foo');

// wipe all data
client.flushall();
```

### Nested Hash

- store a hierarchy pf key-value pair
- first key is **master key** for the entire object
- do not store plain javascript object even if JSON (stringify before storing)

```javascript
client.hset('ca', 'capital', 'sacramento');
client.hget('ca', 'capital', (err, val) => console.log(val));

const data = { capital: 'sacramento' };
client.set('ca', JSON.stringify(data));
client.get('ca', (err, val) => console.log(JSON.parse(val)));
```

### Deeper into Mongo

Three ways to trigger a mongo query

1. async-await (simplest): `const result = await query`
2. trigger promise: `query.then(result => {})`
3. define query, then do `query.exec((err, result) => {})`: _we can override the exec to embed the cache logic_

### Prototypal Inheritance of Javascript

- a function is declared `function Query()` and instantiated `new Query()`
- add method to prototype `Query.prototype.exec = function ( ... ) { ... }`, then instance can do `query.exec`

### Unit & Integration Tests

- this project prefers integration tests involving multiple units
- use jest and puppeteer for testing
  - puppeteer starts up chromium, returns a browser with pages (tabs)
  - headless mode doesn't spin up browser UI so it's faster
  - jest will find all test files ending in `.test.js`
- general workflow of testing UI
  1. launch chromium
  2. navigate to app
  3. click on elements on page
  4. use DOM selector to retrieve element
  5. assert

```bash
brew install chromium
```
