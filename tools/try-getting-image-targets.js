/* global process */

var request = require('request');
var config = require('../config');
var sb = require('standard-bail')();
var fs = require('fs');

if (process.argv.length < 3) {
  console.log('Usage: node tools/try-getting-image-targets <image location>');
  process.exit();
}

const imageLocation = process.argv[2];

const apiURL =
  'https://vision.googleapis.com/v1/images:annotate?key=' +
  config.googleVisionAPIKey;

var imageBuffer = fs.readFileSync(imageLocation);

var requestOpts = {
  url: apiURL,
  method: 'POST',
  json: true,
  body: createPostBody(imageBuffer.toString('base64'))
};
request(requestOpts, sb(logResponse, console.log));

function logResponse(response, body) {
  console.log('body:', JSON.stringify(body, null, 2));
}

function createPostBody(base64encodedImage) {
  return {
    requests: [
      {
        image: {
          content: base64encodedImage
        },
        features: [
          {
            type: 'TEXT_DETECTION',
            maxResults: 5
          }
        ]
      }
    ]
  };
}
