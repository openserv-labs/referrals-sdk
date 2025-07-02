import { AckAction, ApiResponse, ackActionSchema } from './types'

// const API_URL = 'https://referrals.openserv.ai/api'
const API_URL = 'https://referrals.openserv.ai/api'

/**
 * Register a Telegram bot for referral tracking
 * Sets up a /start command listener to capture referral codes
 * Supports both node-telegram-bot-api and telegraf
 */
export async function register(bot: any): Promise<void> {
  if (!bot) {
    throw new Error('Invalid bot: bot object is required')
  }

  // Validate API key first
  const apiKey = process.env.OPENSERV_REFERRALS_API_KEY
  if (!apiKey) {
    throw new Error(
      'OPENSERV_REFERRALS_API_KEY environment variable is required'
    )
  }

  try {
    const response = await fetch(`${API_URL}/apps/me`, {
      method: 'HEAD',
      headers: {
        'x-openserv-referrals-api-key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(
        'Invalid OPENSERV_REFERRALS_API_KEY - failed to authenticate with referrals API'
      )
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('OPENSERV_REFERRALS_API_KEY')
    ) {
      throw error
    }
    throw new Error(
      `Failed to validate API key with referrals service: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    )
  }

  // Check if it's telegraf (has start or command method)
  if (typeof bot.start === 'function' || typeof bot.command === 'function') {
    // Telegraf bot
    const handler = async (ctx: any) => {
      const code = ctx.startPayload || ctx.message?.text?.split(' ')[1]?.trim()
      const userId = ctx.from?.id
      const username = ctx.from?.username

      if (code && userId) {
        await ack({
          userId: userId,
          username: username,
          action: 'start',
          code,
        })
      }
    }

    if (typeof bot.start === 'function') {
      bot.start(handler)
    } else {
      bot.command('start', handler)
    }
  } else if (typeof bot.onText === 'function') {
    // node-telegram-bot-api
    bot.onText(/\/start (.+)/, async (msg: any, match: RegExpMatchArray) => {
      const code = match[1]?.trim()
      const userId = msg.from?.id
      const username = msg.from?.username

      if (code && userId) {
        await ack({
          userId: userId,
          username: username,
          action: 'start',
          code,
        })
      }
    })
  } else {
    throw new Error(
      'Invalid bot: must be node-telegram-bot-api or telegraf bot'
    )
  }
}

/**
 * Acknowledge a referral action by sending to the API
 */
export async function ack(action: AckAction): Promise<ApiResponse> {
  try {
    const parsedAction = ackActionSchema.parse(action)

    const apiKey = process.env.OPENSERV_REFERRALS_API_KEY
    if (!apiKey) {
      throw new Error(
        'OPENSERV_REFERRALS_API_KEY environment variable is required'
      )
    }

    const response = await fetch(`${API_URL}/referrals/ack`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-openserv-referrals-api-key': apiKey,
      },
      body: JSON.stringify(parsedAction),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      success: true,
      data,
      message: 'Action acknowledged successfully',
    } as const
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: errorMessage,
    } as const
  }
}
