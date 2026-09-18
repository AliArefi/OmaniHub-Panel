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
import useTranslation from '@/utils/hooks/useTranslation'

const { TabList, TabNav, TabContent } = Tabs

const POLL_INTERVAL_MS = 5000

function safeDateLabel(date: string | null | undefined, locale: string) {
    if (!date) return '-'
    const d = new Date(date)
    if (Number.isNaN(d.getTime())) return date
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-OM', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d)
}

function getThreadTitle(thread: ChatThread, fallback: string) {
    return thread.agency?.title || thread.service?.title || fallback
}

function getThreadMeta(thread: ChatThread, locale: string) {
    const parts = [
        thread.service?.title || null,
        safeDateLabel(thread.reservation?.date, locale),
        thread.reservation?.start_time
            ? `${thread.reservation.start_time} - ${thread.reservation?.end_time ?? '-'}`
            : null,
    ].filter(Boolean)

    return parts.join(' • ') || '-'
}

function getThreadCustomerMeta(thread: ChatThread) {
    return (
        thread.customer?.email ||
        thread.customer?.name ||
        thread.customer?.mobile ||
        '-'
    )
}

export default function Chat() {
    const { t, i18n } = useTranslation()
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
    const messagesEndRef = useRef<HTMLDivElement | null>(null)
    const activeThreadIdRef = useRef<number | null>(null)
    const messagesRef = useRef<ChatMessage[]>([])

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
            setThreadsError(t('chat.loadThreadsError'))
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
            if (activeThreadIdRef.current !== threadId) return
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
            if (activeThreadIdRef.current !== threadId) return
            setMessagesError(t('chat.loadMessagesError'))
            setMessages([])
        } finally {
            if (activeThreadIdRef.current === threadId) {
                setMessagesLoading(false)
            }
        }
    }

    const pollNewMessages = async (threadId: number) => {
        const currentMessages = messagesRef.current
        const lastId = currentMessages.length
            ? currentMessages[currentMessages.length - 1].id
            : null
        if (!lastId) return

        try {
            const resp = await apiGetThreadMessages({
                threadId,
                afterId: lastId,
                limit: 50,
            })
            if (activeThreadIdRef.current !== threadId) return
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
    }, [scope, t])

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
         
    }, [searchParams])

    useEffect(() => {
        if (pollTimerRef.current) {
            window.clearInterval(pollTimerRef.current)
            pollTimerRef.current = null
        }

        if (!selectedThreadId) {
            activeThreadIdRef.current = null
            messagesRef.current = []
            setMessages([])
            return
        }

        activeThreadIdRef.current = selectedThreadId
        messagesRef.current = []
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
    }, [selectedThreadId])

    const onSend = async () => {
        const threadId = selectedThreadId
        if (!threadId) return
        const body = composer.trim()
        if (!body) return

        setSending(true)
        setMessagesError(null)
        try {
            const resp = await apiSendThreadMessage(threadId, body)
            const msg = resp?.data
            if (msg) {
                if (activeThreadIdRef.current === threadId) {
                    setMessages((prev) => [...prev, msg])
                    setComposer('')
                }
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
        } catch {
            setMessagesError(t('chat.sendError'))
        } finally {
            setSending(false)
        }
    }

    useEffect(() => {
        messagesRef.current = messages
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    return (
        <Card className="h-[calc(100vh-140px)]">
            <div className="mb-4">
                <h2 className="text-xl font-bold">{t('chat.title')}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('chat.subtitle')}
                </p>
            </div>

            <Tabs value={scope} onChange={(v) => setScope(v as ChatThreadScope)}>
                <TabList className="mb-4">
                    <TabNav value="upcoming">{t('chat.upcoming')}</TabNav>
                    <TabNav value="past">{t('chat.past')}</TabNav>
                    <TabNav value="all">{t('chat.all')}</TabNav>
                </TabList>

                <TabContent value={scope} className="h-full">
                    <div className="grid grid-cols-12 gap-4 h-full">
                        <div className="col-span-12 md:col-span-4 h-full overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                            <div className="h-full overflow-y-auto">
                                {threadsLoading ? (
                                    <div className="p-6 flex items-center justify-center gap-2">
                                        <Spinner />
                                        <span>{t('chat.loading')}</span>
                                    </div>
                                ) : threadsError ? (
                                    <div className="p-6 text-red-600 dark:text-red-400">
                                        {threadsError}
                                    </div>
                                ) : threads.length === 0 ? (
                                    <div className="p-6 text-gray-500">
                                        {t('chat.emptyThreads')}
                                    </div>
                                ) : (
                                    <div>
                                        {threads.map((thread) => {
                                            const active = thread.id === selectedThreadId
                                            const threadTitle = getThreadTitle(thread, t('chat.defaultTitle'))
                                            const lastPreview =
                                                thread.last_message?.body?.slice(0, 80) ||
                                                '—'
                                            return (
                                                <button
                                                    key={thread.id}
                                                    className={`w-full text-right p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors cursor-pointer ${
                                                        active
                                                            ? 'bg-gray-50 dark:bg-gray-800/60'
                                                            : ''
                                                    }`}
                                                    onClick={() =>
                                                        setSelectedThreadId(thread.id)
                                                    }
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Avatar
                                                                src={thread.agency?.logo || undefined}
                                                                alt={threadTitle}
                                                                className="w-10 h-10"
                                                            />
                                                            <div className="min-w-0">
                                                                <div className="font-semibold truncate">
                                                                    {threadTitle}
                                                                </div>
                                                                <div className="text-xs text-gray-500 truncate">
                                                                    {getThreadMeta(thread, i18n.language)}
                                                                </div>
                                                                <div className="text-xs text-gray-400 truncate">
                                                                    {getThreadCustomerMeta(thread)}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {thread.has_unread ? (
                                                            <Badge className="bg-indigo-600 text-white">
                                                                {t('chat.new')}
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
                                    {t('chat.selectThread')}
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between gap-4">
                                        <div className="flex min-w-0 items-center gap-3">
                                            <Avatar
                                                src={
                                                    selectedThread.agency?.logo ||
                                                    undefined
                                                }
                                                alt={getThreadTitle(selectedThread, t('chat.defaultTitle'))}
                                                className="h-11 w-11 shrink-0"
                                            />
                                            <div className="min-w-0">
                                                <div className="font-semibold truncate">
                                                    {getThreadTitle(selectedThread, t('chat.defaultTitle'))}
                                                </div>
                                                <div className="text-xs text-gray-500 truncate">
                                                    {getThreadMeta(selectedThread, i18n.language)}
                                                </div>
                                                <div className="text-xs text-gray-400 truncate">
                                                    {getThreadCustomerMeta(
                                                        selectedThread,
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {selectedThread.reservation?.status ??
                                                '-'}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/30">
                                        {messagesLoading ? (
                                            <div className="p-6 flex items-center justify-center gap-2">
                                                <Spinner />
                                                <span>{t('chat.loading')}</span>
                                            </div>
                                        ) : messagesError ? (
                                            <div className="text-red-600 dark:text-red-400">
                                                {messagesError}
                                            </div>
                                        ) : messages.length === 0 ? (
                                            <div className="text-gray-500">
                                                {t('chat.emptyMessages')}
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
                                                        className={`flex items-end gap-2 ${
                                                            mine
                                                                ? 'flex-row-reverse justify-start'
                                                                : 'justify-start'
                                                        }`}
                                                    >
                                                        <Avatar
                                                            src={m.sender?.avatar || undefined}
                                                            alt={m.sender?.name || t('chat.defaultUser')}
                                                            className="h-9 w-9 shrink-0"
                                                        />
                                                        <div
                                                            className={`max-w-[75%] px-4 py-2.5 text-sm shadow-sm ${
                                                                mine
                                                                    ? 'rounded-2xl rounded-br-sm bg-primary text-white'
                                                                    : 'rounded-2xl rounded-bl-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                                                            }`}
                                                        >
                                                            {!mine && m.sender?.name ? (
                                                                <div className="mb-1 text-xs font-semibold text-primary">
                                                                    {m.sender.name}
                                                                </div>
                                                            ) : null}
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
                                                                          i18n.language === 'ar' ? 'ar-OM' : 'en-OM',
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
                                        <div ref={messagesEndRef} />
                                    </div>

                                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3 bg-white dark:bg-gray-800">
                                        <Input
                                            value={composer}
                                            placeholder={t('chat.messagePlaceholder')}
                                            disabled={sending}
                                            onChange={(e) =>
                                                setComposer(e.target.value)
                                            }
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
                                            {t('chat.send')}
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
