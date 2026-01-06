import { useState, useEffect } from 'react'

// Generate or retrieve a per-device anonymous ID stored in localStorage
// This ensures each browser/device tracks independently without login
export function useDeviceId() {
  const [deviceId, setDeviceId] = useState('')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    // Get or generate device ID
    let storedDeviceId = localStorage.getItem('silent-killer-device-id')
    if (!storedDeviceId) {
      storedDeviceId = 'device-' + crypto.randomUUID()
      localStorage.setItem('silent-killer-device-id', storedDeviceId)
    }
    setDeviceId(storedDeviceId)

    // Get or set user ID (can be changed in settings)
    const storedUserId = localStorage.getItem('silent-killer-user-id')
    setUserId(storedUserId || storedDeviceId) // Default to device ID if no user ID set
  }, [])

  // Allow updating the user ID (to sync across devices)
  const updateUserId = (newUserId) => {
    if (newUserId) {
      localStorage.setItem('silent-killer-user-id', newUserId)
      setUserId(newUserId)
    } else {
      // Reset to device ID
      localStorage.removeItem('silent-killer-user-id')
      setUserId(deviceId)
    }
  }

  return {
    deviceId,
    userId,
    updateUserId,
    isUsingCustomId: !!localStorage.getItem('silent-killer-user-id')
  }
}
