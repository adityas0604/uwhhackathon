const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { runDocumentProcessing } = require("../controllers/poController.js");
const logger = require("../logger.js");

// ✅ Proper Redis config for BullMQ
const connection = new IORedis({
  host: '127.0.0.1',
  port: 6379,
  maxRetriesPerRequest: null // REQUIRED by BullMQ
});

const worker = new Worker('document-processing', async job => {
  const { backendFilename } = job.data;
  logger.info(`📄 Starting job for: ${backendFilename}`);
  console.log(`📄 Starting job for: ${backendFilename}`);
  await runDocumentProcessing(backendFilename);
}, { connection });

// Optional: Job lifecycle logs
worker.on('completed', job => {
  logger.info(`✅ Job for ${job.data.backendFilename} completed.`);
  console.log(`✅ Job for ${job.data.backendFilename} completed.`);
});

worker.on('failed', (job, err) => {
  logger.error(`❌ Job failed for ${job.data.backendFilename}:`, err.message);
  console.error(`❌ Job failed for ${job.data.backendFilename}:`, err.message);
});
