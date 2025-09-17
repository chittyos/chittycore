/**
 * ChittyChat - Lightweight messaging client connector
 * Provides connection interface to ChittyChat services
 */

import { EventEmitter } from 'eventemitter3'
import { sendBeacon } from '../beacon'

export interface ChittyChatConfig {
  endpoint?: string
  wsEndpoint?: string
  apiKey?: string
}

export interface Message {
  id: string
  content: string
  chittyId: string
  timestamp: string
  channel?: string
}

class ChittyChatClient extends EventEmitter {
  private config: ChittyChatConfig
  private ws: WebSocket | null = null

  constructor(config: ChittyChatConfig = {}) {
    super()
    this.config = {
      endpoint: config.endpoint || process.env.CHITTY_CHAT_ENDPOINT || 'https://chat.chitty.cc',
      wsEndpoint: config.wsEndpoint || process.env.CHITTY_CHAT_WS || 'wss://ws.chitty.cc',
      apiKey: config.apiKey || process.env.CHITTY_CHAT_API_KEY
    }
  }

  async connect(chittyId: string): Promise<void> {
    const url = `${this.config.wsEndpoint}?chittyId=${chittyId}`
    this.ws = new WebSocket(url)

    return new Promise((resolve, reject) => {
      this.ws!.onopen = () => {
        sendBeacon('chittychat_connected', { chittyId })
        resolve()
      }
      this.ws!.onerror = (error) => reject(error)
      this.ws!.onmessage = (event) => {
        this.emit('message', JSON.parse(event.data))
      }
    })
  }

  async send(message: Omit<Message, 'id' | 'timestamp'>): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected to ChittyChat')
    }

    this.ws.send(JSON.stringify(message))
    sendBeacon('chittychat_message_sent')
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

let clientInstance: ChittyChatClient | null = null

export function getChittyChat(config?: ChittyChatConfig): ChittyChatClient {
  if (!clientInstance) {
    clientInstance = new ChittyChatClient(config)
  }
  return clientInstance
}

export default {
  getChittyChat,
  ChittyChatClient
}