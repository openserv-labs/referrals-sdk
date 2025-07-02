import { register, ack } from '@openserv-labs/referrals-sdk'

async function startTelegraf() {
  // Make sure to set your API key
  process.env.OPENSERV_REFERRALS_API_KEY = 'your-api-key-here'

  // Using with telegraf
  const { Telegraf } = require('telegraf')
  const bot = new Telegraf('YOUR_BOT_TOKEN')

  // Register the bot - this sets up the /start command handler
  try {
    await register(bot)
    console.log('✅ Bot registered successfully with referrals SDK')
  } catch (error) {
    console.error('❌ Failed to register bot:', error.message)
    process.exit(1)
  }

  // Example purchase handler
  bot.command('buy', async (ctx) => {
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

  // Launch the bot
  try {
    await bot.launch()
    console.log(
      '🤖 Telegraf bot is running! Users can now use referral codes with /start'
    )
  } catch (error) {
    console.error('❌ Failed to launch bot:', error.message)
    process.exit(1)
  }
}

// Start the bot
startTelegraf()
