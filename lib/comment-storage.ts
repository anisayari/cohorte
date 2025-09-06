export interface Comment {
  id: string;
  text: string;
  author: string;
  authorType: 'user' | 'ai';
  timestamp: string;
  personaId?: string; // Si le commentaire vient d'un persona spécifique
}

export interface CommentThread {
  id: string;
  documentId: string;
  startOffset: number;
  endOffset: number;
  highlightedText: string;
  comments: Comment[];
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  color: string; // Couleur de surbrillance
}

export class CommentStorage {
  private static STORAGE_KEY = 'cohorte_comments';

  static getAllThreads(documentId: string): CommentThread[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const allThreads = stored ? JSON.parse(stored) : [];
    return allThreads.filter((thread: CommentThread) => thread.documentId === documentId);
  }

  static getThread(threadId: string): CommentThread | null {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const allThreads = stored ? JSON.parse(stored) : [];
    return allThreads.find((thread: CommentThread) => thread.id === threadId) || null;
  }

  static saveThread(thread: CommentThread): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const allThreads = stored ? JSON.parse(stored) : [];
    const index = allThreads.findIndex((t: CommentThread) => t.id === thread.id);
    
    if (index !== -1) {
      allThreads[index] = thread;
    } else {
      allThreads.push(thread);
    }
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allThreads));
  }

  static deleteThread(threadId: string): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    const allThreads = stored ? JSON.parse(stored) : [];
    const filtered = allThreads.filter((t: CommentThread) => t.id !== threadId);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
  }

  static createThread(
    documentId: string,
    startOffset: number,
    endOffset: number,
    highlightedText: string,
    color: string = '#FFE082'
  ): CommentThread {
    return {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      startOffset,
      endOffset,
      highlightedText,
      comments: [],
      resolved: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      color
    };
  }

  static addComment(threadId: string, comment: Omit<Comment, 'id' | 'timestamp'>): void {
    const thread = this.getThread(threadId);
    if (thread) {
      const newComment: Comment = {
        ...comment,
        id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString()
      };
      thread.comments.push(newComment);
      thread.updatedAt = new Date().toISOString();
      this.saveThread(thread);
    }
  }

  static resolveThread(threadId: string): void {
    const thread = this.getThread(threadId);
    if (thread) {
      thread.resolved = true;
      thread.updatedAt = new Date().toISOString();
      this.saveThread(thread);
    }
  }

  static unresolveThread(threadId: string): void {
    const thread = this.getThread(threadId);
    if (thread) {
      thread.resolved = false;
      thread.updatedAt = new Date().toISOString();
      this.saveThread(thread);
    }
  }

  static deleteComment(threadId: string, commentId: string): void {
    const thread = this.getThread(threadId);
    if (thread) {
      thread.comments = thread.comments.filter(c => c.id !== commentId);
      thread.updatedAt = new Date().toISOString();
      
      // Si plus de commentaires, supprimer le thread
      if (thread.comments.length === 0) {
        this.deleteThread(threadId);
      } else {
        this.saveThread(thread);
      }
    }
  }
}