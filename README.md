# OpenServ Referrals SDK

[![npm version](https://badge.fury.io/js/@openserv-labs%2Freferrals-sdk.svg)](https://badge.fury.io/js/@openserv-labs%2Freferrals-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

A lightweight TypeScript SDK for tracking referrals in Telegram bots. This is a thin wrapper over the OpenServ Referrals API.

## Installation

```bash
npm install @openserv-labs/referrals-sdk
```

For `node-telegram-bot-api`:

```bash
npm install node-telegram-bot-api
```

For `telegraf`:

```bash
npm install telegraf
```

## Quick Start

### With node-telegram-bot-api

```typescript
import { register, ack } from '@openserv-labs/referrals-sdk'
const TelegramBot = require('node-telegram-bot-api')

// Set your API key
process.env.OPENSERV_REFERRALS_API_KEY = 'your-api-key-here'

const bot = new TelegramBot('YOUR_BOT_TOKEN', { polling: true })

// Register your bot - this sets up automatic /start handling
await register(bot)

// Manually acknowledge a purchase
await ack({
  userId: 12345,
  username: 'john_doe',
  action: 'purchase',
  amount: 10.99,
})
```

### With telegraf

```typescript
import { register, ack } from '@openserv-labs/referrals-sdk'
const { Telegraf } = require('telegraf')

// Set your API key
process.env.OPENSERV_REFERRALS_API_KEY = 'your-api-key-here'

const bot = new Telegraf('YOUR_BOT_TOKEN')

// Register your bot - this sets up automatic /start handling
await register(bot)

await bot.launch()
```

## API

### `register(bot)`

Sets up a `/start` command handler that automatically captures referral codes and sends them to the API. Works with both `node-telegram-bot-api` and `telegraf`.

```typescript
register(bot: TelegramBot | Telegraf): Promise<void>
```

**Example:**

```typescript
await register(bot)
// Now when users click https://t.me/yourbot?start=REF123
// It automatically calls ack() with: { userId, username, action: 'start', code: 'REF123' }
```

**Important:** This function validates your API key and will throw an error if it's missing or invalid.

### `ack(action)`

Sends referral acknowledgment to the API.

```typescript
ack(action: AckAction): Promise<ApiResponse>
```

**Types:**

```typescript
// For registrations (when user starts with referral code)
interface StartAction {
  userId: number        // Telegram user ID
  username?: string     // Telegram username (optional)
  action: 'start'       // Action type
  code: string          // Referral code
}

// For purchases
interface PurchaseAction {
  userId: number        // Telegram user ID
  username?: string     // Telegram username (optional)
  action: 'purchase'    // Action type
  amount: number        // Purchase amount
}

type AckAction = StartAction | PurchaseAction

interface ApiResponse {
  success: true
  data?: any
  message?: string
} | {
  success: false
  error: string
}
```

**Examples:**

Registration (handled automatically by `register()`):

```typescript
await ack({
  userId: 12345,
  username: 'john_doe',
  action: 'start',
  code: 'REF123ABC',
})
```

Purchase:

```typescript
await ack({
  userId: 12345,
  username: 'john_doe',
  action: 'purchase',
  amount: 29.99,
})
```

User without username:

```typescript
await ack({
  userId: 12345,
  action: 'purchase',
  amount: 9.99,
})
```

## Complete Examples

### node-telegram-bot-api Example

```typescript
import { register, ack } from '@openserv-labs/referrals-sdk'
const TelegramBot = require('node-telegram-bot-api')

async function startBot() {
  process.env.OPENSERV_REFERRALS_API_KEY = 'your-api-key-here'

  const bot = new TelegramBot('YOUR_BOT_TOKEN', { polling: true })

  // Set up automatic referral tracking
  try {
    await register(bot)
    console.log('✅ Bot registered with referrals SDK')
  } catch (error) {
    console.error('❌ Failed to register:', error.message)
    process.exit(1)
  }

  // Handle purchases
  bot.onText(/\/buy (.+)/, async (msg, match) => {
    const amount = parseFloat(match[1])
    const userId = msg.from.id
    const username = msg.from.username

    const result = await ack({
      userId: userId,
      username: username,
      action: 'purchase',
      amount: amount,
    })

    if (result.success) {
      bot.sendMessage(msg.chat.id, `✅ Purchase of $${amount} processed!`)
    } else {
      bot.sendMessage(msg.chat.id, `❌ Error: ${result.error}`)
    }
  })
}

startBot()
```

### telegraf Example

```typescript
import { register, ack } from '@openserv-labs/referrals-sdk'
const { Telegraf } = require('telegraf')

async function startBot() {
  process.env.OPENSERV_REFERRALS_API_KEY = 'your-api-key-here'

  const bot = new Telegraf('YOUR_BOT_TOKEN')

  // Set up automatic referral tracking
  try {
    await register(bot)
    console.log('✅ Bot registered with referrals SDK')
  } catch (error) {
    console.error('❌ Failed to register:', error.message)
    process.exit(1)
  }

  // Handle purchases
  bot.command('buy', async ctx => {
    const args = ctx.message.text.split(' ')
    const amount = parseFloat(args[1])
    const userId = ctx.from.id
    const username = ctx.from.username

    const result = await ack({
      userId: userId,
      username: username,
      action: 'purchase',
      amount: amount,
    })

    if (result.success) {
      ctx.reply(`✅ Purchase of $${amount} processed!`)
    } else {
      ctx.reply(`❌ Error: ${result.error}`)
    }
  })

  await bot.launch()
  console.log('🤖 Bot is running!')
}

startBot()
```

## How It Works

1. **Setup**: Set your `OPENSERV_REFERRALS_API_KEY` environment variable
2. **Register**: `register(bot)` validates your API key and sets up a `/start` handler
3. **Automatic Tracking**: When users click `https://t.me/yourbot?start=REF123`, it automatically sends the referral data to the API
4. **Manual Tracking**: Use `ack()` to manually send purchase events
5. **API Integration**: All data is sent to the OpenServ referrals API

## API Payloads

### Registration (automatic)

```json
{
  "userId": 12345,
  "username": "john_doe",
  "action": "start",
  "code": "REF123ABC"
}
```

### Purchase (manual)

```json
{
  "userId": 12345,
  "username": "john_doe",
  "action": "purchase",
  "amount": 29.99
}
```

### User without username

```json
{
  "userId": 12345,
  "action": "purchase",
  "amount": 9.99
}
```

## Environment Variables

| Variable                     | Required | Description                     |
| ---------------------------- | -------- | ------------------------------- |
| `OPENSERV_REFERRALS_API_KEY` | Yes      | Your OpenServ referrals API key |

## Error Handling

The SDK will throw errors for:

- Missing or invalid API key
- Network failures during API key validation
- Invalid bot objects

```typescript
try {
  await register(bot)
} catch (error) {
  console.error('Failed to register bot:', error.message)
  // Handle error appropriately
}
```

The `ack()` function returns success/error in the response:

```typescript
const result = await ack({ ... })
if (!result.success) {
  console.error('Failed to acknowledge action:', result.error)
}
```

## Framework Support

This SDK supports both major Telegram bot frameworks:

- **node-telegram-bot-api** - Uses `onText()` method for /start handling
- **telegraf** - Uses `start()` or `command()` methods

The SDK automatically detects which framework you're using.

## License

MIT License - see LICENSE file for details.
