export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export class ConversationStorage {
  private static STORAGE_KEY = 'cohorte_conversations';

  static getAllConversations(): Conversation[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getConversation(id: string): Conversation | null {
    const conversations = this.getAllConversations();
    return conversations.find(c => c.id === id) || null;
  }

  static saveConversation(conversation: Conversation): void {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(c => c.id === conversation.id);
    
    if (index !== -1) {
      conversations[index] = conversation;
    } else {
      conversations.push(conversation);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(conversations));
  }

  static deleteConversation(id: string): void {
    const conversations = this.getAllConversations();
    const filtered = conversations.filter(c => c.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  static createNewConversation(): Conversation {
    return {
      id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: 'New script',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  static updateConversationTitle(id: string, title: string): void {
    const conversation = this.getConversation(id);
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = new Date().toISOString();
      this.saveConversation(conversation);
    }
  }

  static addMessage(conversationId: string, message: Message): void {
    const conversation = this.getConversation(conversationId);
    if (conversation) {
      conversation.messages.push(message);
      conversation.updatedAt = new Date().toISOString();
      this.saveConversation(conversation);
    }
  }
}
