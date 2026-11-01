import { Incident } from '../types/incident';
import { calculateAIRecommendedPriority } from '../utils/aiPriorityScorer';

const RAW_INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-01',
    code: 'CV-8490',
    title: '11kV High-Tension Feeder Cable Snap & Severe Subgrade Arcing in Standing Water',
    category: 'Power Grid',
    priority: 'P1',
    priorityLabel: 'Critical - Life Safety',
    status: 'triaged',
    location: {
      address: '12th Main Road (Opp. National Public School Gate 2)',
      district: 'Ward 112 - Indiranagar Core',
      crossStreet: '12th Main Rd & 5th Cross',
      lat: 12.9784,
      lng: 77.6408,
      mapX: 48,
      mapY: 42,
    },
    reportedAt: '2026-11-01T01:04:12Z',
    slaDeadlineSeconds: 580, // ~9.6 minutes left on 15m SLA
    initialSlaMinutes: 15,
    caller: {
      name: 'Capt. Marcus Vance',
      contact: 'Transit Safety Unit 12',
      channel: '911 Emergency Bridge',
      recordedAt: '01:04:12 UTC',
    },
    callerTranscript:
      'High-voltage underground 11kV electrical feeder wire snapped and sparking in standing water right outside National Public School Gate 2 on 12th Main Road during road trenching work. Children and pedestrians walking past. Imminent electrocution hazard.',
    hasAudio: true,
    audioDuration: '00:38',
    imageUrl:
      'https://images.unsplash.com/photo-1516216628859-9bcceabb84ca?auto=format&fit=crop&w=1200&q=80',
    aiConfidence: 98.4,
    aiModel: 'Gemini 3.8 Flash - Municipal Engine',
    municipalCode: 'Muni Code §44.2 - High Voltage Right-of-Way Life Safety Protocol',
    aiSummary:
      'Catastrophic 11kV high-tension feeder cable severance submerged in street runoff. High risk of fatal electrical ground currents in active school corridor. Dual BESCOM and BBMP emergency isolation mandatory.',
    riskAssessment: {
      publicSafety: 'Critical',
      infrastructure: 'Critical',
      financialLiability: 'Critical',
    },
    primaryAgency: 'BESCOM Electrical Emergency Dispatch',
    secondaryAgencies: ['BBMP Road Infrastructure Squad', 'Traffic Police East Zone'],
    assignedUnits: [
      { unitId: 'BESCOM-09', agency: 'BESCOM', type: 'High-Voltage Isolation Bucket', status: 'En Route', etaMinutes: 4 },
      { unitId: 'BBMP-112', agency: 'BBMP Infra', type: 'Hazard Cordon Cruiser', status: 'En Route', etaMinutes: 3 },
    ],
    recommendedActions: [
      'Remotely trigger Indiranagar Substation Feeder 14 trip to de-energize 12th Main trunk',
      'Establish 300-meter pedestrian exclusion perimeter between 5th and 7th Cross',
      'Deploy dry powder electrical fire suppression units on scene',
    ],
    auditTrail: [
      {
        id: 'aud-01',
        timestamp: '01:04:15 UTC',
        actor: 'SYSTEM_TELEMETRY',
        actorName: 'SCADA Circuit Sensor #BES-112',
        action: 'Ground Fault Alert Triggered',
        details: 'Circuit impedance plummeted indicating catastrophic ground path.',
      },
      {
        id: 'aud-02',
        timestamp: '01:04:22 UTC',
        actor: 'AI_AUTOMATION',
        actorName: 'Gemini 3.8 Flash Engine',
        action: 'Algorithmic P1 Life-Safety Triage Generated',
        details: 'Assigned P1 priority with 98.4% confidence rating. Correlated with 911 audio bridge ingest.',
      },
      {
        id: 'aud-03',
        timestamp: '01:05:01 UTC',
        actor: 'HUMAN_OPERATOR',
        actorName: 'Inspector R. Sharma (Ward 112 Command)',
        action: 'Preliminary Intake Verified',
        details: 'Incident queued for unit dispatch authorization.',
      },
    ],
  },
  {
    id: 'inc-02',
    code: 'CV-8491',
    title: '36-Inch Potable Water Trunk Main Catastrophic Rupture & Vault Flooding',
    category: 'Water & Utilities',
    priority: 'P1',
    priorityLabel: 'Critical - Life Safety',
    status: 'dispatched',
    location: {
      address: '100 Feet Road at CMH Road Junction',
      district: 'Ward 112 - Indiranagar Core',
      crossStreet: '100ft Road & CMH Road',
      lat: 12.9788,
      lng: 77.6445,
      mapX: 62,
      mapY: 28,
    },
    reportedAt: '2026-11-01T00:52:40Z',
    slaDeadlineSeconds: 140, // Under 3 mins left
    initialSlaMinutes: 15,
    caller: {
      name: 'BWSSB Watch Officer P. Nair',
      contact: 'Control Center Terminal',
      channel: 'IoT Telemetry Sensor',
      recordedAt: '00:52:40 UTC',
    },
    callerTranscript:
      '36-inch ductile iron water trunk burst at the 100ft and CMH Road intersection. Water geyser 15 feet high washing out road foundation. Surrounding electrical vaults submerged. Immediate water shutoff required.',
    hasAudio: true,
    audioDuration: '00:44',
    imageUrl:
      'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    aiConfidence: 99.1,
    aiModel: 'Gemini 3.8 Flash - Municipal Engine',
    municipalCode: 'Muni Code §44.2 - High Volume Arterial Flooding & Subsurface Cavitation',
    aiSummary:
      'Catastrophic potable water main burst with severe pavement buckling along primary commercial artery. Threatens underground telecom conduits and Metro foundation.',
    riskAssessment: {
      publicSafety: 'Critical',
      infrastructure: 'Critical',
      financialLiability: 'High',
    },
    primaryAgency: 'BWSSB Rapid Main Isolation Squad',
    secondaryAgencies: ['BBMP Road Infra', 'BESCOM Safety Division'],
    assignedUnits: [
      { unitId: 'BWSSB-04', agency: 'BWSSB', type: 'Supervisory Valve Truck', status: 'En Route', etaMinutes: 5 },
      { unitId: 'BBMP-T1', agency: 'BBMP Infra', type: 'Arterial Barricade Van', status: 'On Scene', etaMinutes: 0 },
    ],
    recommendedActions: [
      'Remotely turn SCADA Isolation Valves #V-112A and #V-112B',
      'Divert eastbound 100 Feet Road traffic to Old Airport Road',
      'Pump flooded electrical vaults prior to re-energizing circuits',
    ],
    auditTrail: [
      {
        id: 'aud-21',
        timestamp: '00:52:45 UTC',
        actor: 'AI_AUTOMATION',
        actorName: 'Gemini 3.8 Flash Engine',
        action: 'P1 Arterial Flooding Alert Triaged',
        details: 'Evaluated pressure sensor drop and caller transcript. Confidence 99.1%.',
      },
    ],
  },
  {
    id: 'inc-03',
    code: 'CV-8492',
    title: 'Deep Subgrade Roadbed Cavitation & 4-Foot Sinkhole on 100 Feet Road',
    category: 'Public Works',
    priority: 'P2',
    priorityLabel: 'Urgent - Infrastructure',
    status: 'en_route',
    location: {
      address: '100 Feet Road (Near Indiranagar Metro Station)',
      district: 'Ward 112 - Indiranagar East',
      crossStreet: '100ft Road & 2nd Stage',
      lat: 12.9754,
      lng: 77.6432,
      mapX: 74,
      mapY: 18,
    },
    reportedAt: '2026-11-01T00:38:15Z',
    slaDeadlineSeconds: 1120, // ~18 mins remaining on 45m SLA
    initialSlaMinutes: 45,
    caller: {
      name: 'Metro Security Control',
      contact: 'Indiranagar Station Command',
      channel: 'Municipal Patrol Radio',
      recordedAt: '00:38:15 UTC',
    },
    callerTranscript:
      'Asphalt collapsed creating a 4-foot deep void in the right-hand bus lane. Delivery trucks bottoming out and pedestrians falling. Hollow void seems to extend under the footpath.',
    hasAudio: false,
    audioDuration: '00:00',
    imageUrl:
      'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    aiConfidence: 94.6,
    aiModel: 'Gemini 3.8 Flash - Municipal Engine',
    municipalCode: 'Muni Code §22.9 - Pavement Structural Integrity Breach',
    aiSummary:
      'Rapidly expanding roadbed cavitation directly adjacent to mass transit pillar footing. Heavy vehicle vibration poses immediate collapse threat.',
    riskAssessment: {
      publicSafety: 'High',
      infrastructure: 'High',
      financialLiability: 'Medium',
    },
    primaryAgency: 'BBMP Road Infrastructure - Heavy Asphalt Div',
    secondaryAgencies: ['Bangalore Metro Rail Structural Inspection'],
    assignedUnits: [
      { unitId: 'BBMP-R9', agency: 'BBMP Infra', type: 'Steel Road Plating Crew', status: 'En Route', etaMinutes: 7 },
    ],
    recommendedActions: [
      'Install heavy 1-inch steel road decking over the sinkhole immediately',
      'Close right lane and direct buses to center carriageway',
      'Conduct ground penetrating radar survey of subgrade void',
    ],
    auditTrail: [
      {
        id: 'aud-31',
        timestamp: '00:38:18 UTC',
        actor: 'AI_AUTOMATION',
        actorName: 'Gemini 3.8 Flash Engine',
        action: 'Triaged as P2 Arterial Priority',
        details: 'Confidence 94.6%. Flagged metro pillar proximity.',
      },
    ],
  },
  {
    id: 'inc-04',
    code: 'CV-8493',
    title: 'Multi-Phase Traffic Signal Conflict Lockup on CMH Road & Double Road',
    category: 'Traffic & Transit',
    priority: 'P2',
    priorityLabel: 'Urgent - Infrastructure',
    status: 'triaged',
    location: {
      address: 'CMH Road & Double Road Junction',
      district: 'Ward 112 - North Corridor',
      crossStreet: 'CMH Road & 80 Feet Road',
      lat: 12.9802,
      lng: 77.6415,
      mapX: 34,
      mapY: 22,
    },
    reportedAt: '2026-11-01T00:25:00Z',
    slaDeadlineSeconds: 1650,
    initialSlaMinutes: 45,
    caller: {
      name: 'Traffic Sub-Inspector K. Gowda',
      contact: 'East Division Traffic Cell',
      channel: 'Municipal Patrol Radio',
      recordedAt: '00:25:00 UTC',
    },
    callerTranscript:
      'Signal controller cabinet #CMH-04 frozen in all-red flashing mode. Severe 4-way deadlock extending 1.2 kilometers back to Old Madras Road. Ambulances stuck in backlog.',
    hasAudio: true,
    audioDuration: '00:31',
    imageUrl:
      'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
    aiConfidence: 91.8,
    aiModel: 'Gemini 3.8 Flash - Municipal Engine',
    municipalCode: 'Muni Code §32.6 - Major Arterial Signal Interruption',
    aiSummary:
      'Total signal controller freeze at critical commercial junction. Emergency medical transport path obstructed along CMH hospital corridor.',
    riskAssessment: {
      publicSafety: 'Medium',
      infrastructure: 'High',
      financialLiability: 'High',
    },
    primaryAgency: 'BBMP Traffic Engineering & Signals Cell',
    secondaryAgencies: ['Bangalore Traffic Police (Manual Control)'],
    assignedUnits: [
      { unitId: 'SIG-12', agency: 'BBMP Signals', type: 'Controller Tech Van', status: 'Standby', etaMinutes: 10 },
    ],
    recommendedActions: [
      'Deploy 2 manual traffic officers to manage junction manually',
      'Field hard-reboot controller cabinet and check optical sensor loops',
    ],
    auditTrail: [
      {
        id: 'aud-41',
        timestamp: '00:25:12 UTC',
        actor: 'AI_AUTOMATION',
        actorName: 'Gemini 3.8 Flash Engine',
        action: 'Automated P2 Classification',
        details: 'Assigned P2 Urgent SLA based on emergency vehicle delay metrics.',
      },
    ],
  },
  {
    id: 'inc-05',
    code: 'CV-8494',
    title: 'Storm Sewer Inflow Blinded by Construction Silt on 6th Cross Defence Colony',
    category: 'Public Works',
    priority: 'P3',
    priorityLabel: 'Standard Operational',
    status: 'on_scene',
    location: {
      address: '6th Cross, Defence Colony, Indiranagar',
      district: 'Ward 112 - Defence Colony',
      crossStreet: '6th Cross & 100ft Rd',
      lat: 12.9735,
      lng: 77.6385,
      mapX: 82,
      mapY: 48,
    },
    reportedAt: '2026-10-31T23:15:00Z',
    slaDeadlineSeconds: 3800,
    initialSlaMinutes: 180,
    caller: {
      name: 'Defence Colony RWA Secretary',
      contact: '311 Citizen Portal #4492',
      channel: '311 Citizen Portal',
      recordedAt: '23:15:00 UTC',
    },
    callerTranscript:
      'Stormwater grates are completely covered in wet building sand from the commercial site nearby. Rainwater is standing 10 inches deep across the cul-de-sac and seeping into compound gates.',
    hasAudio: false,
    audioDuration: '00:00',
    imageUrl:
      'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1200&q=80',
    aiConfidence: 93.0,
    aiModel: 'Gemini 3.8 Flash - Municipal Engine',
    municipalCode: 'Muni Code §19.3 - Stormwater Catch Basin Obstruction',
    aiSummary:
      'Severe siltation blinding 3 municipal catch basins. Hydro-vactor squad currently on scene to suction sediment.',
    riskAssessment: {
      publicSafety: 'Low',
      infrastructure: 'Medium',
      financialLiability: 'Low',
    },
    primaryAgency: 'BBMP Solid Waste & Drainage Operations',
    secondaryAgencies: ['BWSSB Stormwater Maintenance'],
    assignedUnits: [
      { unitId: 'VAC-04', agency: 'BBMP Drainage', type: 'Hydro Vactor Suction Truck', status: 'On Scene', etaMinutes: 0 },
    ],
    recommendedActions: [
      'Suction sand and debris barrier from catch basin apertures',
      'Issue stop-work penalty notice to offending construction contractor',
    ],
    auditTrail: [
      {
        id: 'aud-61',
        timestamp: '23:15:15 UTC',
        actor: 'AI_AUTOMATION',
        actorName: 'Gemini 3.8 Flash Engine',
        action: 'Ingested and Classified',
        details: 'Routed to BBMP drainage fleet.',
      },
    ],
  },
  {
    id: 'inc-06',
    code: 'CV-8495',
    title: 'Master LED High-Mast Array Controller Failure at Indiranagar BDA Complex',
    category: 'Power Grid',
    priority: 'P4',
    priorityLabel: 'Routine Maintenance',
    status: 'triaged',
    location: {
      address: 'Indiranagar BDA Complex Commercial Square',
      district: 'Ward 112 - BDA Sector',
      crossStreet: 'Old Airport Rd & 100ft Rd',
      lat: 12.9712,
      lng: 77.6419,
      mapX: 72,
      mapY: 82,
    },
    reportedAt: '2026-10-31T21:00:00Z',
    slaDeadlineSeconds: 32400,
    initialSlaMinutes: 1440,
    caller: {
      name: 'BDA Complex Merchant Assoc.',
      contact: '311 Citizen Portal',
      channel: '311 Citizen Portal',
      recordedAt: '21:00:00 UTC',
    },
    callerTranscript:
      'The central high-mast light cluster in the parking area is completely dark. Contactors failed to close at sunset. Footpath dimly lit.',
    hasAudio: false,
    audioDuration: '00:00',
    imageUrl:
      'https://images.unsplash.com/photo-1572949645841-094f3a9c4c94?auto=format&fit=crop&w=1200&q=80',
    aiConfidence: 96.5,
    aiModel: 'Gemini 3.8 Flash - Municipal Engine',
    municipalCode: 'Muni Code §14.8 - Public Lighting Maintenance',
    aiSummary:
      'Contactor timer failure on high-mast illumination. Scheduled for routine day shift electrical tech visit.',
    riskAssessment: {
      publicSafety: 'Low',
      infrastructure: 'Low',
      financialLiability: 'Low',
    },
    primaryAgency: 'BESCOM Public Lighting Maintenance',
    secondaryAgencies: [],
    assignedUnits: [],
    recommendedActions: [
      'Replace photo-electric timer switch in master junction box',
      'Inspect 8 LED luminaires for thermal degradation',
    ],
    auditTrail: [
      {
        id: 'aud-71',
        timestamp: '21:00:10 UTC',
        actor: 'AI_AUTOMATION',
        actorName: 'Gemini 3.8 Flash Engine',
        action: 'Routine SLA Assigned',
        details: 'Routed to next day shift lighting maintenance roster.',
      },
    ],
  },
];

export const INITIAL_INCIDENTS: Incident[] = RAW_INITIAL_INCIDENTS.map((inc) => {
  const aiRecommendedPriority = calculateAIRecommendedPriority({
    title: inc.title,
    description: inc.aiSummary,
    callerTranscript: inc.callerTranscript,
    category: inc.category,
    address: inc.location.address,
    priority: inc.priority,
  });

  return {
    ...inc,
    aiRecommendedPriority,
  };
});

