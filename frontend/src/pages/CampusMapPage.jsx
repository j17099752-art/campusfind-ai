import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import { LOCATIONS, LOCATION_ICONS } from '../utils/constants'
import { getCategoryEmoji, formatDate } from '../utils/helpers'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

// ================================================================
// Campus Map – Interactive schematic map using campus locations.
// Architecture is designed so Google Maps / Mapbox can replace the
// grid layout later by swapping the map-canvas section only.
// ================================================================

export default function CampusMapPage() {
  const navigate = useNavigate()
  const [locationStats, setLocationStats] = useState({}) // { locationName: { lost: N, found: N } }
  const [selectedLoc,   setSelectedLoc]   = useState(null)
  const [locItems,      setLocItems]       = useState([])
  const [loadingItems,  setLoadingItems]   = useState(false)
  const [loading,       setLoading]        = useState(true)

  // Load aggregate counts per location
  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('items')
        .select('location, item_type')
        .in('status', ['active', 'matched'])
      if (data) {
        const stats = {}
        data.forEach(({ location, item_type }) => {
          if (!location) return
          if (!stats[location]) stats[location] = { lost: 0, found: 0 }
          if (item_type === 'lost')  stats[location].lost++
          if (item_type === 'found') stats[location].found++
        })
        setLocationStats(stats)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Load items for a selected location
  async function selectLocation(name) {
    setSelectedLoc(name)
    setLoadingItems(true)
    const { data } = await supabase
      .from('items')
      .select('*')
      .eq('location', name)
      .in('status', ['active', 'matched'])
      .order('created_at', { ascending: false })
      .limit(8)
    setLocItems(data || [])
    setLoadingItems(false)
  }

  const totalLost  = Object.values(locationStats).reduce((s, v) => s + v.lost,  0)
  const totalFound = Object.values(locationStats).reduce((s, v) => s + v.found, 0)

  // Only show the first 9 major locations on the schematic map canvas
  const mapLocations = LOCATIONS.filter(l => l !== 'Other').slice(0, 12)

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>📍 Campus Map</h2>
        <p>Click any location to see lost &amp; found activity there.</p>
        <p className="text-xs text-[#9ca3af] mt-1">
          Note: This is an interactive campus schematic. Real map integration (Google Maps / Mapbox) can be added in a future update.
        </p>
      </div>

      {/* Summary pills */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2 bg-[#fee2e2] text-[#b91c1c] font-bold text-sm px-4 py-2 rounded-full">
          <span className="legend-dot lost" />
          {totalLost} Lost Items
        </div>
        <div className="flex items-center gap-2 bg-[#d1fae5] text-[#065f46] font-bold text-sm px-4 py-2 rounded-full">
          <span className="legend-dot found" />
          {totalFound} Found Items
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      )}

      {!loading && (
        <div className="campus-map-layout">
          {/* Map canvas – interactive schematic */}
          <div>
            <div className="campus-map-canvas">
              {mapLocations.map(name => {
                const stats = locationStats[name] || { lost: 0, found: 0 }
                const icon  = LOCATION_ICONS[name] || '📍'
                const total = stats.lost + stats.found
                return (
                  <button
                    key={name}
                    onClick={() => selectLocation(name)}
                    className={`map-loc-btn ${selectedLoc === name ? 'active' : ''}`}
                  >
                    <span className="map-loc-icon">{icon}</span>
                    <span className="map-loc-name">{name}</span>
                    <div className="map-loc-counts">
                      {stats.lost > 0  && <span className="map-count-pill lost">🔴 {stats.lost}</span>}
                      {stats.found > 0 && <span className="map-count-pill found">🟢 {stats.found}</span>}
                      {total === 0     && <span className="map-count-pill" style={{ background:'#f3f4f6', color:'#9ca3af' }}>No reports</span>}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="map-legend mt-4">
              <span><span className="legend-dot lost" />Lost Items</span>
              <span><span className="legend-dot found" />Found Items</span>
              <span className="text-xs text-[#9ca3af]">Click a location for details</span>
            </div>
          </div>

          {/* Side panel */}
          <div className="campus-map-panel">
            {!selectedLoc ? (
              <div className="map-panel-placeholder">
                <span>📍</span>
                <p>Click a location on the map to see items reported there.</p>
              </div>
            ) : (
              <>
                <div className="map-panel-header">
                  <h3>{LOCATION_ICONS[selectedLoc] || '📍'} {selectedLoc}</h3>
                  <small>
                    {locationStats[selectedLoc]?.lost || 0} lost ·{' '}
                    {locationStats[selectedLoc]?.found || 0} found
                  </small>
                </div>

                <div className="map-stat-row">
                  <div className="map-stat-box">
                    <span className="map-stat-num" style={{ color: '#ef4444' }}>
                      {locationStats[selectedLoc]?.lost || 0}
                    </span>
                    <span className="map-stat-lbl">Lost Items</span>
                  </div>
                  <div className="map-stat-box">
                    <span className="map-stat-num" style={{ color: '#10b981' }}>
                      {locationStats[selectedLoc]?.found || 0}
                    </span>
                    <span className="map-stat-lbl">Found Items</span>
                  </div>
                </div>

                <div className="map-items-list">
                  <p className="text-xs font-bold text-[#9ca3af] uppercase tracking-wide mb-2">
                    Recent items:
                  </p>
                  {loadingItems && <div className="flex justify-center py-4"><Spinner /></div>}
                  {!loadingItems && locItems.length === 0 && (
                    <p className="text-sm text-[#9ca3af] py-2">No active items reported here.</p>
                  )}
                  {!loadingItems && locItems.map(item => (
                    <div key={item.id} className="map-item-row">
                      <span className="map-item-icon">{getCategoryEmoji(item.category)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="map-item-name truncate">{item.item_name}</div>
                        <div className="map-item-meta">
                          {item.item_type === 'lost' ? '🔴 Lost' : '🟢 Found'} · {formatDate(item.date)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-[#e5e7eb]">
                  <Button
                    size="sm"
                    variant="primary"
                    fullWidth
                    onClick={() => navigate(`/find?location=${encodeURIComponent(selectedLoc)}`)}
                  >
                    🔍 Search all items here
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
