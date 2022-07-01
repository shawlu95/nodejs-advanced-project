/**
 * Warning: Jest looks for all test files to exeute. Server code
 * is not executed by default. Must explicitly include index.js
 * which executes the mongoose model files
 */

const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

require('../models/User');
require('dotenv').config();

const mongoose = require('mongoose');
const keys = require('../config/keys');

mongoose.Promise = global.Promise;
mongoose.connect(keys.mongoURI);
