import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send, ArrowLeft, User, Search } from 'lucide-react'
import api from '@/lib/api'

interface Conversation {
  id: string
  user_id: string
  user_name: string
  user_email: string
  user_avatar: string | null
  last_message: string | null
  last_message_at_real: string | null
  unread_count: number
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_avatar: string | null
  content: string
  is_read: boolean
  created_at: string
}

const SUPPORT_USER_ID = '7971d9bd-6e88-47da-af1f-0936dc5a038f'

export default function Support() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 10000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConvo) {
      fetchMessages(selectedConvo.id)
      const interval = setInterval(() => fetchMessages(selectedConvo.id), 5000)
      return () => clearInterval(interval)
    }
  }, [selectedConvo?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const fetchConversations = async () => {
    try {
      const res: any = await api.get('/messages/admin/conversations')
      if (res.success) {
        setConversations(res.conversations || [])
      }
    } catch (error) {
      console.error('Error fetching conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMessages = async (convoId: string) => {
    try {
      const res: any = await api.get(`/messages/admin/conversations/${convoId}/messages`)
      if (res.success) {
        setMessages(res.messages || [])
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvo || sending) return

    setSending(true)
    try {
      const res: any = await api.post(`/messages/admin/conversations/${selectedConvo.id}/messages`, {
        content: newMessage.trim()
      })
      if (res.success) {
        setMessages(prev => [...prev, { ...res.message, sender_name: 'Largô Suporte', sender_avatar: null }])
        setNewMessage('')
        inputRef.current?.focus()
        fetchConversations()
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)

    if (diffHours < 24) {
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    }
    if (diffHours < 48) return 'Ontem'
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  }

  const totalUnread = conversations.reduce((sum, c) => sum + (parseInt(String(c.unread_count)) || 0), 0)

  const filteredConvos = conversations.filter(c =>
    !search || c.user_name?.toLowerCase().includes(search.toLowerCase()) || c.user_email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suporte</h1>
        <p className="text-gray-500">Chat com usuários do app</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{conversations.length}</p>
            <p className="text-sm text-gray-500">Conversas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{totalUnread}</p>
            <p className="text-sm text-gray-500">Não lidas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{conversations.length - totalUnread}</p>
            <p className="text-sm text-gray-500">Respondidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <Card className="overflow-hidden">
        <div className="flex" style={{ height: '600px' }}>
          {/* Conversations List */}
          <div className={`w-80 border-r flex flex-col ${selectedConvo ? 'hidden md:flex' : 'flex w-full md:w-80'}`}>
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar conversas..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-400">Carregando...</div>
              ) : filteredConvos.length === 0 ? (
                <div className="p-8 text-center text-gray-400">
                  <MessageCircle className="mx-auto h-12 w-12 mb-2 opacity-30" />
                  <p>Nenhuma conversa</p>
                </div>
              ) : (
                filteredConvos.map((convo) => (
                  <button
                    key={convo.id}
                    onClick={() => { setSelectedConvo(convo); setLoadingMessages(true); }}
                    className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition border-b text-left ${
                      selectedConvo?.id === convo.id ? 'bg-orange-50' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {convo.user_avatar ? (
                        <img src={convo.user_avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm truncate">{convo.user_name || 'Usuário'}</p>
                        {convo.last_message_at_real && (
                          <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                            {formatTime(convo.last_message_at_real)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{convo.user_email}</p>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{convo.last_message || 'Sem mensagens'}</p>
                    </div>
                    {parseInt(String(convo.unread_count)) > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                        {convo.unread_count}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!selectedConvo ? 'hidden md:flex' : 'flex'}`}>
            {selectedConvo ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b flex items-center gap-3 bg-white">
                  <button
                    onClick={() => setSelectedConvo(null)}
                    className="md:hidden p-1 hover:bg-gray-100 rounded"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {selectedConvo.user_avatar ? (
                      <img src={selectedConvo.user_avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{selectedConvo.user_name}</p>
                    <p className="text-xs text-gray-500">{selectedConvo.user_email}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {loadingMessages ? (
                    <div className="text-center text-gray-400 py-8">Carregando mensagens...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">Nenhuma mensagem ainda</div>
                  ) : (
                    messages.map((msg) => {
                      const isSupport = msg.sender_id === SUPPORT_USER_ID
                      return (
                        <div key={msg.id} className={`flex ${isSupport ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              isSupport
                                ? 'bg-orange-500 text-white rounded-br-sm'
                                : 'bg-white border rounded-bl-sm'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isSupport ? 'text-orange-100' : 'text-gray-400'}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-white flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Digite sua resposta..."
                    className="flex-1 px-4 py-2.5 border rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    disabled={sending}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="mx-auto h-16 w-16 mb-4 opacity-20" />
                  <p className="text-lg">Selecione uma conversa</p>
                  <p className="text-sm">As mensagens de suporte aparecerão aqui</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
