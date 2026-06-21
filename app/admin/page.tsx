'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Booking {
  id: string
  slot_id: string
  patient_name: string
  patient_phone: string
  patient_email: string
  status: string
  created_at: string
  slots?: { date: string; time: string }
}

interface Slot {
  id: string
  date: string
  time: string
  available: boolean
}

export default function AdminPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'bookings' | 'slots'>('bookings')
  const [bookings, setBookings] = useState<Booking[]>([])
  const [slots, setSlots] = useState<Slot[]>([])
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = sessionStorage.getItem('adminLoggedIn')
    if (saved === 'true') setIsLoggedIn(true)
  }, [])

  useEffect(() => {
    if (isLoggedIn) {
      fetchBookings()
      fetchSlots()
    }
  }, [isLoggedIn])

  function handleLogin() {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD || password === 'dra.mari2024') {
      setIsLoggedIn(true)
      sessionStorage.setItem('adminLoggedIn', 'true')
    } else {
      setError('Senha incorreta')
    }
  }

  async function fetchBookings() {
    const { data } = await supabase
      .from('bookings')
      .select('*, slots(date, time)')
      .order('created_at', { ascending: false })
    if (data) setBookings(data)
  }

  async function fetchSlots() {
    const { data } = await supabase
      .from('slots')
      .select('*')
      .order('date', { ascending: true })
      .order('time', { ascending: true })
    if (data) setSlots(data)
  }

  async function addSlot() {
    if (!newDate || !newTime) return
    setLoading(true)
    await supabase.from('slots').insert({ date: newDate, time: newTime, available: true })
    setNewDate('')
    setNewTime('')
    await fetchSlots()
    setLoading(false)
  }

  async function updateBookingStatus(id: string, status: string) {
    await supabase.from('bookings').update({ status }).eq('id', id)
    await fetchBookings()
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5581999999999'

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{background: '#FDF6F0'}}>
        <div className="p-8 rounded-2xl shadow-lg bg-white max-w-sm w-full">
          <h1 className="text-2xl font-serif text-center mb-6" style={{color: '#B76E79'}}>Admin</h1>
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full p-3 rounded-xl mb-4"
            style={{border: '1px solid #E8B4B8'}}
          />
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full p-3 rounded-xl text-white"
            style={{background: '#B76E79'}}
          >
            Entrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{background: '#FDF6F0'}}>
      <header className="py-4 px-6 flex justify-between items-center" style={{background: '#B76E79', color: 'white'}}>
        <h1 className="text-xl font-serif">Painel Admin</h1>
        <button onClick={() => { setIsLoggedIn(false); sessionStorage.removeItem('adminLoggedIn'); }} className="text-sm opacity-80">Sair</button>
      </header>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setTab('bookings')} className="px-4 py-2 rounded-xl" style={{background: tab === 'bookings' ? '#B76E79' : '#E8B4B8', color: tab === 'bookings' ? 'white' : '#6B3E4A'}}>
            Agendamentos ({bookings.length})
          </button>
          <button onClick={() => setTab('slots')} className="px-4 py-2 rounded-xl" style={{background: tab === 'slots' ? '#B76E79' : '#E8B4B8', color: tab === 'slots' ? 'white' : '#6B3E4A'}}>
            Horários ({slots.filter(s => s.available).length} disponíveis)
          </button>
        </div>

        {tab === 'bookings' && (
          <div className="space-y-3">
            {bookings.map(b => (
              <div key={b.id} className="p-4 rounded-xl bg-white shadow-sm" style={{border: '1px solid #E8B4B8'}}>
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <p className="font-medium" style={{color: '#6B3E4A'}}>{b.patient_name}</p>
                    <p className="text-sm" style={{color: '#9B7B83'}}>{b.slots?.date} • {b.slots?.time}</p>
                    <p className="text-sm" style={{color: '#9B7B83'}}>{b.patient_phone}</p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <a
                      href={`https://wa.me/${b.patient_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${b.patient_name}! Confirmando sua consulta em ${b.slots?.date} às ${b.slots?.time}. 🌸`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded-lg text-white text-sm"
                      style={{background: '#25D366'}}
                    >
                      WhatsApp
                    </a>
                    <select
                      value={b.status}
                      onChange={e => updateBookingStatus(b.id, e.target.value)}
                      className="px-2 py-1 rounded-lg text-sm"
                      style={{border: '1px solid #E8B4B8'}}
                    >
                      <option value="pending">Pendente</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
            {bookings.length === 0 && <p style={{color: '#9B7B83'}}>Nenhum agendamento ainda.</p>}
          </div>
        )}

        {tab === 'slots' && (
          <div>
            <div className="p-4 rounded-xl bg-white mb-4" style={{border: '1px solid #E8B4B8'}}>
              <h3 className="font-medium mb-3" style={{color: '#6B3E4A'}}>Adicionar Horário</h3>
              <div className="flex gap-2 flex-wrap">
                <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="p-2 rounded-lg" style={{border: '1px solid #E8B4B8'}} />
                <input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="p-2 rounded-lg" style={{border: '1px solid #E8B4B8'}} />
                <button onClick={addSlot} disabled={loading} className="px-4 py-2 rounded-lg text-white" style={{background: '#B76E79'}}>
                  {loading ? '...' : 'Adicionar'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {slots.map(s => (
                <div key={s.id} className="p-3 rounded-xl bg-white flex justify-between items-center" style={{border: '1px solid #E8B4B8'}}>
                  <span style={{color: '#6B3E4A'}}>{s.date} • {s.time}</span>
                  <span className="text-sm px-2 py-1 rounded-lg" style={{background: s.available ? '#E8F5E9' : '#FFEAEA', color: s.available ? '#2E7D32' : '#C62828'}}>
                    {s.available ? 'Disponível' : 'Ocupado'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
