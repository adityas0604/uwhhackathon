const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis();

const processingQueue = new Queue('document-processing', {
  connection
});

module.exports = processingQueue;