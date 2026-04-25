import ApiService from './ApiService'
import type { ChatMessage, ChatThread, ChatThreadScope } from '@/@types/chat'

type PaginationMeta = {
    current_page: number
    last_page: number
    per_page: number
    total: number
}

export type ChatThreadsResponse = {
    data: ChatThread[]
    meta?: PaginationMeta
}

export async function apiListChatThreads(params: {
    scope?: ChatThreadScope
    agencySlug?: string
}) {
    const search = new URLSearchParams()
    if (params.scope) search.set('scope', params.scope)
    if (params.agencySlug) search.set('agency_slug', params.agencySlug)

    const query = search.toString()
    return ApiService.fetchDataWithAxios<ChatThreadsResponse>({
        url: `/chat/threads${query ? `?${query}` : ''}`,
        method: 'get',
    })
}

export async function apiGetThreadMessages(params: {
    threadId: number
    limit?: number
    beforeId?: number
    afterId?: number
}) {
    const search = new URLSearchParams()
    if (params.limit) search.set('limit', String(params.limit))
    if (params.beforeId) search.set('before_id', String(params.beforeId))
    if (params.afterId) search.set('after_id', String(params.afterId))

    const query = search.toString()
    return ApiService.fetchDataWithAxios<{ data: ChatMessage[] }>({
        url: `/chat/threads/${params.threadId}/messages${query ? `?${query}` : ''}`,
        method: 'get',
    })
}

export async function apiSendThreadMessage(threadId: number, body: string) {
    return ApiService.fetchDataWithAxios<{ data: ChatMessage }>({
        url: `/chat/threads/${threadId}/messages`,
        method: 'post',
        data: { body },
    })
}

export async function apiMarkThreadRead(threadId: number, messageId: number) {
    return ApiService.fetchDataWithAxios<{ success: boolean }>({
        url: `/chat/threads/${threadId}/read`,
        method: 'post',
        data: { message_id: messageId },
    })
}

