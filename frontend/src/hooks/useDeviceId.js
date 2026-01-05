import { useState, useEffect } from 'react'

// Generate or retrieve a per-device anonymous ID stored in localStorage
// This ensures each browser/device tracks independently without login
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('silent-killer-device-id')
    if (stored) {
      console.log('Using existing device ID:', stored)
      setDeviceId(stored)
    } else {
      // Generate a random UUID-like ID (v4)
      const id = 'device-' + crypto.randomUUID()
      console.log('Generated new device ID:', id)
      localStorage.setItem('silent-killer-device-id', id)
      setDeviceId(id)
    }
  }, [])

  return deviceId
}
