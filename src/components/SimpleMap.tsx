'use client'

import { useEffect, useRef } from 'react'

interface MapMarker {
  id: number
  lat: number
  lng: number
  tier: 'best' | 'medium' | 'high'
  label: string
  price: number
}

interface SimpleMapProps {
  markers: MapMarker[]
  userLocation?: { lat: number; lng: number }
  onMarkerClick?: (id: number) => void
  selectedMarkerId?: number
}

export default function SimpleMap({ 
  markers, 
  userLocation,
  onMarkerClick,
  selectedMarkerId 
}: SimpleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([])

  useEffect(() => {
    if (!mapRef.current || typeof google === 'undefined') return

    // Initialize map centered on user location or São Paulo
    const center = userLocation || { lat: -23.5505, lng: -46.6333 }
    
    const map = new google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      mapId: 'temtudo-map',
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    })

    mapInstanceRef.current = map

    // Add user location marker if available
    if (userLocation) {
      const userPin = document.createElement('div')
      userPin.className = 'w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center'
      userPin.innerHTML = `
        <svg class="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
      `
      
      new google.maps.marker.AdvancedMarkerElement({
        map,
        position: userLocation,
        content: userPin,
      })
    }

    // Clear existing markers
    markersRef.current.forEach(m => m.map = null)
    markersRef.current = []

    // Add market markers
    markers.forEach((marker) => {
      const pinColor = marker.tier === 'best' 
        ? '#22c55e' 
        : marker.tier === 'medium' 
        ? '#f97316' 
        : '#ef4444'

      const isSelected = selectedMarkerId === marker.id
      const size = isSelected ? 'w-12 h-12' : 'w-10 h-10'

      const pinElement = document.createElement('div')
      pinElement.className = `${size} rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110`
      pinElement.style.backgroundColor = pinColor
      pinElement.style.border = '3px solid white'
      pinElement.innerHTML = `
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `

      const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: marker.lat, lng: marker.lng },
        content: pinElement,
        title: marker.label,
      })

      advancedMarker.addListener('click', () => {
        onMarkerClick?.(marker.id)
      })

      markersRef.current.push(advancedMarker)
    })

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }))
      if (userLocation) bounds.extend(userLocation)
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
    }

    return () => {
      markersRef.current.forEach(m => m.map = null)
      markersRef.current = []
    }
  }, [markers, userLocation, selectedMarkerId, onMarkerClick])

  return (
    <div ref={mapRef} className="w-full h-full" />
  )
}

