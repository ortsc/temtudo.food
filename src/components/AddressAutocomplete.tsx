'use client'

import { useEffect, useRef, useState } from 'react'

interface AddressAutocompleteProps {
  value: string
  onChange: (address: string, details?: AddressDetails) => void
  placeholder?: string
  className?: string
}

export interface AddressDetails {
  address: string
  city: string
  state: string
  cep: string
  lat?: number
  lng?: number
}

declare global {
  interface Window {
    google: typeof google
  }
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Digite seu endereço',
  className = '',
}: AddressAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Check if Google Maps is loaded
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps && window.google.maps.places) {
        setIsLoaded(true)
        return true
      }
      return false
    }

    if (checkGoogleMaps()) return

    // Poll for Google Maps to be loaded
    const interval = setInterval(() => {
      if (checkGoogleMaps()) {
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!isLoaded || !inputRef.current || autocompleteRef.current) return

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: 'br' },
      types: ['address'],
      fields: ['formatted_address', 'address_components', 'geometry'],
    })

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current?.getPlace()
      if (!place || !place.formatted_address) return

      const details: AddressDetails = {
        address: place.formatted_address,
        city: '',
        state: '',
        cep: '',
      }

      // Extract address components
      place.address_components?.forEach((component) => {
        const types = component.types
        if (types.includes('administrative_area_level_2') || types.includes('locality')) {
          details.city = component.long_name
        }
        if (types.includes('administrative_area_level_1')) {
          details.state = component.short_name
        }
        if (types.includes('postal_code')) {
          details.cep = component.long_name
        }
      })

      // Get coordinates
      if (place.geometry?.location) {
        details.lat = place.geometry.location.lat()
        details.lng = place.geometry.location.lng()
      }

      onChange(place.formatted_address, details)
    })

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [isLoaded, onChange])

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent ${className}`}
    />
  )
}

