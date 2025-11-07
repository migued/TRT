# Webhooks System

The CRM includes a complete webhooks system for integrating with external services, automating workflows, and receiving data from forms.

## Overview

The system supports two types of webhooks:

1. **Incoming Webhooks** - Receive data from external sources (forms, Zapier, Make.com, etc.)
2. **Outgoing Webhooks** - Send CRM events to external services

## Incoming Webhooks

### Creating an Incoming Webhook

1. Navigate to Settings > Webhooks
2. Click "Create Webhook"
3. Select "Incoming" type
4. Choose allowed events (contact, company, opportunity, lead)
5. Copy the generated webhook URL

### Using Incoming Webhooks

Send a POST request to your webhook URL:

```bash
POST https://your-domain.com/api/webhooks/incoming/{webhook_key}
Content-Type: application/json

{
  "event": "contact",
  "data": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "company_name": "Acme Corp",
    "position": "CEO",
    "notes": "Contacted via website form"
  },
  "signature": "optional_hmac_signature"
}
```

### Supported Events

#### contact / lead
Creates or updates a contact in the CRM.

**Required fields:**
- `name` or `email` (at least one)

**Optional fields:**
- `email`, `phone`, `position`
- `company_name`, `company_website`, `company_industry`
- `notes`, `tags`

**Example:**
```json
{
  "event": "contact",
  "data": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1234567890",
    "company_name": "Tech Startup Inc",
    "position": "CTO",
    "notes": "Interested in premium plan"
  }
}
```

#### company
Creates or updates a company.

**Required fields:**
- `name` or `company_name`

**Optional fields:**
- `website`, `industry`, `address`, `tax_id`, `notes`

**Example:**
```json
{
  "event": "company",
  "data": {
    "name": "Acme Corporation",
    "website": "https://acme.com",
    "industry": "Technology",
    "address": "123 Main St, San Francisco, CA"
  }
}
```

#### opportunity
Creates a new sales opportunity.

**Required fields:**
- `contact_id` or `contact_email` (to link the opportunity)
- `title` or `opportunity_name`

**Optional fields:**
- `amount`, `stage`, `probability`, `expected_close_date`, `description`

**Example:**
```json
{
  "event": "opportunity",
  "data": {
    "contact_email": "john@example.com",
    "title": "Enterprise License Deal",
    "amount": 50000,
    "stage": "proposal",
    "probability": 60,
    "expected_close_date": "2025-12-31"
  }
}
```

### Signature Verification

For security, you can verify webhook requests using HMAC signatures:

1. Get your webhook secret from the UI
2. Include signature in request:

```javascript
const crypto = require('crypto')

const payload = JSON.stringify(data)
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex')

// Send with request
{
  "event": "contact",
  "data": { ... },
  "signature": signature
}
```

## Outgoing Webhooks

### Creating an Outgoing Webhook

1. Navigate to Settings > Webhooks
2. Click "Create Webhook"
3. Select "Outgoing" type
4. Enter target URL (where events will be sent)
5. Select which events to subscribe to
6. Save

### Available Events

- `contact.created` - New contact added
- `contact.updated` - Contact information updated
- `company.created` - New company added
- `opportunity.created` - New opportunity created
- `opportunity.won` - Opportunity marked as won
- `opportunity.lost` - Opportunity marked as lost
- `order.created` - New order placed
- `project.created` - New project started
- `quote.created` - New quote generated
- `quote.sent` - Quote sent to customer

### Webhook Payload Format

All outgoing webhooks send a standardized payload:

```json
{
  "event": "contact.created",
  "workspace_id": "uuid",
  "timestamp": "2025-11-07T10:30:00Z",
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    ...
  }
}
```

### Security Headers

Outgoing webhooks include security headers:

- `X-Webhook-Signature` - HMAC SHA256 signature of the payload
- `X-Webhook-Event` - Event name
- `X-Webhook-ID` - Webhook ID

### Verifying Signatures

Verify incoming webhook requests in your server:

```javascript
const crypto = require('crypto')

function verifyWebhook(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex')

  return signature === expectedSignature
}

// Express.js example
app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature']
  const secret = process.env.WEBHOOK_SECRET

  if (!verifyWebhook(req.body, signature, secret)) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  // Process webhook
  console.log('Event:', req.body.event)
  console.log('Data:', req.body.data)

  res.json({ received: true })
})
```

## Webhook Logs

View webhook activity in Settings > Webhooks:

- Recent webhook calls
- Success/failure status
- Response times
- Error messages
- Request/response details

## Integrating Outgoing Webhooks

To trigger outgoing webhooks from your code, use the webhook trigger utilities:

```typescript
import { triggerContactCreated } from '@/lib/webhooks/trigger'

// After creating a contact
await triggerContactCreated(workspaceId, contactData)
```

Available trigger functions:
- `triggerContactCreated(workspaceId, contact)`
- `triggerContactUpdated(workspaceId, contact)`
- `triggerOpportunityCreated(workspaceId, opportunity)`
- `triggerOpportunityWon(workspaceId, opportunity)`
- `triggerOpportunityLost(workspaceId, opportunity)`
- `triggerOrderCreated(workspaceId, order)`
- `triggerProjectCreated(workspaceId, project)`
- `triggerQuoteCreated(workspaceId, quote)`
- `triggerQuoteSent(workspaceId, quote)`

## Use Cases

### Incoming Webhooks

1. **Website Contact Forms** - Automatically create contacts from form submissions
2. **Zapier/Make Integration** - Connect with 1000+ apps
3. **External Lead Sources** - Import leads from advertising platforms
4. **Survey Responses** - Create contacts from survey submissions

### Outgoing Webhooks

1. **Slack Notifications** - Get notified of new deals
2. **Email Marketing** - Sync contacts to Mailchimp/SendGrid
3. **Analytics** - Send events to analytics platforms
4. **Custom Automations** - Trigger custom workflows
5. **Data Sync** - Keep external systems in sync

## Testing Webhooks

### Testing Incoming Webhooks

Use curl or Postman:

```bash
curl -X POST https://your-domain.com/api/webhooks/incoming/whk_abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "event": "contact",
    "data": {
      "name": "Test Contact",
      "email": "test@example.com"
    }
  }'
```

### Testing Outgoing Webhooks

Use webhook testing services:
- https://webhook.site
- https://requestbin.com
- https://beeceptor.com

1. Get a test URL from the service
2. Create an outgoing webhook with that URL
3. Trigger an event in the CRM
4. View the payload in the testing service

## Troubleshooting

### Incoming Webhook Returns 404
- Check that the webhook key is correct
- Verify the webhook is active
- Ensure the URL is exactly as shown in the UI

### Incoming Webhook Returns 401
- Signature verification failed
- Check your secret key
- Ensure signature algorithm is HMAC SHA256

### Outgoing Webhook Not Firing
- Verify webhook is active
- Check that you're subscribed to the event
- Review webhook logs for errors
- Ensure target URL is accessible

### Webhook Timeout
- Outgoing webhooks timeout after 30 seconds
- Ensure your endpoint responds quickly
- Use async processing for heavy operations

## Best Practices

1. **Always verify signatures** for incoming webhooks
2. **Handle idempotency** - same event might be sent twice
3. **Respond quickly** - acknowledge receipt immediately, process async
4. **Monitor logs** - regularly check webhook activity
5. **Use HTTPS** - never use HTTP for production webhooks
6. **Implement retry logic** - outgoing webhooks don't auto-retry
7. **Rate limiting** - be prepared for bursts of events

## Rate Limits

- Incoming webhooks: No limit
- Outgoing webhooks: No limit (sent as events occur)
- Webhook logs: Kept for 30 days

## Security Considerations

1. **Keep secrets private** - Never expose webhook secrets
2. **Verify all requests** - Always validate signatures
3. **Use HTTPS only** - Encrypt data in transit
4. **Rotate secrets** - Periodically update webhook secrets
5. **Monitor for abuse** - Watch for unusual patterns
6. **Whitelist IPs** - If possible, restrict by IP address
