import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { uploadItemImage, createItem } from '../services/itemsService'
import { runAndPersistMatches } from '../services/matchService'
import { CATEGORIES, LOCATIONS, MAX_IMAGE_SIZE_MB } from '../utils/constants'
import { validateImageFile } from '../utils/helpers'
import { getAccessToken } from '../utils/getToken'
import Button from '../components/ui/Button'
import Input, { Select, Textarea } from '../components/ui/Input'
import toast from 'react-hot-toast'

const TODAY = new Date().toISOString().split('T')[0]

export default function ReportFoundPage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    studentName: profile?.full_name || '',
    itemName:    '',
    category:    '',
    color:       '',
    location:    '',
    date:        TODAY,
    contact:     '',
    description: '',
  })
  const [errors,       setErrors]       = useState({})
  const [imageFile,    setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [imageError,   setImageError]   = useState('')
  const [uploading,    setUploading]    = useState(false)
  const [step,         setStep]         = useState('form')
  const fileRef = useRef()

  function set(field) {
    return (e) => {
      setForm(f => ({ ...f, [field]: e.target.value }))
      setErrors(err => ({ ...err, [field]: '' }))
    }
  }

  function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImageFile(file)
    if (err) { setImageError(err); return }
    setImageError('')
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  function validate() {
    const e = {}
    if (!form.studentName.trim()) e.studentName = 'Name is required.'
    if (!form.itemName.trim())    e.itemName    = 'Item name is required.'
    if (!form.category)           e.category    = 'Select a category.'
    if (!form.color.trim())       e.color       = 'Color is required.'
    if (!form.location)           e.location    = 'Select a location.'
    if (!form.date)               e.date        = 'Date is required.'
    if (new Date(form.date) > new Date()) e.date = 'Date cannot be in the future.'
    if (!form.contact.trim())     e.contact     = 'Contact info is required.'
    if (!form.description.trim()) e.description = 'Description is required.'
    if (form.description.length < 10) e.description = 'Please add more detail (min 10 chars).'
    return e
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setUploading(true)
    try {
      let imageUrl = null
      if (imageFile) {
        toast.loading('Uploading image…', { id: 'upload' })
        imageUrl = await uploadItemImage(imageFile, user.id)
        toast.dismiss('upload')
      }

      toast.loading('Saving report…', { id: 'save' })
      const token = await getAccessToken()

      const created = await createItem({
        user_id:             user.id,
        item_type:           'found',
        item_name:           form.itemName.trim(),
        category:            form.category,
        color:               form.color.trim(),
        location:            form.location,
        date:                form.date,
        description:         form.description.trim(),
        contact_information: form.contact.trim(),
        image_url:           imageUrl,
        status:              'active',
      }, token)
      toast.dismiss('save')

      // Run smart match
      setStep('matching')
      toast.loading('Scanning for lost item matches…', { id: 'match' })
      try {
        await runAndPersistMatches(created.data.id, token)
      } catch (_) {}
      toast.dismiss('match')

      setStep('done')
      toast.success('✅ Thank you! +10 Good Samaritan points earned.')
    } catch (err) {
      toast.dismiss('upload')
      toast.dismiss('save')
      toast.dismiss('match')
      toast.error(err.message || 'Failed to submit report. Try again.')
      setUploading(false)
      setStep('form')
    }
  }

  if (step === 'done') {
    return (
      <div className="form-page">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏆</div>
          <div className="inline-flex items-center gap-2 bg-[#d1fae5] text-[#065f46] font-bold px-5 py-2 rounded-full text-sm mb-6">
            +10 Good Samaritan Points Earned!
          </div>
          <h2 className="text-2xl font-extrabold text-[#1e1b4b] mb-3">Found Item Reported!</h2>
          <p className="text-[#6b7280] mb-8 max-w-md mx-auto">
            Thank you for helping a fellow student! We've scanned lost reports for possible owners and notified them.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button variant="primary" onClick={() => navigate('/my-reports')}>📋 View My Reports</Button>
            <Button variant="outline" onClick={() => navigate('/smart-match')}>🤖 View Smart Matches</Button>
            <Button variant="ghost" onClick={() => { setStep('form'); setUploading(false); setForm({ studentName: profile?.full_name || '', itemName: '', category: '', color: '', location: '', date: TODAY, contact: '', description: '' }); setImageFile(null); setImagePreview(null) }}>
              + Report Another
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="form-page">
      <div className="form-header">
        <span className="form-icon">🟢</span>
        <h2>Report Found Item</h2>
        <p>Upload a photo to help us match this item with its owner. You earn +10 points!</p>
      </div>

      {/* Points incentive banner */}
      <div className="flex items-center gap-3 bg-[#d1fae5] border border-[#6ee7b7] rounded-[14px] px-5 py-3 mb-6">
        <span className="text-2xl">🏆</span>
        <div>
          <p className="font-semibold text-[#065f46] text-sm">Earn Good Samaritan Points</p>
          <p className="text-xs text-[#047857]">You'll earn +10 points for reporting a found item. Help someone recover their belongings!</p>
        </div>
      </div>

      <form className="item-form" onSubmit={handleSubmit} noValidate>
        <div className="form-grid">
          <Input label="Student Name"           required value={form.studentName} onChange={set('studentName')} placeholder="Your full name"           error={errors.studentName} />
          <Input label="Item Name"              required value={form.itemName}    onChange={set('itemName')}    placeholder="e.g. Blue Backpack"        error={errors.itemName} />

          <Select label="Category" required value={form.category} onChange={set('category')} error={errors.category}>
            <option value="">-- Select Category --</option>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>

          <Input label="Color" required value={form.color} onChange={set('color')} placeholder="e.g. Blue, Red" error={errors.color} />

          <Select label="Found Location" required value={form.location} onChange={set('location')} error={errors.location}>
            <option value="">-- Select Location --</option>
            {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
          </Select>

          <Input label="Found Date" type="date" required value={form.date} onChange={set('date')} max={TODAY} error={errors.date} />

          <Input label="Contact Information" required value={form.contact} onChange={set('contact')} placeholder="Phone / Email" error={errors.contact} />

          {/* Image upload */}
          <div className="form-group">
            <label className="block text-sm font-semibold text-[#1e1b4b] mb-1">
              Item Image <span className="text-[#9ca3af] font-normal text-xs">(Recommended for AI Match)</span>
            </label>
            <div className="file-upload-area">
              <input ref={fileRef} type="file" accept="image/*" className="file-input" onChange={handleImage} />
              <label onClick={() => fileRef.current?.click()} className="file-upload-label cursor-pointer">
                <span className="upload-icon">📷</span>
                <span className="upload-text">{imageFile ? imageFile.name : 'Click to upload'}</span>
                <span className="upload-hint">PNG, JPG, WebP up to {MAX_IMAGE_SIZE_MB}MB</span>
              </label>
              {imagePreview && (
                <div className="relative mt-2">
                  <img src={imagePreview} alt="Preview" className="img-preview" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">✕</button>
                </div>
              )}
            </div>
            {imageError && <p className="text-xs text-[#ef4444] font-medium mt-1">{imageError}</p>}
          </div>
        </div>

        <Textarea
          label="Description"
          required
          rows={4}
          value={form.description}
          onChange={set('description')}
          placeholder="Describe the item – color, brand, where found exactly, unique marks, etc."
          error={errors.description}
          containerClass="full-width mb-4"
        />

        <div className="form-actions">
          <Button type="submit" variant="success" size="lg" loading={uploading}>
            🟢 Report Found Item
          </Button>
        </div>
      </form>
    </div>
  )
}
