import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthForm } from '@/components/auth/AuthForm'
import { ChangelogForm, type ChangelogFormData } from '@/components/ChangelogForm'
import { feedbaseService, type FeedbackItem, type Changelog } from '@/services/feedbase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useRateLimit, rateLimitConfigs } from '@/hooks/useRateLimit'
import { hasPermission, getUserRole, getRoleDisplayName, getRoleColor } from '@/config/admin'

function App() {
  const { user, signOut } = useAuth()
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [changelogs, setChangelogs] = useState<Changelog[]>([])
  const [loading, setLoading] = useState(false)
  const [newFeedback, setNewFeedback] = useState({ title: '', description: '' })
  const [showChangelogForm, setShowChangelogForm] = useState(false)

  // Rate limiting
  const feedbackRateLimit = useRateLimit(rateLimitConfigs.feedback)

  // Admin permissions
  const userRole = getUserRole(user?.id)
  const canCreateChangelogs = hasPermission(user?.id, 'canCreateChangelogs')
  const canViewAnalytics = hasPermission(user?.id, 'canViewAnalytics')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [feedbackData, changelogData] = await Promise.all([
        feedbaseService.getFeedback(),
        feedbaseService.getChangelogs()
      ])
      setFeedback(feedbackData)
      setChangelogs(changelogData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedbackRateLimit.canProceed) {
      alert(`Rate limit exceeded. You can submit ${feedbackRateLimit.remainingRequests} more feedback items. Please wait ${Math.ceil(feedbackRateLimit.timeUntilReset / 1000)} seconds.`)
      return
    }

    if (!user) {
      alert('Please sign in to submit feedback')
      return
    }

    if (!newFeedback.title.trim() || !newFeedback.description.trim()) {
      alert('Please fill in all fields')
      return
    }

    setLoading(true)
    try {
      if (!feedbackRateLimit.recordRequest()) {
        alert('Rate limit exceeded. Please try again later.')
        return
      }

      await feedbaseService.createFeedback({
        title: newFeedback.title,
        description: newFeedback.description,
        status: 'submitted',
        tags: []
      })
      setNewFeedback({ title: '', description: '' })
      await loadData()
      alert('Feedback submitted successfully!')
    } catch (error) {
      console.error('Error submitting feedback:', error)
      alert('Error submitting feedback. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateChangelog = async (changelogData: ChangelogFormData) => {
    try {
      // In a real app, this would call the Feedbase API to create a changelog
      console.log('Creating changelog:', changelogData)
      alert('Changelog created successfully! (This is a demo - actual API integration would be implemented here)')
      setShowChangelogForm(false)
      await loadData()
    } catch (error) {
      console.error('Error creating changelog:', error)
      throw error
    }
  }



  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Feedback Widget</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Welcome, {user.email}</span>
            <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(userRole)}`}>
              {getRoleDisplayName(userRole)}
            </span>
            {canViewAnalytics && (
              <span className="text-xs text-green-600">Analytics Access</span>
            )}
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>

        <Tabs defaultValue="submit" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="submit">Submit Feedback</TabsTrigger>
            <TabsTrigger value="feedback">View Feedback</TabsTrigger>
            <TabsTrigger value="changelogs">Changelogs</TabsTrigger>
          </TabsList>

          {/* Submit Feedback Tab */}
          <TabsContent value="submit">
            <Card>
              <CardHeader>
                <CardTitle>Submit Feedback</CardTitle>
                <CardDescription>
                  Share your thoughts and suggestions with us
                </CardDescription>
                {!feedbackRateLimit.canProceed && (
                  <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                    Rate limit: {feedbackRateLimit.remainingRequests} submissions remaining.
                    Resets in {Math.ceil(feedbackRateLimit.timeUntilReset / 1000)} seconds.
                  </div>
                )}
                {feedbackRateLimit.canProceed && (
                  <div className="text-sm text-green-600 bg-green-50 p-2 rounded">
                    You can submit {feedbackRateLimit.remainingRequests} more feedback items.
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitFeedback} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      placeholder="Brief description of your feedback"
                      value={newFeedback.title}
                      onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                      id="description"
                      className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Detailed description of your feedback"
                      value={newFeedback.description}
                      onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* View Feedback Tab */}
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Feedback List</CardTitle>
                <CardDescription>
                  View all submitted feedback and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.length === 0 ? (
                    <p className="text-gray-500">No feedback submitted yet.</p>
                  ) : (
                    feedback.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h3 className="font-semibold">{item.title}</h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            item.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-gray-600">{item.description}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>Upvotes: {item.upvotes}</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Changelogs Tab */}
          <TabsContent value="changelogs">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Changelogs</CardTitle>
                    <CardDescription>
                      Latest updates and changes
                    </CardDescription>
                  </div>
                  {canCreateChangelogs && (
                    <Button onClick={() => setShowChangelogForm(true)}>
                      Create Changelog
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {changelogs.length === 0 ? (
                    <p className="text-gray-500">No changelogs available.</p>
                  ) : (
                    changelogs.map((changelog) => (
                      <div key={changelog.id} className="border-l-4 border-blue-500 pl-4 space-y-2">
                        <h3 className="font-semibold text-lg">{changelog.title}</h3>
                        <p className="text-gray-600">{changelog.summary}</p>
                        <div className="text-sm text-gray-500">
                          {new Date(changelog.publish_date).toLocaleDateString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Changelog Creation Modal */}
        {showChangelogForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <ChangelogForm
              onSubmit={handleCreateChangelog}
              onCancel={() => setShowChangelogForm(false)}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
