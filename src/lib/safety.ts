import { isSupabaseConfigured, supabase } from './supabase'

export type Visibility = 'public' | 'mentors_only' | 'private'

const memBlocks: { blocker: string; blocked: string }[] = []

export async function blockUser(blockerId: string, blockedId: string, reason?: string): Promise<void> {
  if (blockerId === blockedId) throw new Error('Cannot block yourself.')
  if (!isSupabaseConfigured) {
    if (!memBlocks.some((b) => b.blocker === blockerId && b.blocked === blockedId)) {
      memBlocks.push({ blocker: blockerId, blocked: blockedId })
    }
    return
  }
  const { error } = await supabase.from('user_blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
    reason: reason ?? null,
  })
  if (error && !error.message.includes('duplicate')) throw new Error(error.message)
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  if (!isSupabaseConfigured) {
    const i = memBlocks.findIndex((b) => b.blocker === blockerId && b.blocked === blockedId)
    if (i >= 0) memBlocks.splice(i, 1)
    return
  }
  const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId)
  if (error) throw new Error(error.message)
}

export async function isBlocked(userId: string, otherId: string): Promise<boolean> {
  if (!isSupabaseConfigured) {
    return memBlocks.some(
      (b) => (b.blocker === userId && b.blocked === otherId) || (b.blocker === otherId && b.blocked === userId),
    )
  }
  const { data, error } = await supabase
    .from('user_blocks')
    .select('blocker_id')
    .or(`and(blocker_id.eq.${userId},blocked_id.eq.${otherId}),and(blocker_id.eq.${otherId},blocked_id.eq.${userId})`)
    .limit(1)
  if (error) throw new Error(error.message)
  return (data?.length ?? 0) > 0
}

export async function reportUser(reporterId: string, reportedId: string, reason: string, requestId?: string): Promise<void> {
  if (reporterId === reportedId) throw new Error('Cannot report yourself.')
  if (reason.trim().length < 10) throw new Error('Please describe the issue (at least 10 characters).')
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('user_reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    request_id: requestId ?? null,
    reason: reason.trim(),
  })
  if (error) throw new Error(error.message)
}

export async function updateVisibility(userId: string, visibility: Visibility): Promise<void> {
  if (!isSupabaseConfigured) return
  const { error } = await supabase.from('profiles').update({ visibility }).eq('id', userId)
  if (error) throw new Error(error.message)
}
