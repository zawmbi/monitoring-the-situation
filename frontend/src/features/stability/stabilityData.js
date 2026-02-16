/**
 * Stability Data — baseline global protest, military, and instability events
 * OSINT-derived from public reporting. Enriched with live GDELT data.
 */

// ── Known ongoing protest / unrest zones ──
export const BASELINE_PROTESTS = [
  { id: 'p-ir', country: 'Iran', code: 'IR', lat: 35.69, lon: 51.39, intensity: 8, label: 'Anti-regime protests', type: 'protest' },
  { id: 'p-mm', country: 'Myanmar', code: 'MM', lat: 19.76, lon: 96.08, intensity: 9, label: 'Anti-junta resistance', type: 'resistance' },
  { id: 'p-bd', country: 'Bangladesh', code: 'BD', lat: 23.81, lon: 90.41, intensity: 7, label: 'Political unrest', type: 'protest' },
  { id: 'p-ve', country: 'Venezuela', code: 'VE', lat: 10.49, lon: -66.88, intensity: 7, label: 'Opposition protests', type: 'protest' },
  { id: 'p-ke', country: 'Kenya', code: 'KE', lat: -1.29, lon: 36.82, intensity: 6, label: 'Anti-tax protests', type: 'protest' },
  { id: 'p-ng', country: 'Nigeria', code: 'NG', lat: 9.06, lon: 7.49, intensity: 6, label: 'Cost-of-living protests', type: 'protest' },
  { id: 'p-pk', country: 'Pakistan', code: 'PK', lat: 33.69, lon: 73.04, intensity: 6, label: 'Political protests', type: 'protest' },
  { id: 'p-ge', country: 'Georgia', code: 'GE', lat: 41.69, lon: 44.80, intensity: 7, label: 'Pro-EU protests', type: 'protest' },
  { id: 'p-il', country: 'Israel', code: 'IL', lat: 32.07, lon: 34.78, intensity: 7, label: 'Judicial reform protests', type: 'protest' },
  { id: 'p-fr', country: 'France', code: 'FR', lat: 48.86, lon: 2.35, intensity: 5, label: 'Political protests', type: 'protest' },
  { id: 'p-co', country: 'Colombia', code: 'CO', lat: 4.71, lon: -74.07, intensity: 5, label: 'Peace process protests', type: 'protest' },
  { id: 'p-pe', country: 'Peru', code: 'PE', lat: -12.05, lon: -77.04, intensity: 5, label: 'Political crisis', type: 'protest' },
  { id: 'p-sd', country: 'Sudan', code: 'SD', lat: 15.50, lon: 32.56, intensity: 8, label: 'Civil conflict unrest', type: 'unrest' },
  { id: 'p-ht', country: 'Haiti', code: 'HT', lat: 18.54, lon: -72.34, intensity: 8, label: 'Gang violence / unrest', type: 'unrest' },
  { id: 'p-sy', country: 'Syria', code: 'SY', lat: 33.51, lon: 36.29, intensity: 7, label: 'Post-transition instability', type: 'unrest' },
  { id: 'p-in', country: 'India', code: 'IN', lat: 28.61, lon: 77.21, intensity: 4, label: 'Regional protests', type: 'protest' },
  { id: 'p-mx', country: 'Mexico', code: 'MX', lat: 19.43, lon: -99.13, intensity: 4, label: 'Cartel violence protests', type: 'protest' },
  { id: 'p-eg', country: 'Egypt', code: 'EG', lat: 30.04, lon: 31.24, intensity: 3, label: 'Economic grievances', type: 'protest' },
  { id: 'p-tr', country: 'Turkey', code: 'TR', lat: 39.93, lon: 32.86, intensity: 4, label: 'Political tensions', type: 'protest' },
  { id: 'p-th', country: 'Thailand', code: 'TH', lat: 13.76, lon: 100.50, intensity: 4, label: 'Democracy movement', type: 'protest' },
];

// ── Known military movement indicators ──
export const BASELINE_MILITARY = [
  { id: 'm-cn-tw', country: 'China', code: 'CN', lat: 24.50, lon: 119.50, severity: 'critical', force: 'navy', label: 'PLA Taiwan Strait patrols', type: 'naval_patrol' },
  { id: 'm-cn-scs', country: 'China', code: 'CN', lat: 14.50, lon: 114.50, severity: 'high', force: 'navy', label: 'South China Sea buildup', type: 'buildup' },
  { id: 'm-ru-arctic', country: 'Russia', code: 'RU', lat: 69.35, lon: 33.08, severity: 'elevated', force: 'mixed', label: 'Arctic military buildup', type: 'buildup' },
  { id: 'm-ru-baltic', country: 'Russia', code: 'RU', lat: 54.71, lon: 20.51, severity: 'high', force: 'navy', label: 'Baltic Fleet activity', type: 'naval_patrol' },
  { id: 'm-kp', country: 'North Korea', code: 'KP', lat: 39.03, lon: 125.75, severity: 'high', force: 'missile', label: 'Missile test preparations', type: 'missile_test' },
  { id: 'm-ir-hormuz', country: 'Iran', code: 'IR', lat: 26.56, lon: 56.27, severity: 'elevated', force: 'navy', label: 'Strait of Hormuz naval activity', type: 'naval_patrol' },
  { id: 'm-in-lac', country: 'India', code: 'IN', lat: 34.50, lon: 78.00, severity: 'elevated', force: 'army', label: 'LAC border deployments', type: 'deployment' },
  { id: 'm-nato-east', country: 'Poland', code: 'PL', lat: 51.25, lon: 22.57, severity: 'elevated', force: 'mixed', label: 'NATO eastern flank reinforcement', type: 'deployment' },
  { id: 'm-us-indopac', country: 'Japan', code: 'JP', lat: 26.50, lon: 127.77, severity: 'elevated', force: 'navy', label: 'US Indo-Pacific force posture', type: 'deployment' },
  { id: 'm-ru-ua', country: 'Russia', code: 'RU', lat: 50.40, lon: 36.60, severity: 'critical', force: 'army', label: 'Ukraine border forces', type: 'deployment' },
  { id: 'm-ir-prx', country: 'Iraq', code: 'IQ', lat: 33.30, lon: 44.37, severity: 'elevated', force: 'militia', label: 'Iran-backed militia movements', type: 'proxy' },
  { id: 'm-ye-houthi', country: 'Yemen', code: 'YE', lat: 15.35, lon: 44.21, severity: 'high', force: 'navy', label: 'Red Sea/Houthi maritime threat', type: 'naval_patrol' },
  { id: 'm-et', country: 'Ethiopia', code: 'ET', lat: 9.02, lon: 38.75, severity: 'elevated', force: 'army', label: 'Post-Tigray troop movements', type: 'deployment' },
  { id: 'm-ph-scs', country: 'Philippines', code: 'PH', lat: 10.30, lon: 118.50, severity: 'elevated', force: 'coast_guard', label: 'Second Thomas Shoal patrols', type: 'naval_patrol' },
];

// ── Known instability / assassination / coup alerts ──
export const BASELINE_INSTABILITY = [
  { id: 'i-mm', country: 'Myanmar', code: 'MM', lat: 19.76, lon: 96.08, type: 'coup', severity: 'critical', headline: 'Military junta faces armed resistance nationwide' },
  { id: 'i-sd', country: 'Sudan', code: 'SD', lat: 15.50, lon: 32.56, type: 'political_crisis', severity: 'critical', headline: 'Civil war between SAF and RSF' },
  { id: 'i-ht', country: 'Haiti', code: 'HT', lat: 18.54, lon: -72.34, type: 'political_crisis', severity: 'critical', headline: 'Gang control / political vacuum' },
  { id: 'i-sy', country: 'Syria', code: 'SY', lat: 33.51, lon: 36.29, type: 'regime_change', severity: 'high', headline: 'Post-Assad political transition' },
  { id: 'i-ly', country: 'Libya', code: 'LY', lat: 32.90, lon: 13.18, type: 'political_crisis', severity: 'high', headline: 'Dual government / political fragmentation' },
  { id: 'i-ye', country: 'Yemen', code: 'YE', lat: 15.35, lon: 44.21, type: 'political_crisis', severity: 'high', headline: 'Houthi control vs recognized government' },
  { id: 'i-af', country: 'Afghanistan', code: 'AF', lat: 34.52, lon: 69.17, type: 'regime_change', severity: 'high', headline: 'Taliban governance / resistance activity' },
  { id: 'i-so', country: 'Somalia', code: 'SO', lat: 2.05, lon: 45.32, type: 'political_crisis', severity: 'high', headline: 'Al-Shabaab insurgency threatens government' },
  { id: 'i-cd', country: 'DRC', code: 'CD', lat: -1.68, lon: 29.22, type: 'political_crisis', severity: 'high', headline: 'Eastern DRC armed group conflict' },
  { id: 'i-ss', country: 'South Sudan', code: 'SS', lat: 4.85, lon: 31.60, type: 'political_crisis', severity: 'high', headline: 'Delayed elections / factional violence' },
  { id: 'i-et', country: 'Ethiopia', code: 'ET', lat: 9.02, lon: 38.75, type: 'political_crisis', severity: 'elevated', headline: 'Post-Tigray regional instability' },
  { id: 'i-ve', country: 'Venezuela', code: 'VE', lat: 10.49, lon: -66.88, type: 'political_crisis', severity: 'elevated', headline: 'Contested election / Maduro power grab' },
  { id: 'i-ni', country: 'Nicaragua', code: 'NI', lat: 12.11, lon: -86.24, type: 'political_crisis', severity: 'elevated', headline: 'Ortega authoritarian consolidation' },
  { id: 'i-ml', country: 'Mali', code: 'ML', lat: 12.64, lon: -8.00, type: 'coup', severity: 'elevated', headline: 'Military junta / Wagner presence' },
  { id: 'i-bf', country: 'Burkina Faso', code: 'BF', lat: 12.37, lon: -1.52, type: 'coup', severity: 'elevated', headline: 'Post-coup military governance' },
  { id: 'i-ne', country: 'Niger', code: 'NE', lat: 13.51, lon: 2.13, type: 'coup', severity: 'elevated', headline: 'Post-coup military junta' },
  { id: 'i-ga', country: 'Gabon', code: 'GA', lat: 0.39, lon: 9.45, type: 'coup', severity: 'moderate', headline: 'Post-coup transitional government' },
  { id: 'i-ge', country: 'Georgia', code: 'GE', lat: 41.69, lon: 44.80, type: 'political_crisis', severity: 'elevated', headline: 'Democratic backsliding / Russian influence' },
  { id: 'i-bd', country: 'Bangladesh', code: 'BD', lat: 23.81, lon: 90.41, type: 'political_crisis', severity: 'elevated', headline: 'Post-uprising interim government' },
  { id: 'i-pk', country: 'Pakistan', code: 'PK', lat: 33.69, lon: 73.04, type: 'political_crisis', severity: 'elevated', headline: 'Political crisis / military influence' },
];

// ── US Military Installations (OSINT / public DOD data) ──
// Major Operating Bases (MOB), Forward Operating Sites (FOS),
// and Cooperative Security Locations (CSL) worldwide
export const US_INSTALLATIONS = [
  // ═══ EUCOM — US European Command ═══
  { id: 'usb-ramstein', name: 'Ramstein AB', code: 'US', lat: 49.44, lon: 7.60, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'EUCOM', personnel: 9200, label: 'USAFE-AFAFRICA HQ, 86th Airlift Wing. Key C2 & airlift hub for Europe/Africa ops.' },
  { id: 'usb-lakenheath', name: 'RAF Lakenheath', code: 'US', lat: 52.41, lon: 0.56, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'EUCOM', personnel: 4500, label: '48th Fighter Wing (F-35A). Primary USAF fighter base in UK.' },
  { id: 'usb-mildenhall', name: 'RAF Mildenhall', code: 'US', lat: 52.36, lon: 0.49, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'EUCOM', personnel: 3200, label: '100th Air Refueling Wing. Tanker & special ops hub.' },
  { id: 'usb-aviano', name: 'Aviano AB', code: 'US', lat: 46.03, lon: 12.60, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'EUCOM', personnel: 3100, label: '31st Fighter Wing (F-16). Southern Europe forward fighter base.' },
  { id: 'usb-sigonella', name: 'NAS Sigonella', code: 'US', lat: 37.40, lon: 14.92, type: 'Main Operating Base', milType: 'naval_base', branch: 'US Navy', cocom: 'EUCOM', personnel: 4200, label: 'Naval Air Station. P-8A Poseidon ASW/ISR hub for Mediterranean.' },
  { id: 'usb-rota', name: 'Naval Station Rota', code: 'US', lat: 36.63, lon: -6.35, type: 'Main Operating Base', milType: 'naval_base', branch: 'US Navy', cocom: 'EUCOM', personnel: 3400, label: 'Forward-deployed Aegis BMD destroyers. Atlantic/Med gateway.' },
  { id: 'usb-naples', name: 'NSA Naples', code: 'US', lat: 40.82, lon: 14.29, type: 'Main Operating Base', milType: 'naval_base', branch: 'US Navy', cocom: 'EUCOM', personnel: 6000, label: 'US Naval Forces Europe / 6th Fleet HQ.' },
  { id: 'usb-grafenwoehr', name: 'Grafenwoehr', code: 'US', lat: 49.70, lon: 11.93, type: 'Main Operating Base', milType: 'army_base', branch: 'US Army', cocom: 'EUCOM', personnel: 4000, label: '7th Army Training Command. Largest US Army training area in Europe.' },
  { id: 'usb-incirlik', name: 'Incirlik AB', code: 'US', lat: 37.00, lon: 35.43, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'EUCOM', personnel: 5000, label: '39th Air Base Wing. Strategic air base in southern Turkey.' },
  { id: 'usb-souda', name: 'NSA Souda Bay', code: 'US', lat: 35.49, lon: 24.12, type: 'Forward Operating Site', milType: 'naval_base', branch: 'US Navy', cocom: 'EUCOM', personnel: 800, label: 'Eastern Med naval support. Ammunition & fuel depot.' },
  { id: 'usb-moron', name: 'Moron AB', code: 'US', lat: 37.17, lon: -5.62, type: 'Forward Operating Site', milType: 'air_base', branch: 'US Air Force / USMC', cocom: 'EUCOM', personnel: 2200, label: 'SPMAGTF-CR staging base. Rapid response to Africa/Europe crises.' },
  { id: 'usb-bondsteel', name: 'Camp Bondsteel', code: 'US', lat: 42.36, lon: 21.25, type: 'Forward Operating Site', milType: 'army_base', branch: 'US Army', cocom: 'EUCOM', personnel: 7000, label: 'KFOR mission. Largest US base in the Balkans.' },
  { id: 'usb-deveselu', name: 'Deveselu AAMDS', code: 'US', lat: 44.05, lon: 24.47, type: 'Forward Operating Site', milType: 'air_base', branch: 'US Navy / MDA', cocom: 'EUCOM', personnel: 500, label: 'Aegis Ashore Missile Defense Site (SM-3). NATO BMD shield.' },
  { id: 'usb-redzikowo', name: 'Redzikowo AAMDS', code: 'US', lat: 54.48, lon: 17.10, type: 'Main Operating Base', milType: 'air_base', branch: 'US Navy / MDA', cocom: 'EUCOM', personnel: 300, label: 'Aegis Ashore Poland. NATO BMD northern shield, operational 2024.' },
  { id: 'usb-lask', name: 'Lask AB', code: 'US', lat: 51.55, lon: 19.18, type: 'Forward Operating Site', milType: 'air_base', branch: 'US Air Force', cocom: 'EUCOM', personnel: 800, label: 'Rotational USAF fighter detachment. NATO enhanced Air Policing.' },
  { id: 'usb-mihail', name: 'Mihail Kogalniceanu', code: 'US', lat: 44.36, lon: 28.49, type: 'Forward Operating Site', milType: 'army_base', branch: 'US Army / USMC', cocom: 'EUCOM', personnel: 2500, label: 'Rotational BCT deployment. Black Sea deterrence posture.' },
  { id: 'usb-thule', name: 'Pituffik Space Base', code: 'US', lat: 76.53, lon: -68.70, type: 'Main Operating Base', milType: 'intel', branch: 'US Space Force', cocom: 'NORTHCOM', personnel: 600, label: 'Formerly Thule AB. BMEWS radar & satellite tracking. Arctic gateway.' },

  // ═══ INDOPACOM — US Indo-Pacific Command ═══
  { id: 'usb-yokosuka', name: 'CFAY Yokosuka', code: 'US', lat: 35.28, lon: 139.67, type: 'Main Operating Base', milType: 'naval_base', branch: 'US Navy', cocom: 'INDOPACOM', personnel: 11000, label: 'Commander Fleet Activities Yokosuka. 7th Fleet HQ, CVN-76 homeport.' },
  { id: 'usb-kadena', name: 'Kadena AB', code: 'US', lat: 26.35, lon: 127.77, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'INDOPACOM', personnel: 18000, label: '18th Wing — largest USAF wing in Pacific. F-15C/E, KC-135, E-3.' },
  { id: 'usb-humphreys', name: 'Camp Humphreys', code: 'US', lat: 36.96, lon: 127.03, type: 'Main Operating Base', milType: 'army_base', branch: 'US Army', cocom: 'INDOPACOM', personnel: 36000, label: 'USFK / 8th Army HQ. Largest US overseas military base.' },
  { id: 'usb-osan', name: 'Osan AB', code: 'US', lat: 37.09, lon: 127.03, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'INDOPACOM', personnel: 7800, label: '51st Fighter Wing (F-16, A-10). Forward air ops for Korean peninsula.' },
  { id: 'usb-guam', name: 'Andersen AFB', code: 'US', lat: 13.58, lon: 144.92, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'INDOPACOM', personnel: 4000, label: '36th Wing. B-52/B-1/B-2 rotational bomber presence. Pacific power projection.' },
  { id: 'usb-guam-nav', name: 'Naval Base Guam', code: 'US', lat: 13.45, lon: 144.65, type: 'Main Operating Base', milType: 'naval_base', branch: 'US Navy', cocom: 'INDOPACOM', personnel: 6000, label: 'SSN/SSGN submarine base. Marine Corps Base Camp Blaz under construction.' },
  { id: 'usb-diegogarcia', name: 'NSF Diego Garcia', code: 'US', lat: -7.32, lon: 72.41, type: 'Main Operating Base', milType: 'joint_base', branch: 'US Navy / USAF', cocom: 'INDOPACOM', personnel: 3500, label: 'Strategic mid-Indian Ocean base. Bomber staging, SIGINT, prepositioned ships.' },
  { id: 'usb-iwakuni', name: 'MCAS Iwakuni', code: 'US', lat: 34.15, lon: 132.24, type: 'Main Operating Base', milType: 'air_base', branch: 'USMC', cocom: 'INDOPACOM', personnel: 10000, label: '1st MAW. F-35B/C, F/A-18 squadrons. Forward Marine air power.' },
  { id: 'usb-misawa', name: 'Misawa AB', code: 'US', lat: 40.70, lon: 141.37, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'INDOPACOM', personnel: 5200, label: '35th Fighter Wing (F-16). Northern Japan forward air defense.' },
  { id: 'usb-sasebo', name: 'CFAS Sasebo', code: 'US', lat: 33.16, lon: 129.72, type: 'Main Operating Base', milType: 'naval_base', branch: 'US Navy', cocom: 'INDOPACOM', personnel: 4500, label: 'Forward-deployed amphibious ships. Mine countermeasures base.' },
  { id: 'usb-pearl', name: 'JBPHH', code: 'US', lat: 21.35, lon: -157.97, type: 'Main Operating Base', milType: 'joint_base', branch: 'US Navy / USAF', cocom: 'INDOPACOM', personnel: 58000, label: 'Joint Base Pearl Harbor-Hickam. INDOPACOM HQ, Pacific Fleet HQ.' },
  { id: 'usb-kwajalein', name: 'Kwajalein Atoll', code: 'US', lat: 9.40, lon: 167.47, type: 'Forward Operating Site', milType: 'intel', branch: 'US Army / MDA', cocom: 'INDOPACOM', personnel: 2500, label: 'Reagan Test Site. ICBM tracking radar, missile defense testing.' },
  { id: 'usb-darwin', name: 'Robertson Barracks', code: 'US', lat: -12.43, lon: 130.87, type: 'Cooperative Security Location', milType: 'army_base', branch: 'USMC', cocom: 'INDOPACOM', personnel: 2500, label: 'USMC rotational force — Australia. MRF-D (2,500 Marines).' },
  { id: 'usb-clark', name: 'Clark AB (EDCA)', code: 'US', lat: 15.19, lon: 120.56, type: 'Cooperative Security Location', milType: 'air_base', branch: 'US Air Force', cocom: 'INDOPACOM', personnel: 600, label: 'EDCA site. Rotational USAF/USMC access. Prepositioned materiel.' },

  // ═══ CENTCOM — US Central Command ═══
  { id: 'usb-aludeid', name: 'Al Udeid AB', code: 'US', lat: 25.12, lon: 51.31, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'CENTCOM', personnel: 10000, label: 'CENTCOM Forward HQ / AFCENT. CAOC — Combined Air Operations Center.' },
  { id: 'usb-bahrain', name: 'NSA Bahrain', code: 'US', lat: 26.23, lon: 50.62, type: 'Main Operating Base', milType: 'naval_base', branch: 'US Navy', cocom: 'CENTCOM', personnel: 7000, label: '5th Fleet HQ. CTF 50/CTF 51 — Persian Gulf naval operations.' },
  { id: 'usb-arifjan', name: 'Camp Arifjan', code: 'US', lat: 29.15, lon: 48.10, type: 'Main Operating Base', milType: 'army_base', branch: 'US Army', cocom: 'CENTCOM', personnel: 13000, label: 'ARCENT Forward / Third Army. Main logistical hub for Middle East ops.' },
  { id: 'usb-aldhafra', name: 'Al Dhafra AB', code: 'US', lat: 24.25, lon: 54.55, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'CENTCOM', personnel: 3500, label: '380th AEW. F-22, U-2, RQ-4 Global Hawk ISR operations.' },
  { id: 'usb-aljaber', name: 'Ali Al Salem AB', code: 'US', lat: 29.35, lon: 47.52, type: 'Main Operating Base', milType: 'air_base', branch: 'US Air Force', cocom: 'CENTCOM', personnel: 4000, label: '386th AEW. Theater airlift & personnel transit hub.' },
  { id: 'usb-princesultan', name: 'Prince Sultan AB', code: 'US', lat: 24.06, lon: 47.58, type: 'Forward Operating Site', milType: 'air_base', branch: 'US Air Force', cocom: 'CENTCOM', personnel: 2500, label: 'CAOC alternate. Patriot / THAAD air defense. F-15E rotational.' },

  // ═══ AFRICOM — US Africa Command ═══
  { id: 'usb-lemonnier', name: 'Camp Lemonnier', code: 'US', lat: 11.55, lon: 43.15, type: 'Main Operating Base', milType: 'joint_base', branch: 'US Navy / CJTF-HOA', cocom: 'AFRICOM', personnel: 4500, label: 'Only permanent US base in Africa. CJTF-Horn of Africa. CT/ISR ops.' },
  { id: 'usb-agadez', name: 'AB 201 Agadez', code: 'US', lat: 16.97, lon: 7.99, type: 'Forward Operating Site', milType: 'air_base', branch: 'US Air Force', cocom: 'AFRICOM', personnel: 800, label: 'MQ-9 Reaper drone base. ISR operations over Sahel ($110M facility).' },

  // ═══ SOUTHCOM — US Southern Command ═══
  { id: 'usb-gtmo', name: 'NS Guantanamo Bay', code: 'US', lat: 19.90, lon: -75.13, type: 'Main Operating Base', milType: 'naval_base', branch: 'US Navy / JTF-GTMO', cocom: 'SOUTHCOM', personnel: 6000, label: 'Oldest overseas US naval base (1903). Detention facility & naval station.' },
  { id: 'usb-sotocano', name: 'Soto Cano AB', code: 'US', lat: 14.38, lon: -87.62, type: 'Forward Operating Site', milType: 'joint_base', branch: 'US Army / USAF', cocom: 'SOUTHCOM', personnel: 1300, label: 'JTF-Bravo. Counter-narcotics, HADR staging for Central America.' },
  { id: 'usb-curacao', name: 'FOL Curacao', code: 'US', lat: 12.17, lon: -68.96, type: 'Cooperative Security Location', milType: 'air_base', branch: 'US Air Force / CBP', cocom: 'SOUTHCOM', personnel: 200, label: 'Counter-narcotics FOL. P-3, E-2C patrol aircraft rotations.' },
];

// ── US Deployable Fleet Assets (CSGs, ARGs, SSGNs, Bomber TFs) ──
// Positions are baseline OSINT estimates — overridden by live GDELT news when available.
export const US_FLEET_ASSETS = [
  // ═══ Carrier Strike Groups ═══
  { id: 'csg-cvn78', name: 'CSG-12 Gerald R. Ford', hull: 'CVN-78', code: 'US', lat: 36.95, lon: -76.33, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'LANT', personnel: 6500, label: 'USS Gerald R. Ford CSG. F/A-18E/F, E-2D, CMV-22B. Norfolk homeport.', fleetAsset: true },
  { id: 'csg-cvn77', name: 'CSG-10 George H.W. Bush', hull: 'CVN-77', code: 'US', lat: 35.00, lon: 18.00, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'EUCOM', personnel: 6500, label: 'USS George H.W. Bush CSG. Deployed Mediterranean. 6th Fleet AOR.', fleetAsset: true },
  { id: 'csg-cvn75', name: 'CSG-8 Harry S. Truman', hull: 'CVN-75', code: 'US', lat: 18.00, lon: 64.00, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'CENTCOM', personnel: 6500, label: 'USS Harry S. Truman CSG. Arabian Sea / 5th Fleet AOR.', fleetAsset: true },
  { id: 'csg-cvn69', name: 'CSG-2 Dwight D. Eisenhower', hull: 'CVN-69', code: 'US', lat: 36.95, lon: -76.33, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'LANT', personnel: 6500, label: 'USS Dwight D. Eisenhower CSG. Post-deployment Norfolk. Red Sea/Houthi veteran.', fleetAsset: true },
  { id: 'csg-cvn72', name: 'CSG-3 Abraham Lincoln', hull: 'CVN-72', code: 'US', lat: 25.00, lon: 140.00, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'INDOPACOM', personnel: 6500, label: 'USS Abraham Lincoln CSG. Western Pacific deployment. 7th Fleet AOR.', fleetAsset: true },
  { id: 'csg-cvn71', name: 'CSG-9 Theodore Roosevelt', hull: 'CVN-71', code: 'US', lat: 32.68, lon: -117.23, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'PAC', personnel: 6500, label: 'USS Theodore Roosevelt CSG. San Diego homeport. Pacific Fleet.', fleetAsset: true },
  { id: 'csg-cvn70', name: 'CSG-1 Carl Vinson', hull: 'CVN-70', code: 'US', lat: 21.35, lon: -157.97, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'INDOPACOM', personnel: 6500, label: 'USS Carl Vinson CSG. Pacific operations. San Diego homeport.', fleetAsset: true },
  { id: 'csg-cvn73', name: 'CSG-5 George Washington', hull: 'CVN-73', code: 'US', lat: 35.28, lon: 139.67, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'INDOPACOM', personnel: 6500, label: 'USS George Washington CSG. Forward-Deployed Naval Force, Yokosuka Japan.', fleetAsset: true },
  { id: 'csg-cvn68', name: 'CSG-11 Nimitz', hull: 'CVN-68', code: 'US', lat: 47.55, lon: -122.65, type: 'Carrier Strike Group', milType: 'csg', branch: 'US Navy', cocom: 'PAC', personnel: 6500, label: 'USS Nimitz CSG. Bremerton homeport. Pacific Fleet ready reserve.', fleetAsset: true },

  // ═══ Amphibious Ready Groups / MEUs ═══
  { id: 'arg-lha6', name: 'America ARG / 31st MEU', hull: 'LHA-6', code: 'US', lat: 33.16, lon: 129.72, type: 'Amphibious Ready Group', milType: 'arg', branch: 'USN / USMC', cocom: 'INDOPACOM', personnel: 4500, label: 'USS America ARG w/ 31st MEU. Forward-deployed Sasebo. F-35B capable.', fleetAsset: true },
  { id: 'arg-lhd1', name: 'Wasp ARG / 22nd MEU', hull: 'LHD-1', code: 'US', lat: 35.00, lon: 18.00, type: 'Amphibious Ready Group', milType: 'arg', branch: 'USN / USMC', cocom: 'EUCOM', personnel: 4500, label: 'USS Wasp ARG w/ 22nd MEU. Mediterranean deployment. 6th Fleet AOR.', fleetAsset: true },
  { id: 'arg-lhd5', name: 'Bataan ARG / 26th MEU', hull: 'LHD-5', code: 'US', lat: 12.50, lon: 45.00, type: 'Amphibious Ready Group', milType: 'arg', branch: 'USN / USMC', cocom: 'CENTCOM', personnel: 4500, label: 'USS Bataan ARG w/ 26th MEU. Gulf of Aden / 5th Fleet AOR.', fleetAsset: true },
  { id: 'arg-lhd2', name: 'Essex ARG / 13th MEU', hull: 'LHD-2', code: 'US', lat: 32.68, lon: -117.23, type: 'Amphibious Ready Group', milType: 'arg', branch: 'USN / USMC', cocom: 'PAC', personnel: 4500, label: 'USS Essex ARG w/ 13th MEU. San Diego homeport. Pacific Fleet.', fleetAsset: true },
  { id: 'arg-lhd8', name: 'Makin Island ARG / 15th MEU', hull: 'LHD-8', code: 'US', lat: 18.00, lon: 132.00, type: 'Amphibious Ready Group', milType: 'arg', branch: 'USN / USMC', cocom: 'INDOPACOM', personnel: 4500, label: 'USS Makin Island ARG w/ 15th MEU. Philippine Sea / Western Pacific.', fleetAsset: true },

  // ═══ SSGNs (Ohio-class guided-missile submarines — approximate patrol areas) ═══
  { id: 'ssgn-726', name: 'USS Ohio (SSGN-726)', hull: 'SSGN-726', code: 'US', lat: 20.00, lon: 140.00, type: 'Guided-Missile Submarine', milType: 'ssgn', branch: 'US Navy', cocom: 'INDOPACOM', personnel: 155, label: 'Ohio-class SSGN. 154 Tomahawk TLAM. Pacific patrol area (approx).', fleetAsset: true },
  { id: 'ssgn-727', name: 'USS Michigan (SSGN-727)', hull: 'SSGN-727', code: 'US', lat: 13.45, lon: 144.65, type: 'Guided-Missile Submarine', milType: 'ssgn', branch: 'US Navy', cocom: 'INDOPACOM', personnel: 155, label: 'Ohio-class SSGN. 154 Tomahawk TLAM. INDOPACOM forward-deployed.', fleetAsset: true },
  { id: 'ssgn-728', name: 'USS Florida (SSGN-728)', hull: 'SSGN-728', code: 'US', lat: 35.00, lon: 18.00, type: 'Guided-Missile Submarine', milType: 'ssgn', branch: 'US Navy', cocom: 'EUCOM', personnel: 155, label: 'Ohio-class SSGN. 154 Tomahawk TLAM. EUCOM/6th Fleet patrol area.', fleetAsset: true },
  { id: 'ssgn-729', name: 'USS Georgia (SSGN-729)', hull: 'SSGN-729', code: 'US', lat: 26.00, lon: 52.00, type: 'Guided-Missile Submarine', milType: 'ssgn', branch: 'US Navy', cocom: 'CENTCOM', personnel: 155, label: 'Ohio-class SSGN. 154 Tomahawk TLAM. Persian Gulf / 5th Fleet AOR.', fleetAsset: true },

  // ═══ Bomber Task Forces (rotational deployments) ═══
  { id: 'btf-guam', name: 'BTF Guam (B-52H)', hull: null, code: 'US', lat: 13.58, lon: 144.92, type: 'Bomber Task Force', milType: 'btf', branch: 'US Air Force (AFGSC)', cocom: 'INDOPACOM', personnel: 200, label: 'Continuous Bomber Presence. B-52H Stratofortress rotation at Andersen AFB.', fleetAsset: true },
  { id: 'btf-fairford', name: 'BTF Europe (B-1B)', hull: null, code: 'US', lat: 51.68, lon: -1.79, type: 'Bomber Task Force', milType: 'btf', branch: 'US Air Force (AFGSC)', cocom: 'EUCOM', personnel: 200, label: 'Bomber Task Force Europe. B-1B Lancer rotation at RAF Fairford, UK.', fleetAsset: true },
  { id: 'btf-diego', name: 'BTF Indian Ocean (B-2)', hull: null, code: 'US', lat: -7.32, lon: 72.41, type: 'Bomber Task Force', milType: 'btf', branch: 'US Air Force (AFGSC)', cocom: 'INDOPACOM', personnel: 150, label: 'B-2 Spirit rotational deployment. Diego Garcia forward staging.', fleetAsset: true },
];

// ── Region coordinates for GDELT fleet position matching ──
export const FLEET_REGIONS = {
  'mediterranean': { lat: 35.00, lon: 18.00 },
  'persian gulf': { lat: 26.00, lon: 52.00 },
  'arabian gulf': { lat: 26.00, lon: 52.00 },
  'arabian sea': { lat: 18.00, lon: 64.00 },
  'red sea': { lat: 20.00, lon: 38.50 },
  'south china sea': { lat: 14.00, lon: 114.00 },
  'western pacific': { lat: 25.00, lon: 140.00 },
  'west pacific': { lat: 25.00, lon: 140.00 },
  'indian ocean': { lat: -5.00, lon: 73.00 },
  'atlantic': { lat: 35.00, lon: -40.00 },
  'pacific': { lat: 20.00, lon: -150.00 },
  'gulf of aden': { lat: 12.50, lon: 45.00 },
  'east china sea': { lat: 28.00, lon: 125.00 },
  'sea of japan': { lat: 40.00, lon: 135.00 },
  'philippine sea': { lat: 18.00, lon: 132.00 },
  'baltic sea': { lat: 58.00, lon: 19.00 },
  'north sea': { lat: 57.00, lon: 3.00 },
  'arctic': { lat: 72.00, lon: 10.00 },
  'strait of hormuz': { lat: 26.50, lon: 56.30 },
  'taiwan strait': { lat: 24.50, lon: 119.50 },
  'black sea': { lat: 43.00, lon: 35.00 },
  'suez canal': { lat: 30.50, lon: 32.30 },
  'horn of africa': { lat: 11.00, lon: 49.00 },
  'bab el-mandeb': { lat: 12.60, lon: 43.30 },
  'north atlantic': { lat: 50.00, lon: -30.00 },
  'south atlantic': { lat: -15.00, lon: -25.00 },
  'coral sea': { lat: -18.00, lon: 155.00 },
  'yellow sea': { lat: 35.00, lon: 124.00 },
};

// ── Severity color map ──
export const SEVERITY_COLORS = {
  critical: '#ff2222',
  high: '#ff6600',
  elevated: '#ffaa00',
  moderate: '#ffd700',
  low: '#88cc88',
};

// ── Alert type metadata ──
export const ALERT_TYPE_META = {
  assassination: { icon: '🎯', label: 'Assassination', color: '#ff2222' },
  coup: { icon: '⚔', label: 'Coup', color: '#ff4444' },
  regime_change: { icon: '🏛', label: 'Regime Change', color: '#ff6600' },
  political_crisis: { icon: '⚠', label: 'Political Crisis', color: '#ffaa00' },
  martial_law: { icon: '🔒', label: 'Martial Law', color: '#ff3333' },
};

// ── Military force icons ──
export const FORCE_ICONS = {
  navy: '⚓',
  army: '🪖',
  missile: '🚀',
  mixed: '⬡',
  militia: '⚑',
  coast_guard: '🛟',
};

// ── Military severity label ──
export const SEVERITY_LABELS = {
  critical: 'CRITICAL',
  high: 'HIGH',
  elevated: 'ELEVATED',
  low: 'LOW',
};
