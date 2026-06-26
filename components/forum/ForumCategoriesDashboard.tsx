"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { 
  Film, 
  Music, 
  Plane, 
  Utensils, 
  Gamepad2, 
  Trophy, 
  MessageCircle, 
  BookOpen,
  FileText,
  Headphones,
  ClipboardCheck,
  Plus
} from "lucide-react"
import { ForumThreadView } from "./ForumThreadView"
import { CreateThreadForm } from "./CreateThreadForm"
import { ThreadDetail } from "./ThreadDetail"
import { MaterialSubcategoryView } from "./MaterialSubcategoryView"
import { initializeDemoData } from "@/lib/forum-demo-data"

interface Category {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  isMaterial?: boolean
  image?: string
  subcategories?: Array<{
    id: string
    name: string | null
    description: string | null
    downloadLinks: Array<{
      name: string
      url: string
    }>
  }>
}

interface ForumCategoriesDashboardProps {
  forumType?: 'academy' | 'studio'
}

export function ForumCategoriesDashboard({ forumType = 'academy' }: ForumCategoriesDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [currentView, setCurrentView] = useState<'categories' | 'threads' | 'create' | 'detail'>('categories')
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)

  useEffect(() => {
    // Initialize demo data when component mounts
    initializeDemoData(forumType)
  }, [forumType])

  const categories: Category[] = [
    {
      id: 'movies',
      title: "Let's talk about movies, series and shows!",
      description: 'Discuss your favorite films, TV series, and shows',
      icon: <Film className="w-6 h-6" />,
      color: 'from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30',
      image: '/images/forum/Lifetime.jpeg'
    },
    {
      id: 'music',
      title: "Let's talk about Music!",
      description: 'Share your favorite songs, artists, and musical experiences',
      icon: <Music className="w-6 h-6" />,
      color: 'from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30',
      image: '/images/forum/Music.jpeg'
    },
    {
      id: 'travels',
      title: "Let's talk about travels!",
      description: 'Share travel stories, tips, and dream destinations',
      icon: <Plane className="w-6 h-6" />,
      color: 'from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30',
      image: '/images/forum/Travel.jpeg'
    },
    {
      id: 'food',
      title: "Let's talk about Food & Cooking!",
      description: 'Exchange recipes, cooking tips, and food experiences',
      icon: <Utensils className="w-6 h-6" />,
      color: 'from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30',
      image: '/images/forum/Food.jpeg'
    },
    {
      id: 'gaming',
      title: "Let's talk about Gaming & Tech!",
      description: 'Discuss video games, technology, and digital innovations',
      icon: <Gamepad2 className="w-6 h-6" />,
      color: 'from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30',
      image: '/images/forum/Gaming.jpeg'
    },
    {
      id: 'sports',
      title: "Let's talk about Sports!",
      description: 'Share sports news, fitness tips, and game discussions',
      icon: <Trophy className="w-6 h-6" />,
      color: 'from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30',
      image: '/images/forum/Sports.jpeg'
    },
    {
      id: 'daily-life',
      title: 'Daily Life & Random Thoughts!',
      description: 'Share everyday experiences and random thoughts',
      icon: <MessageCircle className="w-6 h-6" />,
      color: 'from-pink-500/20 to-rose-500/20 hover:from-pink-500/30 hover:to-rose-500/30',
      image: '/images/forum/Music.jpeg'
    },
    {
      id: 'material',
      title: 'Material',
      description: 'Access study materials, guides, and resources',
      icon: <BookOpen className="w-6 h-6" />,
      color: 'from-amber-500/20 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30',
      image: '/images/forum/Material.jpeg',
      isMaterial: true,
      subcategories: [
        {
          id: 'books',
          name: 'Books',
          description: 'Digital textbooks and reading materials',
          downloadLinks: [
            { name: 'English Grammar Book', url: '#' },
            { name: 'Vocabulary Builder', url: '#' },
            { name: 'Reading Comprehension Guide', url: '#' }
          ]
        },
        {
          id: 'study-guides',
          name: 'Study Guides',
          description: 'Comprehensive study materials and guides',
          downloadLinks: [
            { name: 'Exam Preparation Guide', url: '#' },
            { name: 'Writing Skills Workbook', url: '#' },
            { name: 'Speaking Practice Manual', url: '#' }
          ]
        },
        {
          id: 'audio',
          name: 'Audio',
          description: 'Audio materials for listening practice',
          downloadLinks: [
            { name: 'Listening Exercises', url: '#' },
            { name: 'Pronunciation Audio', url: '#' },
            { name: 'Conversation Practice', url: '#' }
          ]
        },
        {
          id: 'exams',
          name: 'Exams',
          description: 'Practice tests and examination materials',
          downloadLinks: [
            { name: 'Mock Test A1', url: '#' },
            { name: 'Mock Test A2', url: '#' },
            { name: 'Mock Test B1', url: '#' }
          ]
        }
      ]
    }
  ]

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory)
  const selectedSubcategoryData = selectedCategoryData?.subcategories?.find(sub => sub.id === selectedSubcategory)

  const handleCategoryClick = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId)
    if (category?.isMaterial) {
      setSelectedCategory(categoryId)
    } else {
      setSelectedCategory(categoryId)
      setCurrentView('threads')
    }
  }

  const handleBackToCategories = () => {
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setCurrentView('categories')
    setSelectedThreadId(null)
  }

  const handleBackToThreads = () => {
    setCurrentView('threads')
    setSelectedThreadId(null)
  }

  const handleCreateThread = () => {
    setCurrentView('create')
  }

  const handleThreadClick = (threadId: string) => {
    setSelectedThreadId(threadId)
    setCurrentView('detail')
  }

  const handleThreadCreated = (threadId: string) => {
    setSelectedThreadId(threadId)
    setCurrentView('detail')
  }

  // Render thread view for forum categories
  if (currentView === 'threads' && selectedCategory && !selectedCategoryData?.isMaterial) {
    return (
      <ForumThreadView
        categoryId={selectedCategory}
        categoryName={selectedCategoryData?.title || ''}
        onBack={handleBackToCategories}
        onThreadClick={handleThreadClick}
        onCreateThread={handleCreateThread}
        forumType={forumType}
      />
    )
  }

  // Render create thread form
  if (currentView === 'create' && selectedCategory && !selectedCategoryData?.isMaterial) {
    return (
      <CreateThreadForm
        categoryId={selectedCategory}
        categoryName={selectedCategoryData?.title || ''}
        onBack={() => setCurrentView('threads')}
        onThreadCreated={handleThreadCreated}
        forumType={forumType}
      />
    )
  }

  // Render thread detail
  if (currentView === 'detail' && selectedThreadId) {
    return (
      <ThreadDetail
        threadId={selectedThreadId}
        onBack={handleBackToThreads}
        categoryName={selectedCategoryData?.title || undefined}
        forumType={forumType}
      />
    )
  }

  if (selectedSubcategoryData) {
    return (
      <MaterialSubcategoryView
        subcategoryId={selectedSubcategory}
        subcategoryName={selectedSubcategoryData.name ?? ''}
        subcategoryDescription={selectedSubcategoryData.description ?? ''}
        onBack={() => setSelectedSubcategory(null)}
        staticLinks={selectedSubcategoryData.downloadLinks}
      />
    )
  }

  if (selectedCategoryData && selectedCategoryData.subcategories) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-6">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className="mb-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-lg hover:bg-white/20 transition-all duration-300 border border-white/20"
          >
            <span className="flex items-center gap-2">
              <span>Back to Categories</span>
            </span>
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-400 bg-clip-text text-transparent">
              {selectedCategoryData.title}
            </h2>
            <p className="text-gray-300">{selectedCategoryData.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedCategoryData.subcategories.map((subcategory) => (
              <button
                key={subcategory.id}
                onClick={() => setSelectedSubcategory(subcategory.id)}
                className={`p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/20 hover:scale-105 text-left group`}
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/20 rounded-xl group-hover:bg-amber-500/30 transition-colors">
                    {subcategory.id === 'books' && <BookOpen className="w-6 h-6 text-amber-400" />}
                    {subcategory.id === 'study-guides' && <FileText className="w-6 h-6 text-amber-400" />}
                    {subcategory.id === 'audio' && <Headphones className="w-6 h-6 text-amber-400" />}
                    {subcategory.id === 'exams' && <ClipboardCheck className="w-6 h-6 text-amber-400" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                      {subcategory.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{subcategory.description}</p>
                    <div className="mt-3 text-amber-400 text-sm font-medium">
                      {subcategory.downloadLinks.length} files available
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Forum Categories
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Choose a category to start participating in our community discussions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`relative overflow-hidden group bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-white/20 text-left ${category.isMaterial ? 'ring-2 ring-amber-500/50 hover:ring-amber-500/70' : ''}`}
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <div 
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-80 transition-opacity duration-300"
                  style={{
                    backgroundImage: `url(${category.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                />
                {/* Dark overlay for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              </div>
              
              {/* Content with overlay title */}
              <div className="relative z-10 h-full min-h-[200px] flex flex-col justify-between p-6">
                {/* Icon at top */}
                <div className={`p-3 rounded-xl bg-gradient-to-r ${category.color} group-hover:scale-110 transition-transform backdrop-blur-sm border border-white/10 self-start`}>
                  {category.isMaterial ? (
                    <div className="relative">
                      <BookOpen className="w-6 h-6 text-amber-400" />
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
                    </div>
                  ) : (
                    category.icon
                  )}
                </div>
                
                {/* Title overlay at bottom */}
                <div className="space-y-2">
                  <h3 className={`text-xl font-bold ${category.isMaterial ? 'text-amber-400' : 'text-white'} group-hover:${category.isMaterial ? 'text-amber-300' : 'text-gray-200'} transition-colors drop-shadow-lg text-center`}>
                    {category.title}
                  </h3>
                  {category.isMaterial && (
                    <div className="text-amber-400 text-sm font-medium flex items-center justify-center gap-2 bg-amber-500/20 backdrop-blur-sm px-3 py-2 rounded-lg border border-amber-500/30">
                      <BookOpen className="w-4 h-4" />
                      Resource Repository
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                category.isMaterial 
                  ? 'shadow-[0_0_30px_rgba(251,191,36,0.3),0_0_60px_rgba(251,191,36,0.1)]' 
                  : 'shadow-[0_0_20px_rgba(255,255,255,0.1),0_0_40px_rgba(255,255,255,0.05)]'
              }`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
