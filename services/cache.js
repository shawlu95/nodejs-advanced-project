const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);

// get a ref of the existing exec function and overwrite it
const exec = mongoose.Query.prototype.exec;

// declare a new method to all query instances, simply appends a bool flag
mongoose.Query.prototype.cache = async function (options = {}) {
  this._cache = true;

  // key must be a number or string
  // use empty string instead of undefined when no key is passed
  this._hashKey = JSON.stringify(options.key || '');

  return this; // builder pattern, makes it chainable
};

// don't use arrow func so `this` is preserved, referencing the Query
mongoose.Query.prototype.exec = async function () {
  if (!this._cache) {
    return await exec.apply(this, arguments);
  }

  console.log('\n----------custom logic in exec----------');

  // query is a ref, do not directly modify it
  const query = this.getQuery();
  console.log('query:', query);

  const collection = this.mongooseCollection.name;
  console.log('collection:', collection);

  // copy all properties of objects into an empty new object
  const key = JSON.stringify(Object.assign({}, query, { collection }));
  console.log('unique and consistent key:', key);

  // return cached value if exists
  const cached = await client.hget(this._hashKey, key);
  if (cached) {
    const doc = JSON.parse(cached);
    console.log('retrieved from cache:', doc);

    if (Array.isArray(doc)) {
      // looking up a list of objects (e.g. blogs)
      return doc.map((x) => new this.model(x));
    } else {
      // looking up a single object (e.g. user)
      return new this.model(doc);
    }
  }

  // issue query and store result
  // arguments refer to any arguments passed into the function
  const res = await exec.apply(this, arguments);

  // res is a mongoose document that looks like a JSON
  // expire cache in 100 seconds, apply to future docs (not retroactive)
  client.hset(this._hashKey, key, JSON.stringify(res), 'EX', 100);

  console.log('retrieved from mongo:', res);
  // exec returns a promise<mongoose document)
  return res;
};

module.exports = {
  invalidateCache(hashKey) {
    console.log('invalidated cache:', hashKey);
    client.del(JSON.stringify(hashKey));
  },
};
