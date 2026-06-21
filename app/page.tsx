'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface Slot {
  id: string
  date: string
  time: string
  available: boolean
}

export default function Home() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)
  const [step, setStep] = useState<'slots' | 'form' | 'confirm'>('slots')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [bookingId, setBookingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSlots()
  }, [])

  async function fetchSlots() {
    const { data } = await supabase
      .from('slots')
      .select('*')
      .eq('available', true)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(20)
    if (data) setSlots(data)
  }

  async function handleBooking() {
    if (!selectedSlot) return
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        slot_id: selectedSlot.id,
        patient_name: name,
        patient_phone: phone,
        patient_email: email,
        status: 'pending'
      })
      .select()
      .single()
    
    if (!error && data) {
      await supabase
        .from('slots')
        .update({ available: false })
        .eq('id', selectedSlot.id)
      setBookingId(data.id)
      setStep('confirm')
    }
    setLoading(false)
  }

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '5581999999999'
  const whatsappMsg = selectedSlot 
    ? encodeURIComponent(`Olá! Meu agendamento foi confirmado para ${selectedSlot.date} às ${selectedSlot.time}. Aguardo a confirmação!`)
    : ''

  return (
    <main className="min-h-screen" style={{background: 'linear-gradient(135deg, #FDF6F0 0%, #F5E6EA 100%)'}}>
      {/* Header */}
      <header className="py-8 text-center" style={{borderBottom: '1px solid #E8B4B8'}}>
        <h1 className="text-4xl font-serif" style={{color: '#B76E79'}}>Dra. Mari Alcazar</h1>
        <p className="text-lg mt-2" style={{color: '#8B5E6A'}}>Dermatologista • CRM-PE 12345</p>
        <p className="text-sm mt-1" style={{color: '#9B7B83'}}>Recife, Pernambuco</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {step === 'slots' && (
          <div>
            <h2 className="text-2xl font-serif text-center mb-6" style={{color: '#6B3E4A'}}>
              Agendar Consulta
            </h2>
            {slots.length === 0 ? (
              <p className="text-center" style={{color: '#9B7B83'}}>Nenhum horário disponível no momento.</p>
            ) : (
              <div className="grid gap-3">
                {slots.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => { setSelectedSlot(slot); setStep('form'); }}
                    className="p-4 rounded-xl text-left transition-all"
                    style={{
                      background: 'white',
                      border: selectedSlot?.id === slot.id ? '2px solid #B76E79' : '1px solid #E8B4B8',
                      boxShadow: '0 2px 8px rgba(183,110,121,0.1)'
                    }}
                  >
                    <p className="font-medium" style={{color: '#B76E79'}}>
                      {new Date(slot.date + 'T00:00:00').toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'long'})}
                    </p>
                    <p style={{color: '#6B3E4A'}}>{slot.time}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {step === 'form' && selectedSlot && (
          <div>
            <button onClick={() => setStep('slots')} className="mb-4" style={{color: '#B76E79'}}>← Voltar</button>
            <h2 className="text-2xl font-serif text-center mb-2" style={{color: '#6B3E4A'}}>Seus Dados</h2>
            <p className="text-center mb-6" style={{color: '#9B7B83'}}>
              {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'long'})} • {selectedSlot.time}
            </p>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full p-3 rounded-xl"
                style={{border: '1px solid #E8B4B8', background: 'white'}}
              />
              <input
                type="tel"
                placeholder="WhatsApp (com DDD)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full p-3 rounded-xl"
                style={{border: '1px solid #E8B4B8', background: 'white'}}
              />
              <input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl"
                style={{border: '1px solid #E8B4B8', background: 'white'}}
              />
              <button
                onClick={handleBooking}
                disabled={!name || !phone || loading}
                className="w-full p-4 rounded-xl text-white font-medium text-lg"
                style={{background: name && phone ? '#B76E79' : '#ccc', transition: 'all 0.2s'}}
              >
                {loading ? 'Agendando...' : 'Confirmar Agendamento'}
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && selectedSlot && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">🌸</div>
            <h2 className="text-2xl font-serif mb-2" style={{color: '#6B3E4A'}}>Agendamento Confirmado!</h2>
            <p className="mb-4" style={{color: '#9B7B83'}}>
              {new Date(selectedSlot.date + 'T00:00:00').toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'long'})} • {selectedSlot.time}
            </p>
            <a
              href={`https://wa.me/${whatsappNumber}?${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 rounded-xl text-white"
              style={{background: '#25D366'}}
            >
              💬 Confirmar pelo WhatsApp
            </a>
          </div>
        )}
      </div>
    </main>
  )
}
