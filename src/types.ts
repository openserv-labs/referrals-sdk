import { z } from 'zod'

// Ack action schema with discrimination
export const ackActionSchema = z.discriminatedUnion('action', [
  z.object({
    userId: z.number(),
    username: z.string().optional(),
    action: z.literal('start'),
    code: z.string(),
  }),
  z.object({
    userId: z.number(),
    username: z.string().optional(),
    action: z.literal('purchase'),
    amount: z.number().positive(),
  }),
])

export type AckAction = z.infer<typeof ackActionSchema>

// API response schema with discrimination
export const apiResponseSchema = z.discriminatedUnion('success', [
  z.object({
    success: z.literal(true),
    data: z.any().optional(),
    message: z.string().optional(),
  }),
  z.object({
    success: z.literal(false),
    error: z.string(),
  }),
])

export type ApiResponse = z.infer<typeof apiResponseSchema>
