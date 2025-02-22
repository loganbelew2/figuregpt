export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatHistory {
  id: string;
  messages: Message[];
  personality: {
    id: string;
    name: string;
  };
  mood: {
    id: string;
    name: string;
    emoji: string;
  };
  lastMessage: string;
  timestamp: number;
}

export interface ChatServiceOptions {
  personality: string;
  mood: string;
  personalityId: string;
  moodId: string;
  moodEmoji: string;
}

const STORAGE_KEY = 'chat_histories_v1';
const MAX_HISTORIES = 10;

export class ChatService {
  private messages: Message[] = [];
  private personality: string;
  private mood: string;
  private personalityId: string;
  private moodId: string;
  private moodEmoji: string;
  private chatId: string;

  constructor(options: ChatServiceOptions) {
    this.personality = options.personality;
    this.mood = options.mood;
    this.personalityId = options.personalityId;
    this.moodId = options.moodId;
    this.moodEmoji = options.moodEmoji;
    this.chatId = this.generateChatId();
    this.loadOrInitializeChat();
  }

  private generateChatId(): string {
    return `${this.personalityId}-${this.moodId}-${Date.now()}`;
  }

  private getAllChatHistories(): ChatHistory[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading chat histories:', error);
      return [];
    }
  }

  private saveChatHistory() {
    try {
      // Only save if there's at least one user message
      const hasUserMessages = this.messages.some(m => m.role === 'user');
      if (!hasUserMessages) return;

      const histories = this.getAllChatHistories();
      
      // Find existing history index
      const existingIndex = histories.findIndex(h => h.id === this.chatId);
      
      const updatedHistory: ChatHistory = {
        id: this.chatId,
        messages: this.messages,
        personality: {
          id: this.personalityId,
          name: this.personality,
        },
        mood: {
          id: this.moodId,
          name: this.mood,
          emoji: this.moodEmoji,
        },
        lastMessage: this.getLastUserMessage() || '',
        timestamp: Date.now(),
      };

      if (existingIndex !== -1) {
        histories[existingIndex] = updatedHistory;
      } else {
        histories.unshift(updatedHistory);
      }

      // Keep only the most recent MAX_HISTORIES
      const trimmedHistories = histories.slice(0, MAX_HISTORIES);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistories));
      
      return updatedHistory;
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  private getLastUserMessage(): string {
    for (let i = this.messages.length - 1; i >= 0; i--) {
      if (this.messages[i].role === 'user') {
        return this.messages[i].content;
      }
    }
    return '';
  }

  private loadOrInitializeChat() {
    const histories = this.getAllChatHistories();
    const existingHistory = histories.find(h => 
      h.personality.id === this.personalityId && 
      h.mood.id === this.moodId
    );

    if (existingHistory) {
      this.messages = existingHistory.messages;
      this.chatId = existingHistory.id;
    } else {
      this.initializeContext();
    }
  }

  private initializeContext() {
    this.messages = [
      {
        role: 'system',
        content: `You are ${this.personality}. Respond to all messages in a ${this.mood.toLowerCase()} mood. Stay in character and maintain the personality traits, speaking style, and knowledge base that ${this.personality} would have. Your responses should reflect both the character's personality and the current mood.`,
      },
    ];
    this.saveChatHistory();
  }

  public updateMood(newMoodId: string, newMoodName: string, newMoodEmoji: string): void {
    this.moodId = newMoodId;
    this.mood = newMoodName;
    this.moodEmoji = newMoodEmoji;

    // Check if a chat with the same personality and new mood exists
    const histories = this.getAllChatHistories();
    const existingHistory = histories.find(h => 
      h.personality.id === this.personalityId && 
      h.mood.id === this.moodId
    );

    if (existingHistory) {
      // Use the existing chat
      this.chatId = existingHistory.id;
      this.messages = existingHistory.messages;
    } else {
      // Only create a new chat if one doesn't exist
      this.chatId = this.generateChatId();
      this.initializeContext();
    }
  }

  public createNewChat(): void {
    // Check if a chat with the same personality and mood exists
    const histories = this.getAllChatHistories();
    const existingHistory = histories.find(h => 
      h.personality.id === this.personalityId && 
      h.mood.id === this.moodId
    );

    if (!existingHistory) {
      // Only create a new chat if one doesn't exist
      this.chatId = this.generateChatId();
      this.initializeContext();
    } else {
      // Use the existing chat
      this.chatId = existingHistory.id;
      this.messages = existingHistory.messages;
    }
  }

  public static getChatHistories(): ChatHistory[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting chat histories:', error);
      return [];
    }
  }

  public static deleteHistory(chatId: string): void {
    try {
      const histories = ChatService.getChatHistories();
      const filtered = histories.filter(h => h.id !== chatId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting chat history:', error);
    }
  }

  private async processStreamResponse(
    reader: ReadableStreamDefaultReader<Uint8Array>,
    onChunk: (chunk: string) => void
  ): Promise<string> {
    let accumulatedMessage = '';
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        let result;
        try {
          result = await reader.read();
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            console.log('Stream reading aborted');
            break;
          }
          throw error;
        }

        const { done, value } = result;
        if (done) break;

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep last incomplete line

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulatedMessage += content;
              onChunk(accumulatedMessage);
            }
          } catch (e) {
            console.error('Error parsing chunk:', e);
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        try {
          const data = buffer.slice(6);
          if (data !== '[DONE]') {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulatedMessage += content;
              onChunk(accumulatedMessage);
            }
          }
        } catch (e) {
          console.error('Error parsing final buffer:', e);
        }
      }

      return accumulatedMessage;
    } catch (error) {
      console.error('Stream processing error:', error);
      throw error;
    } finally {
      try {
        await reader.cancel();
      } catch (e) {
        console.error('Error canceling reader:', e);
      }
      reader.releaseLock();
    }
  }

  public async sendMessage(
    message: string,
    onChunk: (chunk: string) => void
  ): Promise<void> {
    // Add the user message to internal state
    this.messages.push({ role: 'user', content: message });

    try {
      const apiUrl = `${window.location.origin}/api/chat`;
      console.log('Sending message to API:', {
        endpoint: apiUrl,
        messageCount: this.messages.length,
        lastMessage: this.messages[this.messages.length - 1],
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          messages: this.messages,
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: response.statusText };
        }
        
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: response.url,
        });
        
        // Remove the user message on error
        this.messages.pop();
        throw new Error(`Failed to send message: ${response.status} ${JSON.stringify(errorData)}`);
      }

      if (!response.body) {
        // Remove the user message if no response body
        this.messages.pop();
        throw new Error('No response body available');
      }

      const reader = response.body.getReader();
      let accumulatedMessage = '';
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.trim() === '') continue;
            if (!line.startsWith('data: ')) continue;
            
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                accumulatedMessage += content;
                onChunk(accumulatedMessage);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }

        if (accumulatedMessage) {
          // Add the complete assistant message to internal state
          this.messages.push({
            role: 'assistant',
            content: accumulatedMessage,
          });
          this.saveChatHistory();
        } else {
          // Remove the user message if no response was accumulated
          this.messages.pop();
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      // Remove the user message on any error
      this.messages.pop();
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  public clearHistory(): void {
    this.initializeContext();
    // Also remove from session storage
    const histories = this.getAllChatHistories();
    const filtered = histories.filter(h => h.id !== this.chatId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  public getMessages(): Message[] {
    return this.messages;
  }

  public getChatId(): string {
    return this.chatId;
  }
} 