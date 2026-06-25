"use client"

import { useState } from "react"
import { use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  User, 
  MessageCircle,
  ArrowLeft,
  Heart,
  Home
} from "lucide-react"
import { ProfileHeader } from "@/components/profile/ProfileHeader"
import { MemberChat } from "@/components/profile/StudentChat"
import { PracticeInfo } from "@/components/profile/ClassInfo"
import { getStudentById, currentUser, Student } from "@/lib/mock-data"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function Page({ params }: PageProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'chat'>('overview')
  const [showNotification, setShowNotification] = useState(false)
  const [userBio, setUserBio] = useState("")
  
  const resolvedParams = use(params)
  const profileId = String(resolvedParams.id)
  const profileData = getStudentById(profileId)
  const isOwnProfile = profileId === 'current'

  const handleConnect = () => {
    setShowNotification(true)
    setTimeout(() => {
      setShowNotification(false)
    }, 3000)
  }

  const handleMessage = () => {
    setActiveTab('chat')
  }

  const handleGoBack = () => {
    if (window.history.length > 2) {
      window.history.back()
    } else {
      router.push('/community')
    }
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Perfil no encontrado
          </h2>
          <p className="text-gray-500 mb-4">
            El perfil que buscas no existe o no está disponible.
          </p>
          <button
            onClick={handleGoBack}
            className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium shadow-lg">
          ¡Amistad solicitada!
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={handleGoBack}
                className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <Link
                href="/"
                className="p-2 rounded-xl bg-purple-100 text-purple-600 hover:bg-purple-200 transition-colors"
                title="Volver al Inicio"
              >
                <Home className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {isOwnProfile ? 'Mi Perfil' : `Perfil de ${profileData.nombre}`}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {isOwnProfile ? "Tu espacio personal" : "Perfil público"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                <>
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === 'overview' 
                        ? "bg-purple-600 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <User className="w-4 h-4 inline mr-2" />
                    Resumen
                  </button>
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === 'chat' 
                        ? "bg-purple-600 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Chat
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleConnect}
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
                  >
                    <Heart className="w-4 h-4 inline mr-2" />
                    Conectar
                  </button>
                  <button
                    onClick={handleMessage}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4 inline mr-2" />
                    Mensaje
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-1 space-y-6">
            <ProfileHeader
              userName={profileData.nombre}
              userBio={profileData.bio}
              onBioUpdate={setUserBio}
              isEditable={isOwnProfile}
            />
            
            {/* Interests */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200">
              <h3 className="font-bold text-gray-900 mb-4">Intereses</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Generales:</p>
                <div className="flex flex-wrap gap-2">
                  {profileData.interesesGenerales.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Específicos:</p>
                <div className="flex flex-wrap gap-2">
                  {profileData.interesesEspecificos.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Chat and Info */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'overview' ? (
              <>
                {/* Chat */}
                <MemberChat
                  memberName={profileData.nombre}
                  mentorName={isOwnProfile ? "Prof. Sarah Mitchell" : profileData.nombre}
                  isCommunityChat={!isOwnProfile}
                />
                
                {/* Practice Info */}
                {isOwnProfile && (
                  <PracticeInfo
                    evaluationStatus="pending"
                    practiceDay="Martes"
                    practiceTime="19:00"
                    mentorName="Prof. Sarah Mitchell"
                    practiceName="Academy B1"
                  />
                )}
              </>
            ) : (
              /* Chat Full Screen */
              <div className="space-y-6">
                <MemberChat
                  memberName={profileData.nombre}
                  mentorName={isOwnProfile ? "Prof. Sarah Mitchell" : profileData.nombre}
                  isCommunityChat={!isOwnProfile}
                />
                
                {isOwnProfile && (
                  <div className="lg:hidden">
                    <PracticeInfo
                      evaluationStatus="pending"
                      practiceDay="Martes"
                      practiceTime="19:00"
                      mentorName="Prof. Sarah Mitchell"
                      practiceName="Academy B1"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
