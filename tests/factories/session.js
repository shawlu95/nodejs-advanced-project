const Keygrip = require('keygrip');
const Buffer = require('safe-buffer').Buffer;

// process.env.NODE_ENV=='test'
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

// design: make it chainable! accepts mongoose doc
module.exports = (user) => {
  // emulate serialize user as in passport.js
  const sessionObject = {
    passport: {
      // user._id is an Object that contains a string ID, needs extraction
      user: user._id.toString(),
    },
  };

  const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');
  const sig = keygrip.sign('session=' + session);
  return { sig, session };
};
