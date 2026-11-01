import {
  Incident,
  PriorityLevel,
  AIRecommendedPriority,
  HistoricalPatternMatch,
  SeverityScoreBreakdown,
} from '../types/incident';

export interface HistoricalClusterDefinition {
  clusterId: string;
  name: string;
  category: string;
  keywords: string[];
  baseSeverity: number;
  recommendedPriority: PriorityLevel;
  similarIncidentsCount: number;
  historicalEscalationRatePct: number;
  avgResolutionHours: number;
  precedentDescription: string;
}

export const HISTORICAL_INCIDENT_CLUSTERS: HistoricalClusterDefinition[] = [
  {
    clusterId: 'CLUST-BESCOM-11KV-ARC',
    name: 'High-Tension Subgrade Arcing & Waterlogged Feeder Snaps',
    category: 'Power Grid',
    keywords: ['11kv', 'high-tension', 'cable snap', 'sparking', 'standing water', 'arcing', 'electrocution', 'feeder', 'substation'],
    baseSeverity: 95,
    recommendedPriority: 'P1',
    similarIncidentsCount: 19,
    historicalEscalationRatePct: 84,
    avgResolutionHours: 2.1,
    precedentDescription:
      'Matched 19 historical 11kV severance events in Ward 112. 84% escalated to secondary pavement thermal fracturing or feeder outages within 30 minutes when unisolated.',
  },
  {
    clusterId: 'CLUST-BBMP-ARTERIAL-CAVEIN',
    name: 'Major Arterial Trench Cave-in & Heavy Vehicle Pothole Traps',
    category: 'Public Works',
    keywords: ['crater', 'pothole', 'cave-in', 'sinkhole', 'trench', 'undermined', 'bus axle', 'asphalt collapse', '100ft road'],
    baseSeverity: 78,
    recommendedPriority: 'P2',
    similarIncidentsCount: 34,
    historicalEscalationRatePct: 62,
    avgResolutionHours: 4.8,
    precedentDescription:
      'Matched 34 historical trench cave-ins on 100ft Road corridor. 62% caused BMTC transit paralysis or motorcycle tip-over liability if not cordoned in 45m.',
  },
  {
    clusterId: 'CLUST-BWSSB-PRESSURE-BURST',
    name: 'High-Pressure Potable Water Transmission Line Breach',
    category: 'Water & Utilities',
    keywords: ['water main', 'pipe burst', 'geyser', 'potable', 'bwssb', 'subgrade wash', 'flooding basement', 'pressure breach'],
    baseSeverity: 82,
    recommendedPriority: 'P2',
    similarIncidentsCount: 16,
    historicalEscalationRatePct: 73,
    avgResolutionHours: 3.6,
    precedentDescription:
      'Matched 16 historical BWSSB 400mm main ruptures. High risk of subgrade foundation erosion and roadbed cavitation under heavy commercial traffic.',
  },
  {
    clusterId: 'CLUST-BTP-CORRIDOR-GRIDLOCK',
    name: 'Signal Controller Cascading Outage & Emergency Bottleneck',
    category: 'Traffic & Transit',
    keywords: ['traffic light', 'signal failure', 'gridlock', 'junction blocked', 'ambulance stuck', 'cmh road', 'intersection'],
    baseSeverity: 74,
    recommendedPriority: 'P2',
    similarIncidentsCount: 42,
    historicalEscalationRatePct: 56,
    avgResolutionHours: 1.4,
    precedentDescription:
      'Matched 42 junction signal control failures. Historical pattern models show peak hour queues propagate 1.8km along 12th Main within 22 minutes.',
  },
  {
    clusterId: 'CLUST-BBMP-SWD-OVERFLOW',
    name: 'Primary Stormwater Drain Silt Blockage & Monsoon Backflow',
    category: 'Environmental Hazard',
    keywords: ['stormwater drain', 'swd', 'silt', 'backflow', 'drainage overflow', 'monsoon runoff', 'flooded shop', 'sewage leak'],
    baseSeverity: 88,
    recommendedPriority: 'P1',
    similarIncidentsCount: 22,
    historicalEscalationRatePct: 79,
    avgResolutionHours: 5.2,
    precedentDescription:
      'Matched 22 primary drain overflow patterns in Indiranagar low basins. 79% caused ground floor commercial flooding within 40 minutes of rainfall onset.',
  },
  {
    clusterId: 'CLUST-BBMP-ROUTINE-SURFACE',
    name: 'Residential Cross Road Surface Wear & Minor Paving Settling',
    category: 'Public Works',
    keywords: ['surface wear', 'paving', 'minor pothole', 'curbstone', 'residential cross', 'speedbreaker paint', 'manhole rattle'],
    baseSeverity: 36,
    recommendedPriority: 'P4',
    similarIncidentsCount: 158,
    historicalEscalationRatePct: 7,
    avgResolutionHours: 36.0,
    precedentDescription:
      'Matched 158 historical residential street wear tickets. Low safety risk; standard batch scheduling on next bi-weekly ward maintenance cycle.',
  },
  {
    clusterId: 'CLUST-BESCOM-STREETLIGHT-OUT',
    name: 'Residential Feeder Streetlight Luminaire Outages',
    category: 'Power Grid',
    keywords: ['streetlight', 'dark stretch', 'lamp dead', 'luminaire', 'bulb', 'night safety', 'pole dark'],
    baseSeverity: 52,
    recommendedPriority: 'P3',
    similarIncidentsCount: 89,
    historicalEscalationRatePct: 18,
    avgResolutionHours: 14.5,
    precedentDescription:
      'Matched 89 residential illumination failures. Minor pedestrian safety concern after 20:00 IST; route to evening maintenance bucket truck.',
  },
];

/**
 * Cross-references an incident's content against historical incident patterns
 * to calculate automated severity score (0-100) and AI-recommended priority.
 */
export function calculateAIRecommendedPriority(
  data: {
    title?: string;
    description?: string;
    callerTranscript?: string;
    category?: string;
    address?: string;
    priority?: PriorityLevel;
  }
): AIRecommendedPriority {
  const corpus = [
    data.title || '',
    data.description || '',
    data.callerTranscript || '',
    data.category || '',
    data.address || '',
  ]
    .join(' ')
    .toLowerCase();

  // 1. Identify best-matching historical incident cluster
  let bestCluster: HistoricalClusterDefinition = HISTORICAL_INCIDENT_CLUSTERS[0];
  let highestMatchScore = 0;

  for (const cluster of HISTORICAL_INCIDENT_CLUSTERS) {
    let matchScore = 0;
    if (data.category && cluster.category.toLowerCase() === data.category.toLowerCase()) {
      matchScore += 25;
    }
    for (const kw of cluster.keywords) {
      if (corpus.includes(kw)) {
        matchScore += 18;
      }
    }
    if (matchScore > highestMatchScore) {
      highestMatchScore = matchScore;
      bestCluster = cluster;
    }
  }

  // 2. Compute component scores with domain logic
  // A. Life Safety Score (0 - 35)
  let lifeSafety = 8;
  if (
    corpus.includes('11kv') ||
    corpus.includes('high voltage') ||
    corpus.includes('electrocution') ||
    corpus.includes('arcing') ||
    corpus.includes('sparking') ||
    corpus.includes('gas leak') ||
    corpus.includes('collapse')
  ) {
    lifeSafety = 34;
  } else if (corpus.includes('water main') || corpus.includes('flood') || corpus.includes('sinkhole') || corpus.includes('traffic signal')) {
    lifeSafety = 22;
  } else if (corpus.includes('pothole') || corpus.includes('crater') || corpus.includes('streetlight')) {
    lifeSafety = 14;
  }

  // B. Infrastructure Cascading Impact Score (0 - 25)
  let infrastructure = 6;
  if (
    corpus.includes('substation') ||
    corpus.includes('11kv') ||
    corpus.includes('feeder') ||
    corpus.includes('water main') ||
    corpus.includes('subgrade') ||
    corpus.includes('arterial')
  ) {
    infrastructure = 24;
  } else if (corpus.includes('100ft road') || corpus.includes('cmh road') || corpus.includes('stormwater') || corpus.includes('junction')) {
    infrastructure = 18;
  } else {
    infrastructure = 9;
  }

  // C. Historical Escalation Probability Score (0 - 20)
  const escalation = Math.round((bestCluster.historicalEscalationRatePct / 100) * 20);

  // D. Demographic & Critical Corridor Vulnerability Score (0 - 20)
  let demographic = 5;
  if (
    corpus.includes('school') ||
    corpus.includes('children') ||
    corpus.includes('hospital') ||
    corpus.includes('pedestrian') ||
    corpus.includes('metro')
  ) {
    demographic = 19;
  } else if (corpus.includes('market') || corpus.includes('commercial') || corpus.includes('100ft') || corpus.includes('cmh')) {
    demographic = 14;
  } else {
    demographic = 8;
  }

  // Overall automated score (bounded 0 - 100)
  const overallScore = Math.min(100, Math.max(10, lifeSafety + infrastructure + escalation + demographic));

  // Determine recommended priority based on calibrated severity thresholds
  let recommendedPriority: PriorityLevel;
  let recommendedPriorityLabel: string;

  if (overallScore >= 85) {
    recommendedPriority = 'P1';
    recommendedPriorityLabel = 'P1 - Critical Hazard (Life Safety)';
  } else if (overallScore >= 65) {
    recommendedPriority = 'P2';
    recommendedPriorityLabel = 'P2 - Urgent Infrastructure Disruption';
  } else if (overallScore >= 42) {
    recommendedPriority = 'P3';
    recommendedPriorityLabel = 'P3 - Standard Operational Dispatch';
  } else {
    recommendedPriority = 'P4';
    recommendedPriorityLabel = 'P4 - Routine Shift Maintenance';
  }

  const scoreBreakdown: SeverityScoreBreakdown = {
    overallScore,
    lifeSafetyScore: lifeSafety,
    infrastructureImpactScore: infrastructure,
    escalationProbabilityScore: escalation,
    demographicVulnerabilityScore: demographic,
  };

  // Build the historical pattern match container
  const historicalPattern: HistoricalPatternMatch = {
    patternClusterId: bestCluster.clusterId,
    historicalMatchConfidence: Math.min(99.4, Math.max(76.2, 70 + (highestMatchScore * 0.4))),
    similarIncidentsCount: bestCluster.similarIncidentsCount,
    historicalEscalationRatePct: bestCluster.historicalEscalationRatePct,
    avgHistoricalResolutionHours: bestCluster.avgResolutionHours,
    historicalPrecedentNote: bestCluster.precedentDescription,
  };

  const rationale = `Automated score of ${overallScore}/100 derived from cross-referencing against ${bestCluster.similarIncidentsCount} historical incidents in ${bestCluster.name}. Identified ${bestCluster.historicalEscalationRatePct}% historical 30-min escalation risk. Primary severity driver: ${
    lifeSafety > 25 ? 'Immediate life-safety hazard in pedestrian corridor' : infrastructure > 15 ? 'Critical municipal utility distribution disruption' : 'Municipal transit corridor degradation'
  }.`;

  return {
    recommendedPriority,
    recommendedPriorityLabel,
    automatedSeverityScore: overallScore,
    scoreBreakdown,
    historicalPattern,
    rationale,
    reviewStatus: 'pending_review',
  };
}

/**
 * Returns formatted style tokens for severity score badges
 */
export function getSeverityScoreStyle(score: number) {
  if (score >= 85) {
    return {
      bg: 'bg-red-50 text-red-900 border-red-300',
      fillColor: '#BA1A1A',
      badgeBg: 'bg-[#BA1A1A] text-white',
      label: 'Critical Hazard',
    };
  }
  if (score >= 65) {
    return {
      bg: 'bg-amber-50 text-amber-900 border-amber-300',
      fillColor: '#D97706',
      badgeBg: 'bg-[#D97706] text-white',
      label: 'High Severity',
    };
  }
  if (score >= 42) {
    return {
      bg: 'bg-blue-50 text-blue-900 border-blue-300',
      fillColor: '#0259C5',
      badgeBg: 'bg-[#0259C5] text-white',
      label: 'Moderate Severity',
    };
  }
  return {
    bg: 'bg-slate-50 text-slate-800 border-slate-300',
    fillColor: '#64748B',
    badgeBg: 'bg-slate-700 text-white',
    label: 'Routine Severity',
  };
}
