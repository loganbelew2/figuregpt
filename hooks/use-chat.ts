import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatService, Message, ChatHistory } from '@/lib/chat-service';

interface UseChatProps {
  personality: string;
  mood: string;
  personalityId: string;
  moodId: string;
  moodEmoji: string;
  onHistoryUpdate?: (histories: ChatHistory[]) => void;
}

export function useChat({ 
  personality, 
  mood, 
  personalityId, 
  moodId, 
  moodEmoji,
  onHistoryUpdate 
}: UseChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatServiceRef = useRef<ChatService | null>(null);
  const [histories, setHistories] = useState<ChatHistory[]>([]);
  const isInitialLoad = useRef(true);
  const activeChatId = useRef<string | null>(null);

  // Helper function to prevent consecutive user messages
  const validateMessages = (msgs: Message[]): Message[] => {
    return msgs.filter((msg, index) => {
      // Keep all non-user messages
      if (msg.role !== 'user') return true;
      // Keep user messages that aren't followed by another user message
      return !msgs[index + 1] || msgs[index + 1].role !== 'user';
    });
  };

  // Initialize chat service and load histories
  useEffect(() => {
    chatServiceRef.current = new ChatService({
      personality,
      mood,
      personalityId,
      moodId,
      moodEmoji,
    });

    // Update active chat ID
    activeChatId.current = chatServiceRef.current.getChatId();

    // Load messages from chat service
    const loadedMessages = chatServiceRef.current.getMessages();
    setMessages(validateMessages(loadedMessages));

    // Load chat histories
    const loadedHistories = ChatService.getChatHistories();
    setHistories(loadedHistories);
    onHistoryUpdate?.(loadedHistories);
    
    isInitialLoad.current = false;

    // Cleanup function to handle chat switches
    return () => {
      if (isLoading) {
        console.log('Chat switched while loading, cleaning up...');
        setIsLoading(false);
        // Remove any pending messages
        setMessages(msgs => msgs.filter(msg => msg.role !== 'assistant' || msg.content.trim() !== ''));
      }
    };
  }, [personality, mood, personalityId, moodId, moodEmoji]);

  const updateHistories = useCallback(() => {
    const updated = ChatService.getChatHistories();
    setHistories(updated);
    onHistoryUpdate?.(updated);
  }, [onHistoryUpdate]);

  const sendMessage = async (content: string) => {
    if (!chatServiceRef.current) return;

    setIsLoading(true);
    const currentChatId = chatServiceRef.current.getChatId();
    activeChatId.current = currentChatId;

    try {
      // Check if the last message is a user message
      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === 'user') {
        console.warn('Prevented consecutive user messages');
        return;
      }

      // Add the user message to the UI
      const userMessage: Message = { role: 'user', content };
      setMessages(prev => validateMessages([...prev, userMessage]));

      // Let the ChatService handle adding the assistant's message
      await chatServiceRef.current.sendMessage(content, (accumulatedContent) => {
        // Only update messages if this is still the active chat
        if (activeChatId.current !== currentChatId) {
          console.log('Ignoring message update for inactive chat');
          return;
        }

        setMessages(prev => {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg?.role === 'assistant') {
            // Update existing assistant message
            return validateMessages([
              ...prev.slice(0, -1),
              { role: 'assistant', content: accumulatedContent }
            ]);
          } else {
            // Add new assistant message
            return validateMessages([
              ...prev,
              { role: 'assistant', content: accumulatedContent }
            ]);
          }
        });
      });

      // Update histories after message is sent
      updateHistories();
    } catch (error) {
      console.error('Error sending message:', error);
      // Only remove the user message if this is still the active chat
      if (activeChatId.current === currentChatId) {
        setMessages(prev => prev.slice(0, -1));
      }
    } finally {
      if (activeChatId.current === currentChatId) {
        setIsLoading(false);
      }
    }
  };

  const updateMood = useCallback((newMoodId: string, newMoodName: string, newMoodEmoji: string) => {
    if (!chatServiceRef.current) return;
    
    chatServiceRef.current.updateMood(newMoodId, newMoodName, newMoodEmoji);
    activeChatId.current = chatServiceRef.current.getChatId();
    const updatedMessages = chatServiceRef.current.getMessages();
    setMessages(validateMessages(updatedMessages));
    updateHistories();
  }, [updateHistories]);

  const createNewChat = useCallback(() => {
    if (!chatServiceRef.current) return;
    
    chatServiceRef.current.createNewChat();
    activeChatId.current = chatServiceRef.current.getChatId();
    const updatedMessages = chatServiceRef.current.getMessages();
    setMessages(validateMessages(updatedMessages));
    updateHistories();
  }, [updateHistories]);

  const deleteHistory = useCallback((chatId: string) => {
    ChatService.deleteHistory(chatId);
    updateHistories();
  }, [updateHistories]);

  const clearMessages = useCallback(() => {
    if (!chatServiceRef.current) return;
    
    chatServiceRef.current.clearHistory();
    activeChatId.current = chatServiceRef.current.getChatId();
    setMessages([]);
    updateHistories();
  }, [updateHistories]);

  return {
    messages,
    isLoading,
    sendMessage,
    clearMessages,
    updateMood,
    createNewChat,
    deleteHistory,
    histories,
  };
} 