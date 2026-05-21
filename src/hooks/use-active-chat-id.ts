import { useEffect } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { db } from '#/lib/ai/persistence/db'

export function useActiveChatId(): {
  chatId: string | null
  setChatId: (id: string | null) => void
} {
  const search = useSearch({ from: '/playground' })
  const navigate = useNavigate()
  const chatId = search.chat ?? null

  useEffect(() => {
    if (chatId) {
      void db.meta.put({ key: 'lastActiveChatId', value: chatId })
      return
    }
    let cancelled = false
    void db.meta.get('lastActiveChatId').then(async (row) => {
      if (cancelled || !row) return
      const exists = await db.chats.get(row.value)
      if (!exists) return
      void navigate({
        to: '/playground',
        search: { chat: row.value },
        replace: true,
      })
    })
    return () => {
      cancelled = true
    }
  }, [chatId, navigate])

  function setChatId(id: string | null) {
    void navigate({
      to: '/playground',
      search: id ? { chat: id } : {},
      replace: false,
    })
  }

  return { chatId, setChatId }
}
