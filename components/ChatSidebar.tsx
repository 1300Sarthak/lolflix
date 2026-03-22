"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Copy, Check, Users, MessageCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserBadge } from "@/components/UserBadge"
import type { ChatMessage, RoomUser } from "@/types"

interface ChatSidebarProps {
  userName: string
  messages: ChatMessage[]
  onSendMessage: (msg: string) => void
  users: RoomUser[]
  roomCode: string
  mediaTitle?: string
  mediaOverview?: string
}

export function ChatSidebar({
  userName,
  messages,
  onSendMessage,
  users,
  roomCode,
  mediaTitle,
  mediaOverview,
}: ChatSidebarProps) {
  const [input, setInput] = useState("")
  const [copied, setCopied] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = () => {
    const msg = input.trim()
    if (!msg) return
    onSendMessage(msg)
    setInput("")
  }

  const handleCopy = async () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL}/watch?room=${roomCode}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-card">
      <div className="p-3 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Room Code
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="h-7 gap-1.5 text-xs"
          >
            {copied ? (
              <Check className="h-3 w-3 text-green-500" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
        </div>
        <code className="block text-center text-lg font-bold tracking-[0.3em] text-primary">
          {roomCode}
        </code>
      </div>

      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full rounded-none border-b border-border bg-transparent h-10 p-0">
          <TabsTrigger value="chat" className="flex-1 gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            <MessageCircle className="h-3.5 w-3.5" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="users" className="flex-1 gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            <Users className="h-3.5 w-3.5" />
            Users ({users.length})
          </TabsTrigger>
          <TabsTrigger value="info" className="flex-1 gap-1.5 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
            <Info className="h-3.5 w-3.5" />
            Info
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Say hi!
              </p>
            )}
            {messages.map((msg) => (
              <div key={msg.id}>
                {msg.isSystem ? (
                  <p className="text-xs text-center text-muted-foreground italic py-1">
                    {msg.message}
                  </p>
                ) : (
                  <div className="space-y-0.5">
                    <div className="flex items-baseline gap-2">
                      <span className={`text-xs font-semibold ${
                        msg.userName === userName ? "text-primary" : "text-foreground"
                      }`}>
                        {msg.userName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 break-words">
                      {msg.message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <Separator />
          <div className="p-3 flex gap-2">
            <Input
              placeholder="Type a message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="h-9 text-sm"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="h-9 w-9 shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="users" className="flex-1 m-0 overflow-y-auto">
          <div className="p-3 space-y-1">
            {users.map((user) => (
              <UserBadge key={user.id} user={user} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="info" className="flex-1 m-0 overflow-y-auto">
          <div className="p-4 space-y-3">
            {mediaTitle && (
              <>
                <h3 className="font-semibold text-foreground">{mediaTitle}</h3>
                {mediaOverview && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mediaOverview}
                  </p>
                )}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
