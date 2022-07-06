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

---

### Redis Cache

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

---

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

---

### Deeper into Mongo

Three ways to trigger a mongo query

1. async-await (simplest): `const result = await query`
2. trigger promise: `query.then(result => {})`
3. define query, then do `query.exec((err, result) => {})`: _we can override the exec to embed the cache logic_

---

### Prototypal Inheritance of Javascript

- a function is declared `function Query()` and instantiated `new Query()`
- add method to prototype `Query.prototype.exec = function ( ... ) { ... }`, then instance can do `query.exec`

---

### Unit & Integration Tests

- this project prefers integration tests involving multiple units
- use jest and [puppeteer](https://github.com/puppeteer/puppeteer) for testing
  - puppeteer starts up chromium, returns a browser with pages (tabs)
  - headless mode doesn't spin up browser UI so it's faster
  - jest will find all test files ending in `.test.js`
- general workflow of testing UI
  1. launch chromium
  2. navigate to app
  3. click on elements on page
  4. use DOM selector to retrieve element
  5. assert
- **describe** statement groups logically similar tests
  - it can contain child-level describe group
  - it can have its own beforeEach and afterEach

```bash
brew install chromium
```

---

### Cookie Testing

Automated tests would continuous hit Google OAuth and trigger captcha. How to resolve:

1. make a secret routes to automatically login, not the best way to go (don't change code base to suit test)
2. don't require auth when running test (don't change code base to suit test)
3. **preferred**: fake a session to store in `req`
4. create a service account with google for testing (not a generic OAuth solution)

OAuth workflow

1. user calls google oauth `/auth/google`
2. google respond with login success and call `/auth/google/callback?code=...` with a auth code (first round trip)
3. app asks for more info about user (with auth code), google respond with user profile (second round trip)
4. app sets cookie and sends to browser, to be included in future requests (auto-tests trick this step!)

Sample cookie after login

- middleware 1: cookie-session lib uses `session.sig` ensures `session` is not tampered, and decodes session into json object and assigns to `req.session`
- middleware 2: the `req.session` is forwarded to passport `deserializeUser`, which either pulls the user `req.session.passport.user` and set it to `req.user`
- request is authenticated, and forwarded to next middleware/route handler
- a **cookie key** is used to sign cookie session to generate cookie.sig so it can't be forged or doctored, this value is set in `.env` and never shared.

```
Cookie: connect.sid=s%3Al7EJu5QOyl6sqCfgpuov13crqx6jEEQE.8nJ8fCKc%2Bwt2YKPC6IMKt1fub%2FSev3mPNoTotkSo2kA; session=eyJwYXNzcG9ydCI6eyJ1c2VyIjoiNjJiYmU0NDljNTg4OWZkODdjZGE5YjJmIn19; session.sig=pvrwZNR9n6f5x-rhEcDkpQgpxME
```

Decode the base64 cookie

```javascript
> const session='eyJwYXNzcG9ydCI6eyJ1c2VyIjoiNjJiYmU0NDljNTg4OWZkODdjZGE5YjJmIn19'
undefined
> const Buffer = require('safe-buffer').Buffer;
undefined
> Buffer.from(session, 'base64').toString('utf8')
'{"passport":{"user":"62bbe449c5889fd87cda9b2f"}}'
```

---

### Cookie Security

- this value is set in `.env` and never shared.
- a **cookie key** is used to sign cookie session to generate `cookie.sig`.
- the key is used to verify cookie session: decoded session + session sig + **cookie key** => `true`.

```javascript
const Keygrip = require('keygrip');
const keygrip = new Keygrip(['123123123']);
const session =
  'eyJwYXNzcG9ydCI6eyJ1c2VyIjoiNjJiYmU0NDljNTg4OWZkODdjZGE5YjJmIn19';
const sig = keygrip.sign('session=' + session);

// returns true if session hasn't been tampered with
keygrip.verify('session=' + session, sig);
```

---

### Proxy

- a method of combining multiple objects into one, without inheritance
- objects can be completely heterogenous (don't even have to be similar)
- we use Proxy to cleanup the interface to interact with Puppeteer page, custom page, and browser object.
- there's priority queue, so the order of `||` chain matters (e.g. `close` exists on page and browser objects)

---

### Continuous Integration

- CI server runs automatic tests on codebase to ensure the changes haven't broken anything
- if all tests pass, CI server marks pull requests green (send notification if needed)
- variety of tests possible: mocha, lint, unit, integration, UI tests
- CI server provider: [Travis](https://docs.travis-ci.com/) (in this project), Circle, Codeship, AWS Codebuild (assume AWS codebase)
  1. push code to github
  2. Travis detects code push, clones project
  3. Travis runs tests specified in a `.travis.yml` file
  4. sent email notification if all tests pass
- **trusty** is a linux variant often used for running code on VM
- dev mode starts up two server: 3000 for react, 5000 for nodejs
- prod/CI mode doesn't use the 3000 react server, react app is 'built' see [package.json](./package.json)
  - `npm run build` comes with the `create-react-app`, takes everything from `src` and output executable into `build` folder

---

### AWS Simple Storage Service

- Cost is $0.023 per GB per month
- Uploading file from server costs bandwidth. Get a file-specific URL from S3 and uses AWS CPU to accept upload from browser
  - the URL only works for specific file name, file type, bucket, and can have TTL
  - S3 bucket name must be unique in region (among all aws users)
- Randomly generate filename to prvent users from uploading duplicate names
- CORS: disallow any front-end from requesting s3 url from our server

### Troubleshooting

Chromium revision is not downloaded. Run "npm install" or "yarn install". Found solution for mac [here](https://rickynguyen.medium.com/puppeteer-for-apple-m1-43a5c31e4f9d)

```bash
# solution 1
node node_modules/puppeteer/install.js

# solution 2: edit ~/.zshrc
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH=`which chromium`

source ~/.zshrc
```
