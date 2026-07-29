const express = require('express');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const SECRET = process.env.WEBHOOK_SECRET || 'your_secret';

function verifySignature(req, res, buf) {
  const signature = req.get('X-Hub-Signature-256') || '';
  if (!signature.startsWith('sha256=')) {
    throw new Error('No X-Hub-Signature-256 header');
  }
  const expected = signature.slice(7);
  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = hmac.update(buf).digest('hex');
  if (!crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(expected))) {
    throw new Error('Invalid signature');
  }
}

const app = express();
app.use(express.json({ verify: verifySignature }));

app.post('/webhook', (req, res) => {
  // Event type and delivery-id
  const event = req.get('X-GitHub-Event');
  const delivery = req.get('X-GitHub-Delivery');

  console.log(`[${new Date().toISOString()}] Event: ${event}, Delivery: ${delivery}`);
  console.log('Payload:', JSON.stringify(req.body, null, 2));

  // TODO: handle events you care about
  res.status(200).send('ok');
});

app.use((err, req, res, next) => {
  console.error('Webhook error:', err && err.message);
  res.status(400).send('Invalid signature');
});

app.listen(PORT, () => {
  console.log(`Webhook receiver listening on port ${PORT}`);
});
