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
- key should be consistent and unique, user A get his blogs, user B doesn't get A's blogs
  - `{ _user: req.user.id }` is unique for each user
  - the mongo query is issued to blog collection, which should be part of key
  - this tutorial only has one collection, so can omit collection

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
