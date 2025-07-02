import { register, ack } from '../src/referrals'

// Mock fetch globally
global.fetch = jest.fn()
const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>

describe('Referrals SDK', () => {
  beforeEach(() => {
    fetchMock.mockClear()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)
    process.env.OPENSERV_REFERRALS_API_KEY = 'test-api-key'
  })

  afterEach(() => {
    delete process.env.OPENSERV_REFERRALS_API_KEY
  })

  describe('register', () => {
    it('should register a node-telegram-bot-api bot with onText method', async () => {
      const mockBot = {
        onText: jest.fn(),
      }

      // Mock successful API validation
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as Response)

      await register(mockBot)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://referrals.openserv.ai/api/apps/me',
        {
          method: 'HEAD',
          headers: {
            'x-openserv-referrals-api-key': 'test-api-key',
          },
        }
      )
      expect(mockBot.onText).toHaveBeenCalledWith(
        /\/start (.+)/,
        expect.any(Function)
      )
    })

    it('should register a telegraf bot with start method', async () => {
      const mockBot = {
        start: jest.fn(),
      }

      // Mock successful API validation
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as Response)

      await register(mockBot)
      expect(mockBot.start).toHaveBeenCalledWith(expect.any(Function))
    })

    it('should register a telegraf bot with command method', async () => {
      const mockBot = {
        command: jest.fn(),
      }

      // Mock successful API validation
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as Response)

      await register(mockBot)
      expect(mockBot.command).toHaveBeenCalledWith(
        'start',
        expect.any(Function)
      )
    })

    it('should throw error for invalid bot object', async () => {
      const invalidBot = { invalidProperty: 'test' }

      await expect(register(invalidBot)).rejects.toThrow(
        'Invalid bot: must be node-telegram-bot-api or telegraf bot'
      )
    })

    it('should handle /start command with referral code (node-telegram-bot-api)', async () => {
      const mockBot = {
        onText: jest.fn(),
      }

      // Mock successful API validation for register call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as Response)

      await register(mockBot)

      // Get the handler function that was registered
      const startHandler = mockBot.onText.mock.calls[0][1]

      // Mock message object
      const mockMsg = {
        from: { username: 'testuser', id: 12345 },
      }
      const mockMatch = ['', 'REF123ABC']

      // Call the handler
      await startHandler(mockMsg, mockMatch)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://referrals.openserv.ai/api/referrals/ack',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openserv-referrals-api-key': 'test-api-key',
          },
          body: JSON.stringify({
            userId: 12345,
            username: 'testuser',
            action: 'start',
            code: 'REF123ABC',
          }),
        }
      )
    })

    it('should handle /start command with referral code (telegraf)', async () => {
      const mockBot = {
        start: jest.fn(),
      }

      // Mock successful API validation for register call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as Response)

      await register(mockBot)

      // Get the handler function that was registered
      const startHandler = mockBot.start.mock.calls[0][0]

      // Mock telegraf context object
      const mockCtx = {
        startPayload: 'REF123ABC',
        from: { username: 'testuser', id: 12345 },
      }

      // Call the handler
      await startHandler(mockCtx)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://referrals.openserv.ai/api/referrals/ack',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openserv-referrals-api-key': 'test-api-key',
          },
          body: JSON.stringify({
            userId: 12345,
            username: 'testuser',
            action: 'start',
            code: 'REF123ABC',
          }),
        }
      )
    })

    it('should handle user without username', async () => {
      const mockBot = {
        onText: jest.fn(),
      }

      // Mock successful API validation for register call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      } as Response)

      await register(mockBot)

      const startHandler = mockBot.onText.mock.calls[0][1]

      // Mock message object without username
      const mockMsg = {
        from: { id: 12345 },
      }
      const mockMatch = ['', 'REF123ABC']

      await startHandler(mockMsg, mockMatch)

      expect(fetchMock).toHaveBeenCalledWith(
        'https://referrals.openserv.ai/api/referrals/ack',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openserv-referrals-api-key': 'test-api-key',
          },
          body: JSON.stringify({
            userId: 12345,
            action: 'start',
            code: 'REF123ABC',
          }),
        }
      )
    })

    it('should throw error if API key validation fails', async () => {
      const mockBot = {
        onText: jest.fn(),
      }

      // Mock failed API validation
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response)

      await expect(register(mockBot)).rejects.toThrow(
        'Invalid OPENSERV_REFERRALS_API_KEY - failed to authenticate with referrals API'
      )
      expect(mockBot.onText).not.toHaveBeenCalled()
    })

    it('should throw error if API key is missing', async () => {
      delete process.env.OPENSERV_REFERRALS_API_KEY

      const mockBot = {
        onText: jest.fn(),
      }

      await expect(register(mockBot)).rejects.toThrow(
        'OPENSERV_REFERRALS_API_KEY environment variable is required'
      )
      expect(mockBot.onText).not.toHaveBeenCalled()
    })

    it('should throw error if API validation network call fails', async () => {
      const mockBot = {
        onText: jest.fn(),
      }

      // Mock network failure
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      await expect(register(mockBot)).rejects.toThrow(
        'Failed to validate API key with referrals service: Network error'
      )
      expect(mockBot.onText).not.toHaveBeenCalled()
    })
  })

  describe('ack', () => {
    it('should send start action to API', async () => {
      const result = await ack({
        userId: 12345,
        username: 'testuser',
        action: 'start',
        code: 'REF123',
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://referrals.openserv.ai/api/referrals/ack',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openserv-referrals-api-key': 'test-api-key',
          },
          body: JSON.stringify({
            userId: 12345,
            username: 'testuser',
            action: 'start',
            code: 'REF123',
          }),
        }
      )
      expect(result.success).toBe(true)
    })

    it('should send purchase action with amount to API', async () => {
      const result = await ack({
        userId: 67890,
        username: 'buyer',
        action: 'purchase',
        amount: 29.99,
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://referrals.openserv.ai/api/referrals/ack',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openserv-referrals-api-key': 'test-api-key',
          },
          body: JSON.stringify({
            userId: 67890,
            username: 'buyer',
            action: 'purchase',
            amount: 29.99,
          }),
        }
      )
      expect(result.success).toBe(true)
    })

    it('should send action without username', async () => {
      const result = await ack({
        userId: 12345,
        action: 'purchase',
        amount: 10.0,
      })

      expect(fetchMock).toHaveBeenCalledWith(
        'https://referrals.openserv.ai/api/referrals/ack',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openserv-referrals-api-key': 'test-api-key',
          },
          body: JSON.stringify({
            userId: 12345,
            action: 'purchase',
            amount: 10.0,
          }),
        }
      )
      expect(result.success).toBe(true)
    })

    it('should handle API errors gracefully', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
      } as Response)

      const result = await ack({
        userId: 12345,
        username: 'testuser',
        action: 'start',
        code: 'INVALID',
      })

      expect(result).toEqual({
        success: false,
        error: 'HTTP 400: Bad Request',
      })
    })

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new Error('Network error'))

      const result = await ack({
        userId: 12345,
        username: 'testuser',
        action: 'start',
        code: 'TEST123',
      })

      expect(result).toEqual({
        success: false,
        error: 'Network error',
      })
    })

    it('should validate action data with Zod', async () => {
      const result = await ack({
        userId: 12345,
        username: 'testuser',
        action: 'invalid_action',
        code: 'REF123',
      } as any)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it('should require amount for purchase actions', async () => {
      const result = await ack({
        userId: 12345,
        username: 'buyer',
        action: 'purchase',
      } as any)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('amount')
      }
    })

    it('should require userId', async () => {
      const result = await ack({
        username: 'testuser',
        action: 'start',
        code: 'REF123',
      } as any)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('userId')
      }
    })

    it('should require API key environment variable', async () => {
      delete process.env.OPENSERV_REFERRALS_API_KEY

      const result = await ack({
        userId: 12345,
        username: 'testuser',
        action: 'start',
        code: 'REF123',
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('OPENSERV_REFERRALS_API_KEY')
      }
    })
  })
})
