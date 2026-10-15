import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-react'
import { weatherCondition } from './format'

export function WeatherIcon({
  code,
  isDay = true,
  size = 32,
  className = '',
}: {
  code: number
  isDay?: boolean
  size?: number
  className?: string
}) {
  const { kind } = weatherCondition(code)
  const Icon = {
    sun: isDay ? Sun : Moon,
    partly: isDay ? CloudSun : CloudMoon,
    cloud: Cloud,
    fog: CloudFog,
    rain: code <= 57 ? CloudDrizzle : CloudRain,
    snow: CloudSnow,
    storm: CloudLightning,
  }[kind]
  return (
    <Icon
      size={size}
      strokeWidth={1.65}
      className={`weather-icon weather-icon--${kind} ${className}`}
      aria-hidden="true"
    />
  )
}

export function SkyIllustration({ code, isDay }: { code: number; isDay: boolean }) {
  const { kind } = weatherCondition(code)
  return (
    <div className={`sky-art sky-art--${kind} ${isDay ? '' : 'sky-art--night'}`} aria-hidden="true">
      <div className="sky-art__orbit sky-art__orbit--outer" />
      <div className="sky-art__orbit" />
      <div className="sky-art__sun" />
      {kind !== 'sun' && (
        <>
          <div className="sky-art__cloud sky-art__cloud--back" />
          <div className="sky-art__cloud" />
        </>
      )}
      {(kind === 'rain' || kind === 'storm') && (
        <div className="sky-art__rain">
          <i />
          <i />
          <i />
        </div>
      )}
      {kind === 'snow' && <div className="sky-art__snow">❄ · ❄</div>}
    </div>
  )
}
