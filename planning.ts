import type { Peak, RiskLevel } from './data'

export type PaceMode = 'relaxed' | 'moderate' | 'strong' | 'fast'
export type TripStyle = 'day-hike' | 'trailhead-camp' | 'backcountry-camp'
export type BreakStyle = 'minimal' | 'normal' | 'frequent'

export type PlanningSettings = {
  startTime: string
  pace: PaceMode
  tripStyle: TripStyle
  breakStyle: BreakStyle
  summitMinutes: number
  planningCutoff: string
}

export type TimeFactor = {
  label: string
  value: string
  impact: number
  kind: 'fact' | 'calculation' | 'community' | 'unknown'
  detail: string
}

export type TimelinePoint = {
  id: string
  kind: 'start' | 'checkpoint' | 'landmark' | 'summit' | 'descent' | 'finish'
  label: string
  time: string
  progress: number
  detail: string
  sourced?: boolean
}

export type ClimbEstimate = {
  grade: number
  modeledMovingHours: number
  expectedHours: number
  lowHours: number
  highHours: number
  summitTime: string
  finishTime: string
  planningMarginMinutes: number
  ascentHours: number
  descentHours: number
  breakHours: number
  confidence: 'Higher' | 'Medium' | 'Lower'
  communityStatus: 'available' | 'unavailable'
  factors: TimeFactor[]
  timeline: TimelinePoint[]
}

const paceMultiplier: Record<PaceMode, number> = {
  relaxed: 1.2,
  moderate: 1,
  strong: 0.88,
  fast: 0.78
}

const riskRank: Record<RiskLevel, number> = {
  Unknown: 0,
  Low: 1,
  Moderate: 2,
  Considerable: 3,
  High: 4,
  Extreme: 5
}

const breakRatio: Record<BreakStyle, number> = {
  minimal: 0.045,
  normal: 0.085,
  frequent: 0.13
}

export function parseTime(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value || '')
  if (!match) return 0
  const h = Math.max(0, Math.min(23, Number(match[1])))
  const m = Math.max(0, Math.min(59, Number(match[2])))
  return h * 60 + m
}

export function formatMinutes(total: number) {
  const minutes = ((Math.round(total) % 1440) + 1440) % 1440
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

export function formatDuration(hours: number) {
  const mins = Math.max(0, Math.round(hours * 60))
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h ? `${h}h ${m ? `${m}m` : ''}`.trim() : `${m}m`
}

function routeClassNumber(routeClass: string) {
  return Number(routeClass.match(/\d/)?.[0] ?? 1)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function factorImpact(multiplier: number) {
  return Math.round((multiplier - 1) * 100)
}

export function routeGrade(peak: Peak) {
  // Matches the route-selector convention: total gain over one-way horizontal distance.
  const oneWayFeet = Math.max(1, (peak.route.distance / 2) * 5280)
  return (peak.route.gain / oneWayFeet) * 100
}

export function estimateClimb(peak: Peak, settings: PlanningSettings): ClimbEstimate {
  const grade = routeGrade(peak)
  const classNum = routeClassNumber(peak.route.routeClass)

  // Naismith-style baseline, then transparent mountain-specific adjustments.
  const horizontalHours = peak.route.distance / 3
  const verticalHours = peak.route.gain / 2000
  const baselineHours = horizontalHours + verticalHours

  const gradeMultiplier = 1 + clamp((grade - 12) * 0.009, 0, 0.17)
  const classMultiplier = ({ 1: 1, 2: 1.055, 3: 1.18, 4: 1.34, 5: 1.5 } as Record<number, number>)[classNum] ?? 1
  const altitudeMultiplier = 1 + clamp((peak.elevation - 12500) / 10000, 0, 0.025)
  const navRank = riskRank[peak.route.risk.routeFinding]
  const commitmentRank = riskRank[peak.route.risk.commitment]
  const routeComplexityMultiplier = 1 + Math.max(0, navRank - 1) * 0.018 + Math.max(0, commitmentRank - 1) * 0.012
  const overnightMultiplier = settings.tripStyle === 'backcountry-camp' ? 1.075 : 1
  const pace = paceMultiplier[settings.pace]

  let modeledMovingHours = baselineHours * gradeMultiplier * classMultiplier * altitudeMultiplier * routeComplexityMultiplier * overnightMultiplier * pace

  let communityStatus: ClimbEstimate['communityStatus'] = 'unavailable'
  if (peak.route.community?.medianHours && peak.route.community.samples && peak.route.community.samples >= 5) {
    communityStatus = 'available'
    modeledMovingHours = modeledMovingHours * 0.68 + peak.route.community.medianHours * 0.32
  }

  const breakHours = modeledMovingHours * breakRatio[settings.breakStyle] + clamp(settings.summitMinutes, 0, 120) / 60
  const expectedHours = modeledMovingHours + breakHours

  const technicalUncertainty = Math.max(0, classNum - 1) * 0.02 + Math.max(0, navRank - 1) * 0.012
  const communityUncertainty = communityStatus === 'available' ? 0.1 : 0.16
  const spread = clamp(communityUncertainty + technicalUncertainty, 0.1, 0.31)
  const lowHours = expectedHours * (1 - spread)
  const highHours = expectedHours * (1 + spread)

  const ascentShare = classNum >= 3 ? 0.53 : grade >= 20 ? 0.57 : 0.59
  const nonSummitBreak = Math.max(0, breakHours - settings.summitMinutes / 60)
  const ascentHours = modeledMovingHours * ascentShare + nonSummitBreak * 0.62
  const descentHours = modeledMovingHours * (1 - ascentShare) + nonSummitBreak * 0.38

  const startMinutes = parseTime(settings.startTime)
  const summitMinutes = startMinutes + ascentHours * 60
  const finishMinutes = startMinutes + expectedHours * 60
  const cutoffMinutes = parseTime(settings.planningCutoff)
  const planningMarginMinutes = cutoffMinutes - summitMinutes

  const factors: TimeFactor[] = [
    { label: 'Distance', value: `${peak.route.distance} mi RT`, impact: 0, kind: 'fact', detail: `${horizontalHours.toFixed(1)} baseline hours from horizontal distance before terrain adjustments.` },
    { label: 'Elevation gain', value: `+${peak.route.gain.toLocaleString()} ft`, impact: 0, kind: 'fact', detail: `${verticalHours.toFixed(1)} baseline hours from vertical gain before terrain adjustments.` },
    { label: 'Average grade', value: `${grade.toFixed(1)}%`, impact: factorImpact(gradeMultiplier), kind: 'calculation', detail: 'Calculated from total gain divided by one-way route distance.' },
    { label: 'Route class', value: peak.route.routeClass, impact: factorImpact(classMultiplier), kind: 'fact', detail: 'Higher classes slow movement because terrain demands more deliberate movement.' },
    { label: 'Altitude', value: `${peak.elevation.toLocaleString()} ft`, impact: factorImpact(altitudeMultiplier), kind: 'calculation', detail: 'Small summit-altitude adjustment; individual acclimatization can matter much more.' },
    { label: 'Route complexity', value: `${peak.route.risk.routeFinding} nav · ${peak.route.risk.commitment} commitment`, impact: factorImpact(routeComplexityMultiplier), kind: 'fact', detail: 'Route-finding and commitment add time uncertainty rather than being treated as a single safety score.' },
    { label: 'Selected pace', value: settings.pace[0].toUpperCase() + settings.pace.slice(1), impact: factorImpact(pace), kind: 'calculation', detail: 'User-controlled pace profile; future recorded climbs can replace this with a personal calibration.' },
    { label: 'Overnight load', value: settings.tripStyle === 'backcountry-camp' ? 'Backcountry pack' : settings.tripStyle === 'trailhead-camp' ? 'Trailhead camp' : 'Day hike', impact: factorImpact(overnightMultiplier), kind: 'calculation', detail: settings.tripStyle === 'backcountry-camp' ? 'Adds a modest movement penalty for a heavier overnight pack.' : 'No pack penalty applied.' },
    communityStatus === 'available'
      ? { label: 'Community calibration', value: `${peak.route.community!.samples} reported times`, impact: 0, kind: 'community', detail: 'Model is blended with the route community median; outliers are not used directly.' }
      : { label: 'Community calibration', value: 'Not loaded', impact: 0, kind: 'unknown', detail: '14ers.com user climb times are login-gated. The engine accepts community distributions when an authorized source is available.' }
  ]

  const timeline: TimelinePoint[] = []
  const pushPoint = (point: TimelinePoint) => timeline.push(point)
  pushPoint({ id: 'start', kind: 'start', label: 'Leave trailhead', time: formatMinutes(startMinutes), progress: 0, detail: `${peak.route.trailhead} · ${settings.tripStyle === 'day-hike' ? 'day-hike start' : 'overnight plan'}` })

  const verified = (peak.route.landmarks ?? []).filter(l => l.progress > 0 && l.progress < 0.5)
  if (verified.length) {
    verified.forEach((l, idx) => {
      const ascentProgress = clamp(l.progress / 0.5, 0.05, 0.95)
      const t = startMinutes + ascentHours * 60 * ascentProgress
      pushPoint({ id: `landmark-${idx}`, kind: 'landmark', label: l.name, time: formatMinutes(t), progress: l.progress, detail: `${l.elevation ? `${l.elevation.toLocaleString()} ft · ` : ''}${l.note}`, sourced: true })
    })
  } else {
    ;[
      { p: 0.14, a: 0.28, label: 'Early pace check', detail: 'Calculated checkpoint — compare actual pace with plan.' },
      { p: 0.29, a: 0.58, label: 'Mid-ascent check', detail: 'Calculated checkpoint — fuel, water, weather, and group check.' },
      { p: 0.42, a: 0.84, label: 'Upper-route check', detail: 'Calculated checkpoint — reassess timing before the summit push.' }
    ].forEach((c, idx) => pushPoint({ id: `checkpoint-${idx}`, kind: 'checkpoint', label: c.label, time: formatMinutes(startMinutes + ascentHours * 60 * c.a), progress: c.p, detail: c.detail }))
  }

  pushPoint({ id: 'summit', kind: 'summit', label: 'Expected summit', time: formatMinutes(summitMinutes), progress: 0.5, detail: `${peak.elevation.toLocaleString()} ft · ${settings.summitMinutes} min planned summit stop` })
  pushPoint({ id: 'descent', kind: 'descent', label: 'Descent pace check', time: formatMinutes(summitMinutes + settings.summitMinutes + descentHours * 60 * 0.48), progress: 0.76, detail: 'Calculated checkpoint — descents on technical terrain may be slower than expected.' })
  pushPoint({ id: 'finish', kind: 'finish', label: 'Expected trailhead return', time: formatMinutes(finishMinutes), progress: 1, detail: `Expected outing ${formatDuration(expectedHours)} · range ${formatDuration(lowHours)}–${formatDuration(highHours)}` })

  return {
    grade,
    modeledMovingHours,
    expectedHours,
    lowHours,
    highHours,
    summitTime: formatMinutes(summitMinutes),
    finishTime: formatMinutes(finishMinutes),
    planningMarginMinutes,
    ascentHours,
    descentHours,
    breakHours,
    confidence: communityStatus === 'available' && classNum <= 2 ? 'Higher' : classNum <= 2 ? 'Medium' : 'Lower',
    communityStatus,
    factors,
    timeline: timeline.sort((a, b) => a.progress - b.progress)
  }
}

export function bearingAndDistance(from: Peak, to: Peak) {
  const toRad = (n: number) => (n * Math.PI) / 180
  const lat1 = toRad(from.coordinates.lat)
  const lat2 = toRad(to.coordinates.lat)
  const dLat = lat2 - lat1
  const dLon = toRad(to.coordinates.lng - from.coordinates.lng)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  const miles = 3958.8 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  const bearing = (Math.atan2(y, x) * 180) / Math.PI
  return { miles, bearing: (bearing + 360) % 360 }
}
