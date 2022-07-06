const AWS = require('aws-sdk');
const uuid = require('uuid/v1');
const requrieLogin = require('../middlewares/requireLogin');
const keys = require('../config/keys');

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: keys.s3KeyId,
    secretAccessKey: keys.s3Key,
  },
  region: 'us-west-1',
});

module.exports = (app) => {
  app.get('/api/upload', requrieLogin, (req, res) => {
    const key = `${req.user.id}/${uuid()}.jpeg`;
    s3.getSignedUrl(
      'putObject',
      {
        Bucket: 'blog-app-shawlu95',
        ContentType: 'image/*',
        Key: key,
      },
      (err, url) => res.send({ key, url })
    );
  });
};
