import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchItems } from '../services/itemsService'
import { useModal } from '../context/ModalContext'
import { CATEGORIES, LOCATIONS } from '../utils/constants'
import { debounce } from '../utils/helpers'
import ItemCard from '../components/items/ItemCard'
import { SkeletonGrid } from '../components/ui/SkeletonCard'
import EmptyState from '../components/ui/EmptyState'
import Button from '../components/ui/Button'

const PAGE_SIZE = 12

export default function FindItemsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { openModal } = useModal()

  const [items,    setItems]    = useState([])
  const [total,    setTotal]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // Filter state — initialise from URL params (supports deep-linking)
  const [query,    setQuery]    = useState(searchParams.get('q')        || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')
  const [itemType, setItemType] = useState(searchParams.get('type')     || '')
  const [status,   setStatus]   = useState(searchParams.get('status')   || '')

  const searchRef = useRef(null)

  const load = useCallback(async (pg = 1, reset = false) => {
    setLoading(true)
    setError('')
    try {
      const { items: data, count } = await fetchItems({
        query, category, location, itemType, status,
        page: pg, limit: PAGE_SIZE,
      })
      setItems(prev => reset ? data : [...prev, ...data])
      setTotal(count ?? 0)
      setPage(pg)
    } catch (e) {
      setError(e.message || 'Failed to load items.')
    } finally {
      setLoading(false)
    }
  }, [query, category, location, itemType, status])

  // Initial load + when filters change
  useEffect(() => { load(1, true) }, [query, category, location, itemType, status]) // eslint-disable-line

  // Sync URL params when filters change
  useEffect(() => {
    const p = {}
    if (query)    p.q        = query
    if (category) p.category = category
    if (location) p.location = location
    if (itemType) p.type     = itemType
    if (status)   p.status   = status
    setSearchParams(p, { replace: true })
  }, [query, category, location, itemType, status]) // eslint-disable-line

  const debouncedQuery = useCallback(
    debounce((v) => setQuery(v), 350),
    []
  )

  function clearFilters() {
    setQuery(''); setCategory(''); setLocation(''); setItemType(''); setStatus('')
    if (searchRef.current) searchRef.current.value = ''
  }

  const hasMore    = items.length < total
  const hasFilters = query || category || location || itemType || status

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>🔍 Find My Item</h2>
        <p>Search through all reported lost and found items on campus.</p>
      </div>

      {/* Search + Filters */}
      <div className="search-bar-area">
        <div className="search-input-wrap">
          <span className="search-icon text-xl">🔍</span>
          <input
            ref={searchRef}
            type="text"
            defaultValue={query}
            placeholder="Search by item name, description, color…"
            onChange={e => debouncedQuery(e.target.value)}
            className="flex-1 border-none bg-transparent text-sm outline-none text-[#1e1b4b] placeholder:text-[#9ca3af]"
          />
          {query && (
            <button onClick={() => { setQuery(''); if (searchRef.current) searchRef.current.value = '' }} className="text-[#9ca3af] hover:text-[#4f46e5] text-sm">✕</button>
          )}
        </div>

        <div className="filter-row">
          <select value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">All Categories</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>

          <select value={location} onChange={e => setLocation(e.target.value)}>
            <option value="">All Locations</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>

          <select value={itemType} onChange={e => setItemType(e.target.value)}>
            <option value="">Lost &amp; Found</option>
            <option value="lost">🔴 Lost Only</option>
            <option value="found">🟢 Found Only</option>
          </select>

          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="matched">Matched</option>
            <option value="recovered">Recovered</option>
          </select>

          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={clearFilters}>✖ Clear</Button>
          )}
        </div>
      </div>

      {/* Results info */}
      {!loading && (
        <p className="results-info">
          {total > 0
            ? `${total} item${total !== 1 ? 's' : ''} found${hasFilters ? ' (filtered)' : ''}`
            : ''}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#fee2e2] border border-[#fca5a5] text-[#b91c1c] rounded-[10px] px-4 py-3 mb-4 text-sm">
          {error} — <button onClick={() => load(1, true)} className="underline font-semibold">Retry</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && items.length === 0 && <SkeletonGrid count={6} />}

      {/* Results */}
      {!loading && items.length === 0 && !error && (
        <EmptyState
          icon="🕵️"
          title="No items found"
          description={hasFilters ? 'Try adjusting your search or filters.' : 'No items have been reported yet.'}
          action={hasFilters && <Button variant="outline" size="sm" onClick={clearFilters}>Clear Filters</Button>}
        />
      )}

      {items.length > 0 && (
        <div className="items-grid">
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onClaim={(i) => openModal('claim', { item: i })}
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={() => load(page + 1)} loading={loading}>
            Load More ({total - items.length} remaining)
          </Button>
        </div>
      )}

      {/* Pagination loading */}
      {loading && items.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="skeleton h-10 w-40 rounded-full" />
        </div>
      )}
    </div>
  )
}
