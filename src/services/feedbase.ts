import axios from 'axios'

const FEEDBASE_API_URL = 'https://api.feedbase.app/v1'
const FEEDBASE_API_KEY = import.meta.env.VITE_FEEDBASE_API_KEY || ''
const PROJECT_SLUG = import.meta.env.VITE_FEEDBASE_PROJECT_SLUG || ''

export interface Changelog {
  id: string
  project_id: string
  author_id: string
  title: string
  slug: string
  summary: string
  content: string
  image: string
  publish_date: string
  published: boolean
}

export interface FeedbackItem {
  id: string
  title: string
  description: string
  status: string
  tags: string[]
  created_at: string
  updated_at: string
  upvotes: number
}

const feedbaseApi = axios.create({
  baseURL: FEEDBASE_API_URL,
  headers: {
    'Authorization': `Bearer ${FEEDBASE_API_KEY}`,
    'Content-Type': 'application/json'
  }
})

export const feedbaseService = {
  // Public endpoints
  async getChangelogs(): Promise<Changelog[]> {
    const response = await feedbaseApi.get(`/${PROJECT_SLUG}/changelogs`)
    return response.data
  },

  async getAtomFeed(): Promise<string> {
    const response = await feedbaseApi.get(`/${PROJECT_SLUG}/atom`)
    return response.data
  },

  // Project endpoints (require API key)
  async createFeedback(data: Partial<FeedbackItem>) {
    const response = await feedbaseApi.post('/feedback', data)
    return response.data
  },

  async getFeedback() {
    const response = await feedbaseApi.get('/feedback')
    return response.data
  },

  async updateFeedback(id: string, data: Partial<FeedbackItem>) {
    const response = await feedbaseApi.patch(`/feedback/${id}`, data)
    return response.data
  },

  async deleteFeedback(id: string) {
    const response = await feedbaseApi.delete(`/feedback/${id}`)
    return response.data
  }
}
