import AWS from 'aws-sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });

// Configure AWS SDK with provided credentials
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'AKIAWCYX75IYXJ4ITU7G',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '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',
  region: 'us-east-1'
});

// Create SQS service object
const sqs = new AWS.SQS({ apiVersion: '2012-11-05' });

// SQS Queue URL
const QUEUE_URL = process.env.SQS_QUEUE_URL || 'https://sqs.us-east-1.amazonaws.com/418272766513/tempLocalToEc2-1753059239';

/**
 * Publish research request to SQS queue
 * @param {Object} payload - The research request payload
 * @returns {Promise<Object>} SQS response with MessageId
 */
export async function publishToSQS(payload) {
  const messageBody = {
    timestamp: new Date().toISOString(),
    source: 'color-code-research-hub',
    ...payload
  };

  const params = {
    QueueUrl: QUEUE_URL,
    MessageBody: JSON.stringify(messageBody),
    MessageAttributes: {
      'TeamType': {
        DataType: 'String',
        StringValue: payload.teamType || 'unknown'
      },
      'Repository': {
        DataType: 'String',
        StringValue: payload.repository || 'unknown'
      },
      'Source': {
        DataType: 'String',
        StringValue: 'research-hub-ui'
      }
    }
  };

  try {
    const result = await sqs.sendMessage(params).promise();
    console.log(`Successfully published to SQS: MessageId ${result.MessageId}`);
    return {
      success: true,
      messageId: result.MessageId,
      queueUrl: QUEUE_URL
    };
  } catch (error) {
    console.error('Error publishing to SQS:', error);
    throw new Error(`Failed to publish to SQS: ${error.message}`);
  }
}

/**
 * Publish batch of messages to SQS
 * @param {Array} messages - Array of message payloads
 * @returns {Promise<Object>} SQS batch response
 */
export async function publishBatchToSQS(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array');
  }

  // SQS allows max 10 messages per batch
  const chunks = [];
  for (let i = 0; i < messages.length; i += 10) {
    chunks.push(messages.slice(i, i + 10));
  }

  const results = [];
  for (const chunk of chunks) {
    const entries = chunk.map((msg, index) => ({
      Id: `msg-${Date.now()}-${index}`,
      MessageBody: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'color-code-research-hub',
        ...msg
      }),
      MessageAttributes: {
        'TeamType': {
          DataType: 'String',
          StringValue: msg.teamType || 'unknown'
        }
      }
    }));

    const params = {
      QueueUrl: QUEUE_URL,
      Entries: entries
    };

    try {
      const result = await sqs.sendMessageBatch(params).promise();
      results.push(result);
    } catch (error) {
      console.error('Error publishing batch to SQS:', error);
      throw new Error(`Failed to publish batch to SQS: ${error.message}`);
    }
  }

  return {
    success: true,
    results,
    totalMessages: messages.length
  };
}

/**
 * Get queue attributes (for monitoring/debugging)
 * @returns {Promise<Object>} Queue attributes
 */
export async function getQueueInfo() {
  const params = {
    QueueUrl: QUEUE_URL,
    AttributeNames: ['All']
  };

  try {
    const result = await sqs.getQueueAttributes(params).promise();
    return result.Attributes;
  } catch (error) {
    console.error('Error getting queue info:', error);
    throw new Error(`Failed to get queue info: ${error.message}`);
  }
}