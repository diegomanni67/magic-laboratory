export interface PracticeVideo {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl?: string
  author: string
  authorEmail: string
  authorRole: string
  techniqueCategory: string
  difficultyLevel: string
  createdAt: Date
  updatedAt: Date
  replies: number
  views: number
  pinned: boolean
  tags: string[]
}

export interface ForumThread {
  id: string
  title: string
  content: string
  author: string
  authorEmail: string
  authorRole: string
  category: string
  createdAt: Date
  updatedAt: Date
  replies: number
  views: number
  pinned: boolean
  tags: string[]
}

export interface ForumReply {
  id: string
  threadId: string
  content: string
  author: string
  authorEmail: string
  authorRole: string
  createdAt: Date
  likes: number
  parentId?: string
}

export interface DownloadLink {
  name: string
  url: string
  addedBy: string
  addedAt: Date
}

export interface AIAnalysis {
  id: string
  videoId: string
  analysisText: string
  technicalScore?: number
  performanceScore?: number
  suggestions: string[]
  strengths: string[]
  areasForImprovement: string[]
  createdAt: Date
  modelVersion: string
}

export interface MagicEvent {
  id: string
  title: string
  description: string
  eventDate: Date
  location: string
  registrationUrl?: string
  createdAt: Date
  updatedAt: Date
}

// import { databaseStorage } from './database-storage' // DESACTIVADO - VERSIÓN LOCAL

class ForumStorage {
  private forumType: 'fundamentos' | 'maestria'
  private threadsKey: string
  private repliesKey: string
  private materialLinksKey: string
  private practiceVideosKey: string
  private aiAnalysesKey: string
  private magicEventsKey: string
  private useDatabase = false // VERSIÓN LOCAL ABIERTA - SIN SUPABASE

  constructor(forumType: 'fundamentos' | 'maestria' = 'fundamentos') {
    this.forumType = forumType
    this.threadsKey = `forum_threads_${forumType}`
    this.repliesKey = `forum_replies_${forumType}`
    this.materialLinksKey = `material_links_${forumType}`
    this.practiceVideosKey = `practice_videos_${forumType}`
    this.aiAnalysesKey = `ai_analyses_${forumType}`
    this.magicEventsKey = `magic_events`
  }

  // Threads
  async getThreads(category?: string): Promise<ForumThread[]> {
    // VERSIÓN LOCAL ABIERTA - SOLO LOCALSTORAGE
    if (typeof window === 'undefined') return []

    const threads = JSON.parse(localStorage.getItem(this.threadsKey) || '[]')
    const parsedThreads = threads.map((thread: any) => ({
      ...thread,
      createdAt: thread.createdAt instanceof Date ? thread.createdAt : new Date(thread.createdAt),
      updatedAt: thread.updatedAt instanceof Date ? thread.updatedAt : new Date(thread.updatedAt)
    }))

    if (category) {
      return parsedThreads.filter((thread: ForumThread) => thread.category === category)
    }
    return parsedThreads
  }

  async saveThread(thread: Omit<ForumThread, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'views'>): Promise<ForumThread> {
    // VERSIÓN LOCAL ABIERTA - SOLO LOCALSTORAGE
    if (typeof window === 'undefined') throw new Error('Cannot save on server')
    
    const threads = await this.getThreads()
    const newThread: ForumThread = {
      ...thread,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      replies: 0,
      views: 0
    }
    
    threads.push(newThread)
    localStorage.setItem(this.threadsKey, JSON.stringify(threads))
    return newThread
  }

  async getThread(id: string): Promise<ForumThread | null> {
    // VERSIÓN LOCAL ABIERTA - SOLO LOCALSTORAGE
    const threads = await this.getThreads()
    return threads.find(thread => thread.id === id) || null
  }

  async updateThreadViews(id: string): Promise<void> {
    // VERSIÓN LOCAL ABIERTA - SOLO LOCALSTORAGE
    if (typeof window === 'undefined') return
    
    const threads = await this.getThreads()
    const threadIndex = threads.findIndex(thread => thread.id === id)
    if (threadIndex !== -1) {
      threads[threadIndex].views++
      threads[threadIndex].updatedAt = new Date()
      localStorage.setItem(this.threadsKey, JSON.stringify(threads))
    }
  }

  // Replies
  async getReplies(threadId: string): Promise<ForumReply[]> {
    // VERSIÓN LOCAL ABIERTA - SOLO LOCALSTORAGE
    if (typeof window === 'undefined') return []

    const replies = JSON.parse(localStorage.getItem(this.repliesKey) || '[]')
    return replies
      .filter((reply: any) => reply.threadId === threadId)
      .map((reply: any) => ({
        ...reply,
        createdAt: reply.createdAt instanceof Date ? reply.createdAt : new Date(reply.createdAt)
      }))
      .sort((a: ForumReply, b: ForumReply) => a.createdAt.getTime() - b.createdAt.getTime())
  }

  async saveReply(reply: Omit<ForumReply, 'id' | 'createdAt' | 'likes'>): Promise<ForumReply> {
    // VERSIÓN LOCAL ABIERTA - SOLO LOCALSTORAGE
    if (typeof window === 'undefined') throw new Error('Cannot save on server')
    
    const replies = JSON.parse(localStorage.getItem(this.repliesKey) || '[]')
    const newReply: ForumReply = {
      ...reply,
      id: Date.now().toString(),
      createdAt: new Date(),
      likes: 0
    }
    
    replies.push(newReply)
    localStorage.setItem(this.repliesKey, JSON.stringify(replies))
    
    // Update thread reply count
    const threads = await this.getThreads()
    const threadIndex = threads.findIndex(thread => thread.id === reply.threadId)
    if (threadIndex !== -1) {
      threads[threadIndex].replies++
      threads[threadIndex].updatedAt = new Date()
      localStorage.setItem(this.threadsKey, JSON.stringify(threads))
    }
    
    return newReply
  }

  // Material Links
  async getMaterialLinks(subcategoryId: string): Promise<DownloadLink[]> {
    // VERSIÓN LOCAL ABIERTA - SOLO LOCALSTORAGE
    if (typeof window === 'undefined') return []
    
    const links = JSON.parse(localStorage.getItem(this.materialLinksKey) || '[]')
    return links
      .filter((link: any) => link.subcategoryId === subcategoryId)
      .map((link: any) => ({
        ...link,
        addedAt: new Date(link.addedAt)
      }))
  }

  async addMaterialLink(subcategoryId: string, link: Omit<DownloadLink, 'addedAt'>): Promise<void> {
    // VERSIÓN LOCAL ABIERTA - SOLO LOCALSTORAGE
    if (typeof window === 'undefined') return
    
    const links = JSON.parse(localStorage.getItem(this.materialLinksKey) || '[]')
    const newLink = {
      ...link,
      subcategoryId,
      addedAt: new Date()
    }
    
    links.push(newLink)
    localStorage.setItem(this.materialLinksKey, JSON.stringify(links))
  }
}

export const forumStorage = new ForumStorage('fundamentos')
export const fundamentosForumStorage = new ForumStorage('fundamentos')
export const maestriaForumStorage = new ForumStorage('maestria')
