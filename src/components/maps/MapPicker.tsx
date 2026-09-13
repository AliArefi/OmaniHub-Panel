import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ApiService from '@/services/ApiService'

type MapPickerProps = {
    lat?: number
    lng?: number
    onPick: (lat: number, lng: number) => void
}

type MapConfig = {
    preferred_provider: 'google' | 'openstreetmap'
    google: { enabled: boolean; api_key?: string | null }
}

type GoogleMapsApi = {
    Map: new (element: HTMLElement, options: Record<string, unknown>) => {
        addListener: (event: string, callback: (event: { latLng?: { lat: () => number; lng: () => number } }) => void) => void
        setCenter: (position: { lat: number; lng: number }) => void
    }
    Marker: new (options: Record<string, unknown>) => { setPosition: (position: { lat: number; lng: number }) => void }
}

declare global {
    interface Window { google?: { maps: GoogleMapsApi } }
}

let googleLoader: Promise<GoogleMapsApi> | null = null

function loadGoogleMaps(apiKey: string): Promise<GoogleMapsApi> {
    if (window.google?.maps) return Promise.resolve(window.google.maps)
    if (googleLoader) return googleLoader

    googleLoader = new Promise((resolve, reject) => {
        const callback = `__omanihubGoogleMapsReady${Date.now()}`
        const target = window as unknown as Record<string, unknown>
        const timer = window.setTimeout(() => {
            googleLoader = null
            reject(new Error('Google Maps timed out'))
        }, 10000)
        const cleanup = () => {
            window.clearTimeout(timer)
            delete target[callback]
        }
        target.gm_authFailure = () => window.dispatchEvent(new Event('omanihub-google-maps-auth-failure'))
        target[callback] = () => {
            cleanup()
            window.google?.maps ? resolve(window.google.maps) : reject(new Error('Google Maps unavailable'))
        }
        const script = document.createElement('script')
        script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&callback=${callback}&v=weekly`
        script.async = true
        script.onerror = () => { cleanup(); googleLoader = null; reject(new Error('Google Maps failed to load')) }
        document.head.appendChild(script)
    })

    return googleLoader
}

function GoogleMapPicker({ lat, lng, onPick, onFailure }: MapPickerProps & { onFailure: () => void }) {
    const containerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<InstanceType<GoogleMapsApi['Map']> | null>(null)
    const markerRef = useRef<InstanceType<GoogleMapsApi['Marker']> | null>(null)
    const mapsRef = useRef<GoogleMapsApi | null>(null)
    const onPickRef = useRef(onPick)
    const { data } = useSWR('public-map-config', () =>
        ApiService.fetchDataWithAxios<{ data: MapConfig }>({ url: '/map/config' }),
    )
    const apiKey = data?.data.google.api_key

    useEffect(() => { onPickRef.current = onPick }, [onPick])
    useEffect(() => {
        window.addEventListener('omanihub-google-maps-auth-failure', onFailure)
        return () => window.removeEventListener('omanihub-google-maps-auth-failure', onFailure)
    }, [onFailure])
    useEffect(() => {
        if (!data || data.data.preferred_provider !== 'google' || !apiKey || !containerRef.current) {
            if (data) onFailure()
            return
        }
        let active = true
        loadGoogleMaps(apiKey).then((maps) => {
            if (!active || !containerRef.current) return
            const center = { lat: lat ?? 23.588, lng: lng ?? 58.3829 }
            const map = new maps.Map(containerRef.current, { center, zoom: 12, mapTypeControl: false, streetViewControl: false })
            map.addListener('click', (event) => {
                if (event.latLng) onPickRef.current(event.latLng.lat(), event.latLng.lng())
            })
            mapRef.current = map
            mapsRef.current = maps
            if (lat !== undefined && lng !== undefined) markerRef.current = new maps.Marker({ map, position: center })
        }).catch(onFailure)
        return () => { active = false }
    }, [apiKey, data, onFailure])

    useEffect(() => {
        if (lat === undefined || lng === undefined) return
        const position = { lat, lng }
        mapRef.current?.setCenter(position)
        if (markerRef.current) markerRef.current.setPosition(position)
        else if (mapRef.current && mapsRef.current) markerRef.current = new mapsRef.current.Marker({ map: mapRef.current, position })
    }, [lat, lng])

    return <div ref={containerRef} className="h-[300px] w-full" />
}

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

function ClickHandler({ onPick }: Pick<MapPickerProps, 'onPick'>) {
    useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) })
    return null
}

function OpenStreetMapPicker({ lat, lng, onPick }: MapPickerProps) {
    const center: [number, number] = lat !== undefined && lng !== undefined ? [lat, lng] : [23.588, 58.3829]
    return (
        <MapContainer center={center} zoom={12} style={{ height: 300, width: '100%' }}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <ClickHandler onPick={onPick} />
            {lat !== undefined && lng !== undefined && <Marker position={[lat, lng]} />}
        </MapContainer>
    )
}

export function MapPicker(props: MapPickerProps) {
    const [fallback, setFallback] = useState(false)
    const activateFallback = useCallback(() => setFallback(true), [])
    return fallback
        ? <OpenStreetMapPicker {...props} />
        : <GoogleMapPicker {...props} onFailure={activateFallback} />
}
