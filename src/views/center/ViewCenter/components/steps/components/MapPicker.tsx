import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:
        'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type MapPickerProps = {
    lat?: number
    lng?: number
    onPick: (lat: number, lng: number) => void
}

function ClickHandler({ onPick }: { onPick: MapPickerProps['onPick'] }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

export function MapPicker({ lat, lng, onPick }: MapPickerProps) {
    const center: [number, number] =
        lat && lng ? [lat, lng] : [23.588, 58.3829]

    return (
        <MapContainer
            center={center}
            zoom={12}
            style={{ height: 300, width: '100%' }}
        >
            <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onPick={onPick} />
            {lat && lng && <Marker position={[lat, lng]} />}
        </MapContainer>
    )
}
