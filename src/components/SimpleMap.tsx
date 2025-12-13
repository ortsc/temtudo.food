'use client'

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

interface MapMarker {
  id: number
  lat: number
  lng: number
  tier: 'best' | 'medium' | 'high' | 'cheap' | 'expensive' | 'no-data'
  label: string
  price?: number
}

interface SimpleMapProps {
  markers: MapMarker[]
  userLocation?: { lat: number; lng: number }
  onMarkerClick?: (id: number) => void
  selectedMarkerId?: number
}

export interface SimpleMapRef {
  goToUserLocation: () => void
  goToMarker: (id: number) => void
}

const SimpleMap = forwardRef<SimpleMapRef, SimpleMapProps>(({ 
  markers, 
  userLocation,
  onMarkerClick,
  selectedMarkerId 
}, ref) => {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<number, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null)

  // Expose methods
  useImperativeHandle(ref, () => ({
    goToUserLocation: () => {
      if (mapInstanceRef.current && userLocation) {
        mapInstanceRef.current.panTo(userLocation)
        mapInstanceRef.current.setZoom(15)
      }
    },
    goToMarker: (id: number) => {
      const marker = markers.find(m => m.id === id)
      if (mapInstanceRef.current && marker) {
        mapInstanceRef.current.panTo({ lat: marker.lat, lng: marker.lng })
        mapInstanceRef.current.setZoom(16)
      }
    }
  }))

  // Get pin color based on tier
  const getPinColor = (tier: string): string => {
    switch (tier) {
      case 'best':
      case 'cheap':
        return '#22c55e' // Green
      case 'medium':
        return '#f97316' // Orange
      case 'high':
      case 'expensive':
        return '#ef4444' // Red
      case 'no-data':
        return '#9ca3af' // Grey
      default:
        return '#9ca3af'
    }
  }

  // Create pin element
  const createPinElement = (marker: MapMarker, isSelected: boolean): HTMLElement => {
    const pinColor = getPinColor(marker.tier)
    
    const pinElement = document.createElement('div')
    pinElement.className = 'relative transition-all duration-300'
    
    if (isSelected) {
      // Selected state - larger pin with pulse animation
      pinElement.innerHTML = `
        <div class="relative">
          <div class="absolute -inset-2 bg-primary/30 rounded-full animate-ping"></div>
          <div class="relative w-14 h-14 rounded-full flex items-center justify-center shadow-xl cursor-pointer transform scale-110" style="background-color: ${pinColor}; border: 4px solid white; box-shadow: 0 0 20px rgba(0,0,0,0.3);">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          </div>
        </div>
      `
    } else {
      // Normal state
      pinElement.innerHTML = `
        <div class="w-10 h-10 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-all hover:scale-110" style="background-color: ${pinColor}; border: 3px solid white;">
          <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
      `
    }
    
    return pinElement
  }

  useEffect(() => {
    if (!mapRef.current || typeof google === 'undefined') return

    // Initialize map centered on user location or Rio de Janeiro (Leblon area)
    const center = userLocation || { lat: -22.9838, lng: -43.2244 }
    
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
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
    }

    const map = mapInstanceRef.current

    // Add/update user location marker
    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.position = userLocation
      } else {
        const userPin = document.createElement('div')
        userPin.className = 'relative'
        userPin.innerHTML = `
          <div class="relative">
            <div class="absolute inset-0 w-5 h-5 bg-blue-500 rounded-full animate-ping opacity-40"></div>
            <div class="relative w-5 h-5 bg-blue-500 rounded-full border-3 border-white shadow-lg"></div>
          </div>
        `
        
        userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: userLocation,
          content: userPin,
          title: 'Sua localização',
        })
      }
    }

    // Update markers
    const currentMarkerIds = new Set(markers.map(m => m.id))
    
    // Remove markers that no longer exist
    markersRef.current.forEach((marker, id) => {
      if (!currentMarkerIds.has(id)) {
        marker.map = null
        markersRef.current.delete(id)
      }
    })

    // Add or update markers
    markers.forEach((marker) => {
      const isSelected = selectedMarkerId === marker.id
      const existingMarker = markersRef.current.get(marker.id)
      
      if (existingMarker) {
        // Update existing marker
        existingMarker.content = createPinElement(marker, isSelected)
      } else {
        // Create new marker
        const pinElement = createPinElement(marker, isSelected)
        
        const advancedMarker = new google.maps.marker.AdvancedMarkerElement({
          map,
          position: { lat: marker.lat, lng: marker.lng },
          content: pinElement,
          title: marker.label,
        })

        advancedMarker.addListener('click', () => {
          onMarkerClick?.(marker.id)
        })

        markersRef.current.set(marker.id, advancedMarker)
      }
    })

    // Center on selected marker
    if (selectedMarkerId) {
      const selectedMarker = markers.find(m => m.id === selectedMarkerId)
      if (selectedMarker) {
        map.panTo({ lat: selectedMarker.lat, lng: selectedMarker.lng })
      }
    }

    // Fit bounds only on initial load (when no marker is selected)
    if (!selectedMarkerId && markers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }))
      if (userLocation) bounds.extend(userLocation)
      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 })
      
      const listener = google.maps.event.addListener(map, 'idle', () => {
        const zoom = map.getZoom()
        if (zoom && zoom > 16) map.setZoom(16)
        google.maps.event.removeListener(listener)
      })
    }
  }, [markers, userLocation, selectedMarkerId, onMarkerClick])

  return (
    <div ref={mapRef} className="w-full h-full" />
  )
})

SimpleMap.displayName = 'SimpleMap'

export default SimpleMap
