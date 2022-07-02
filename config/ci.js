module.exports = {
  googleClientID: process.env.GOOGLE_CLIENT_ID_CI,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET_CI,
  mongoURI: 'mongodb://127.0.0.1:27017/blog_ci',
  redisUrl: 'redis://127.0.0.1:6379',
  cookieKey: '123123123',
};
