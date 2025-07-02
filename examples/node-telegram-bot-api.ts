import { register, ack } from '@openserv-labs/referrals-sdk'

async function startNodeTelegramBotApi() {
  // Make sure to set your API key
  process.env.OPENSERV_REFERRALS_API_KEY = 'your-api-key-here'

  // Using with node-telegram-bot-api
  const TelegramBot = require('node-telegram-bot-api')
  const bot = new TelegramBot('YOUR_BOT_TOKEN', { polling: true })

  // Register the bot - this sets up the /start command handler
  try {
    await register(bot)
    console.log('✅ Bot registered successfully with referrals SDK')
  } catch (error) {
    console.error('❌ Failed to register bot:', error.message)
    process.exit(1)
  }

  // Example purchase handler
  bot.onText(/\/buy (.+)/, async (msg, match) => {
    const amount = parseFloat(match[1])
    const userId = msg.from.id
    const username = msg.from.username

    // Acknowledge a purchase action (no code needed for purchases)
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

  console.log(
    '🤖 node-telegram-bot-api bot is running! Users can now use referral codes with /start'
  )
}

// Start the bot
startNodeTelegramBotApi()
