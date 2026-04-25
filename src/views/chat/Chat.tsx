import { Avatar, Badge, Button, Card, Input, Spinner, Tabs } from '@/components/ui'
import { useSessionUser } from '@/store/authStore'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMessage, ChatThread, ChatThreadScope } from '@/@types/chat'
import {
    apiGetThreadMessages,
    apiGetOrCreateThread,
    apiListChatThreads,
    apiMarkThreadRead,
    apiSendThreadMessage,
} from '@/services/ChatService'
import { useSearchParams } from 'react-router'

const { TabList, TabNav, TabContent } = Tabs

const POLL_INTERVAL_MS = 5000

function safeDateLabel(date: string | null | undefined) {
    if (!date) return '-'
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return date
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d)
}

export default function Chat() {
    const me = useSessionUser((s) => s.user)
    const myUserId = useMemo(() => {
        return typeof me?.id === 'number' ? me.id : null
    }, [me?.id])

    const [scope, setScope] = useState<ChatThreadScope>('upcoming')
    const [threads, setThreads] = useState<ChatThread[]>([])
    const [pinnedThread, setPinnedThread] = useState<ChatThread | null>(null)
    const [threadsLoading, setThreadsLoading] = useState(false)
    const [threadsError, setThreadsError] = useState<string | null>(null)
    const [searchParams] = useSearchParams()

    const [selectedThreadId, setSelectedThreadId] = useState<number | null>(null)
    const selectedThread = useMemo(() => {
        return threads.find((t) => t.id === selectedThreadId) || null
    }, [threads, selectedThreadId])

    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [messagesError, setMessagesError] = useState<string | null>(null)
    const [composer, setComposer] = useState('')
    const [sending, setSending] = useState(false)

    const pollTimerRef = useRef<number | null>(null)

    const fetchThreads = async (nextScope: ChatThreadScope) => {
        setThreadsLoading(true)
        setThreadsError(null)
        try {
            const resp = await apiListChatThreads({ scope: nextScope })
            const fromApi = resp?.data ?? []
            const merged = pinnedThread
                ? [
                      pinnedThread,
                      ...fromApi.filter((t) => t.id !== pinnedThread.id),
                  ]
                : fromApi
            setThreads(merged)
            const first = merged[0]
            setSelectedThreadId((prev) => {
                if (prev && merged.some((t) => t.id === prev)) return prev
                return first?.id ?? null
            })
        } catch {
            setThreadsError('تعذر تحميل المحادثات')
            setThreads([])
            setSelectedThreadId(null)
        } finally {
            setThreadsLoading(false)
        }
    }

    const loadInitialMessages = async (threadId: number) => {
        setMessagesLoading(true)
        setMessagesError(null)
        try {
            const resp = await apiGetThreadMessages({ threadId, limit: 30 })
            const list = resp?.data ?? []
            setMessages(list)
            const lastId = list.length ? list[list.length - 1].id : null
            if (lastId) {
                await apiMarkThreadRead(threadId, lastId)
                setThreads((prev) =>
                    prev.map((t) =>
                        t.id === threadId ? { ...t, has_unread: false } : t,
                    ),
                )
            }
        } catch {
            setMessagesError('تعذر تحميل الرسائل')
            setMessages([])
        } finally {
            setMessagesLoading(false)
        }
    }

    const pollNewMessages = async (threadId: number) => {
        const lastId = messages.length ? messages[messages.length - 1].id : null
        if (!lastId) return

        try {
            const resp = await apiGetThreadMessages({
                threadId,
                afterId: lastId,
                limit: 50,
            })
            const newItems = resp?.data ?? []
            if (!newItems.length) return

            setMessages((prev) => {
                const existingIds = new Set(prev.map((m) => m.id))
                const merged = [...prev]
                for (const msg of newItems) {
                    if (!existingIds.has(msg.id)) {
                        merged.push(msg)
                    }
                }
                return merged
            })

            const newestId = newItems[newItems.length - 1]?.id
            if (newestId) {
                await apiMarkThreadRead(threadId, newestId)
                setThreads((prev) =>
                    prev.map((t) =>
                        t.id === threadId ? { ...t, has_unread: false } : t,
                    ),
                )
            }
        } catch {
            // silent polling errors
        }
    }

    useEffect(() => {
        void fetchThreads(scope)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scope])

    useEffect(() => {
        const raw = searchParams.get('reservation_id')?.trim() ?? ''
        const reservationId = raw && /^\d+$/.test(raw) ? Number(raw) : null
        if (!reservationId) return

        setScope('all')
        ;(async () => {
            try {
                const resp = await apiGetOrCreateThread(reservationId)
                const thread = resp?.data
                if (!thread) return

                setPinnedThread(thread)
                setThreads((prev) => [
                    thread,
                    ...prev.filter((t) => t.id !== thread.id),
                ])
                setSelectedThreadId(thread.id)
            } catch {
                // ignore deep-link failures
            }
        })()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams])

    useEffect(() => {
        if (pollTimerRef.current) {
            window.clearInterval(pollTimerRef.current)
            pollTimerRef.current = null
        }

        if (!selectedThreadId) {
            setMessages([])
            return
        }

        setMessages([])
        void loadInitialMessages(selectedThreadId)

        pollTimerRef.current = window.setInterval(() => {
            if (selectedThreadId) {
                void pollNewMessages(selectedThreadId)
            }
        }, POLL_INTERVAL_MS)

        return () => {
            if (pollTimerRef.current) {
                window.clearInterval(pollTimerRef.current)
                pollTimerRef.current = null
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedThreadId])

    const onSend = async () => {
        const threadId = selectedThreadId
        if (!threadId) return
        const body = composer.trim()
        if (!body) return

        setSending(true)
        try {
            const resp = await apiSendThreadMessage(threadId, body)
            const msg = resp?.data
            if (msg) {
                setMessages((prev) => [...prev, msg])
                setComposer('')
                setThreads((prev) =>
                    prev.map((t) =>
                        t.id === threadId
                            ? {
                                  ...t,
                                  last_message_id: msg.id,
                                  last_message_at: msg.created_at,
                                  has_unread: false,
                                  last_message: {
                                      id: msg.id,
                                      sender_user_id: msg.sender_user_id,
                                      body: msg.body,
                                      created_at: msg.created_at,
                                  },
                              }
                            : t,
                    ),
                )
            }
        } finally {
            setSending(false)
        }
    }

    return (
        <Card className="h-[calc(100vh-140px)]">
            <div className="mb-4">
                <h2 className="text-xl font-bold">المحادثات</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    تواصل مع العملاء بخصوص مواعيدهم وحجوزاتهم
                </p>
            </div>

            <Tabs value={scope} onChange={(v) => setScope(v as ChatThreadScope)}>
                <TabList className="mb-4">
                    <TabNav value="upcoming">القادمة</TabNav>
                    <TabNav value="past">السابقة</TabNav>
                    <TabNav value="all">الكل</TabNav>
                </TabList>

                <TabContent value={scope} className="h-full">
                    <div className="grid grid-cols-12 gap-4 h-full">
                        <div className="col-span-12 md:col-span-4 h-full overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                            <div className="h-full overflow-y-auto">
                                {threadsLoading ? (
                                    <div className="p-6 flex items-center justify-center gap-2">
                                        <Spinner />
                                        <span>جاري التحميل…</span>
                                    </div>
                                ) : threadsError ? (
                                    <div className="p-6 text-red-600 dark:text-red-400">
                                        {threadsError}
                                    </div>
                                ) : threads.length === 0 ? (
                                    <div className="p-6 text-gray-500">
                                        لا توجد محادثات بعد.
                                    </div>
                                ) : (
                                    <div>
                                        {threads.map((t) => {
                                            const active = t.id === selectedThreadId
                                            const customerName =
                                                t.customer?.name ||
                                                t.customer?.mobile ||
                                                'Customer'
                                            const lastPreview =
                                                t.last_message?.body?.slice(0, 80) ||
                                                '—'
                                            return (
                                                <button
                                                    key={t.id}
                                                    className={`w-full text-right p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer ${
                                                        active
                                                            ? 'bg-gray-50 dark:bg-gray-800/60'
                                                            : ''
                                                    }`}
                                                    onClick={() =>
                                                        setSelectedThreadId(t.id)
                                                    }
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Avatar
                                                                src="/img/avatars/thumb-1.jpg"
                                                                alt={customerName}
                                                                className="w-10 h-10"
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="font-semibold truncate">
                                                                    {customerName}
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {safeDateLabel(
                                                                        t.reservation
                                                                            ?.date,
                                                                    )}{' '}
                                                                    •{' '}
                                                                    {t.reservation
                                                                        ?.start_time ?? '-'}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {t.has_unread ? (
                                                            <Badge className="bg-indigo-600 text-white">
                                                                جديد
                                                            </Badge>
                                                        ) : null}
                                                    </div>

                                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 truncate">
                                                        {lastPreview}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-8 h-full overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl flex flex-col">
                            {!selectedThread ? (
                                <div className="p-6 text-gray-500">
                                    اختر محادثة من القائمة.
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <div className="font-semibold truncate">
                                                {selectedThread.customer?.name ||
                                                    selectedThread.customer?.mobile ||
                                                    'Customer'}
                                            </div>
                                            <div className="text-xs text-gray-500 truncate">
                                                {selectedThread.service?.title ??
                                                    '—'}{' '}
                                                •{' '}
                                                {safeDateLabel(
                                                    selectedThread.reservation
                                                        ?.date,
                                                )}{' '}
                                                •{' '}
                                                {selectedThread.reservation
                                                    ?.start_time ?? '-'}{' '}
                                                -{' '}
                                                {selectedThread.reservation
                                                    ?.end_time ?? '-'}
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {selectedThread.reservation?.status ??
                                                '-'}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/30">
                                        {messagesLoading ? (
                                            <div className="p-6 flex items-center justify-center gap-2">
                                                <Spinner />
                                                <span>جاري التحميل…</span>
                                            </div>
                                        ) : messagesError ? (
                                            <div className="text-red-600 dark:text-red-400">
                                                {messagesError}
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-gray-500">
                                                لا توجد رسائل بعد.
                                            </div>
                                        ) : (
                                            messages.map((m) => {
                                                const mine =
                                                    myUserId !== null &&
                                                    m.sender_user_id ===
                                                        myUserId
                                                return (
                                                    <div
                                                        key={m.id}
                                                        className={`flex ${
                                                            mine
                                                                ? 'justify-end'
                                                                : 'justify-start'
                                                        }`}
                                                    >
                                                        <div
                                                            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                                                                mine
                                                                    ? 'bg-indigo-600 text-white'
                                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                                            }`}
                                                        >
                                                            <div className="whitespace-pre-wrap break-words">
                                                                {m.body}
                                                            </div>
                                                            <div
                                                                className={`mt-1 text-[11px] ${
                                                                    mine
                                                                        ? 'text-indigo-100'
                                                                        : 'text-gray-400'
                                                                }`}
                                                            >
                                                                {m.created_at
                                                                    ? new Date(
                                                                          m.created_at,
                                                                      ).toLocaleTimeString(
                                                                          'ar-SA',
                                                                          {
                                                                              hour: '2-digit',
                                                                              minute: '2-digit',
                                                                          },
                                                                      )
                                                                    : ''}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })
                                        )}
                                    </div>

                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
                                        <Input
                                            value={composer}
                                            onChange={(e) =>
                                                setComposer(e.target.value)
                                            }
                                            placeholder="اكتب رسالة…"
                                            disabled={sending}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault()
                                                    void onSend()
                                                }
                                            }}
                                        />
                                        <Button
                                            variant="solid"
                                            disabled={sending || !composer.trim()}
                                            onClick={() => void onSend()}
                                        >
                                            إرسال
                                        </Button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </TabContent>
            </Tabs>
        </Card>
    )
}
