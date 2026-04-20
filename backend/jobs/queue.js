import { connect } from 'net';
import pkg from 'bullmq';
const { Queue, Worker } = pkg;
import logger from '../utils/logger.js';
import { queueEmail } from '../controllers/emailController.js';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

let mainQueue, mainWorker;
let isInitialized = false;

const checkRedis = () => {
  return new Promise((resolve) => {
    const socket = connect(connection.port, connection.host, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
  });
};

export const initQueue = async () => {
  if (isInitialized || mainQueue) return;
  
  const redisAvailable = await checkRedis();
  if (!redisAvailable) {
    logger.warn('Redis not available. Queue disabled.');
    return;
  }
  
  try {
    mainQueue = new Queue('mainQueue', { connection });
    mainWorker = new Worker(
      'mainQueue',
      async (job) => {
        logger.info(`Processing job ${job.id} of type ${job.name}`);
        const handlers = {
          sendEmail: async (job) => {
            logger.info(`Sending email to ${job.data.to}`);
            await queueEmail(job.data);
            logger.info(`Email sent to ${job.data.to}`);
            return { status: 'sent' };
          },
          generateReport: async (job) => {
            logger.info(`Generating report for user ${job.data.userId}`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            logger.info(`Report generated for user ${job.data.userId}`);
            return { status: 'generated' };
          },
          cleanupOldData: async (job) => {
            logger.info('Cleaning up old data');
            await new Promise((resolve) => setTimeout(resolve, 700));
            logger.info('Old data cleanup complete');
            return { status: 'cleaned' };
          }
        };
        if (handlers[job.name]) {
          return await handlers[job.name](job);
        } else {
          logger.warn(`No handler for job type: ${job.name}`);
          return { status: 'unknown job type' };
        }
      },
      { connection }
    );

    mainWorker.on('completed', (job) => {
      logger.info(`Job ${job.id} (${job.name}) completed`);
    });
    mainWorker.on('failed', (job, err) => {
      logger.error(`Job ${job.id} (${job.name}) failed`, { error: err.message });
    });

    isInitialized = true;
    logger.info('Queue initialized successfully');
  } catch (err) {
    logger.error('Failed to initialize queue:', err.message);
  }
};

export const addJob = async (jobName, data) => {
  if (!mainQueue) {
    logger.warn('Queue not initialized');
    return null;
  }
  return await mainQueue.add(jobName, data);
};

export { mainQueue, mainWorker };