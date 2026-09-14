import { supabase } from './supabase'
import { API_URL }  from '../utils/constants'

export async function submitClaim({ itemId, claimantId, verificationAnswer }, accessToken) {
  const res = await fetch(`${API_URL}/api/claims`, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ item_id: itemId, claimant_id: claimantId, verification_answer: verificationAnswer }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to submit claim')
  return json
}

export async function fetchMyClaims(userId) {
  const { data, error } = await supabase
    .from('claims')
    .select(`
      *,
      item:item_id (id, item_name, category, location, image_url, item_type)
    `)
    .eq('claimant_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchAllClaims(accessToken) {
  const res = await fetch(`${API_URL}/api/admin/claims`, {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to fetch claims')
  return json.claims || []
}

export async function updateClaimStatus({ claimId, status, adminNotes }, accessToken) {
  const res = await fetch(`${API_URL}/api/admin/claims/${claimId}`, {
    method:  'PUT',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Failed to update claim')
  return json
}
