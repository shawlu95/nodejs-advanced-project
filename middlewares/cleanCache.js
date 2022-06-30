const { invalidateCache } = require('../services/cache');

/**
 * Usually middleware is run before route handler, but in this case
 * we don't want to clear cache unless the request handler
 * is successfully run
 */
module.exports = async (req, res, next) => {
  // wait for next handler to complete (in this case, the route handler)
  // a bit hacky, this must be the last middleware before route!
  await next();

  invalidateCache(req.user.id);
};
