const mongoose = require('mongoose');
const User = mongoose.model('User');

module.exports = async (attrs) => {
  return new User(attrs);
};
