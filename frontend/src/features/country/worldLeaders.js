/**
 * World Leaders Data
 * Maps country names to their current head of state/government
 * Photos fetched dynamically from Wikipedia REST API
 */

const WORLD_LEADERS = {
  'United States': { name: 'Donald Trump', title: 'President', wiki: 'Donald_Trump' },
  'China': { name: 'Xi Jinping', title: 'President', wiki: 'Xi_Jinping' },
  'Russia': { name: 'Vladimir Putin', title: 'President', wiki: 'Vladimir_Putin' },
  'United Kingdom': { name: 'Keir Starmer', title: 'Prime Minister', wiki: 'Keir_Starmer' },
  'France': { name: 'Emmanuel Macron', title: 'President', wiki: 'Emmanuel_Macron' },
  'Germany': { name: 'Friedrich Merz', title: 'Chancellor', wiki: 'Friedrich_Merz' },
  'Japan': { name: 'Shigeru Ishiba', title: 'Prime Minister', wiki: 'Shigeru_Ishiba' },
  'India': { name: 'Narendra Modi', title: 'Prime Minister', wiki: 'Narendra_Modi' },
  'Brazil': { name: 'Luiz Inácio Lula da Silva', title: 'President', wiki: 'Luiz_In%C3%A1cio_Lula_da_Silva' },
  'Canada': { name: 'Mark Carney', title: 'Prime Minister', wiki: 'Mark_Carney' },
  'Australia': { name: 'Anthony Albanese', title: 'Prime Minister', wiki: 'Anthony_Albanese' },
  'South Korea': { name: 'Han Duck-soo', title: 'Acting President', wiki: 'Han_Duck-soo' },
  'Mexico': { name: 'Claudia Sheinbaum', title: 'President', wiki: 'Claudia_Sheinbaum' },
  'Italy': { name: 'Giorgia Meloni', title: 'Prime Minister', wiki: 'Giorgia_Meloni' },
  'Spain': { name: 'Pedro Sánchez', title: 'Prime Minister', wiki: 'Pedro_S%C3%A1nchez' },
  'Turkey': { name: 'Recep Tayyip Erdoğan', title: 'President', wiki: 'Recep_Tayyip_Erdo%C4%9Fan' },
  'Saudi Arabia': { name: 'Mohammed bin Salman', title: 'Crown Prince & PM', wiki: 'Mohammed_bin_Salman' },
  'Iran': { name: 'Masoud Pezeshkian', title: 'President', wiki: 'Masoud_Pezeshkian' },
  'Israel': { name: 'Benjamin Netanyahu', title: 'Prime Minister', wiki: 'Benjamin_Netanyahu' },
  'Egypt': { name: 'Abdel Fattah el-Sisi', title: 'President', wiki: 'Abdel_Fattah_el-Sisi' },
  'South Africa': { name: 'Cyril Ramaphosa', title: 'President', wiki: 'Cyril_Ramaphosa' },
  'Nigeria': { name: 'Bola Tinubu', title: 'President', wiki: 'Bola_Tinubu' },
  'Argentina': { name: 'Javier Milei', title: 'President', wiki: 'Javier_Milei' },
  'Indonesia': { name: 'Prabowo Subianto', title: 'President', wiki: 'Prabowo_Subianto' },
  'Poland': { name: 'Donald Tusk', title: 'Prime Minister', wiki: 'Donald_Tusk' },
  'Netherlands': { name: 'Dick Schoof', title: 'Prime Minister', wiki: 'Dick_Schoof' },
  'Sweden': { name: 'Ulf Kristersson', title: 'Prime Minister', wiki: 'Ulf_Kristersson' },
  'Norway': { name: 'Jonas Gahr Støre', title: 'Prime Minister', wiki: 'Jonas_Gahr_St%C3%B8re' },
  'Switzerland': { name: 'Karin Keller-Sutter', title: 'President', wiki: 'Karin_Keller-Sutter' },
  'Ukraine': { name: 'Volodymyr Zelenskyy', title: 'President', wiki: 'Volodymyr_Zelenskyy' },
  'Pakistan': { name: 'Shehbaz Sharif', title: 'Prime Minister', wiki: 'Shehbaz_Sharif' },
  'Thailand': { name: 'Paetongtarn Shinawatra', title: 'Prime Minister', wiki: 'Paetongtarn_Shinawatra' },
  'Philippines': { name: 'Bongbong Marcos', title: 'President', wiki: 'Bongbong_Marcos' },
  'Vietnam': { name: 'Tô Lâm', title: 'General Secretary', wiki: 'T%C3%B4_L%C3%A2m' },
  'Colombia': { name: 'Gustavo Petro', title: 'President', wiki: 'Gustavo_Petro' },
  'Chile': { name: 'Gabriel Boric', title: 'President', wiki: 'Gabriel_Boric' },
  'New Zealand': { name: 'Christopher Luxon', title: 'Prime Minister', wiki: 'Christopher_Luxon' },
  'Greece': { name: 'Kyriakos Mitsotakis', title: 'Prime Minister', wiki: 'Kyriakos_Mitsotakis' },
  'Portugal': { name: 'Luís Montenegro', title: 'Prime Minister', wiki: 'Lu%C3%ADs_Montenegro_(politician)' },
  'Denmark': { name: 'Mette Frederiksen', title: 'Prime Minister', wiki: 'Mette_Frederiksen' },
  'Finland': { name: 'Petteri Orpo', title: 'Prime Minister', wiki: 'Petteri_Orpo' },
  'Taiwan': { name: 'Lai Ching-te', title: 'President', wiki: 'Lai_Ching-te' },
  'Singapore': { name: 'Lawrence Wong', title: 'Prime Minister', wiki: 'Lawrence_Wong' },
  'Malaysia': { name: 'Anwar Ibrahim', title: 'Prime Minister', wiki: 'Anwar_Ibrahim' },
  'Kenya': { name: 'William Ruto', title: 'President', wiki: 'William_Ruto' },
  'Ethiopia': { name: 'Abiy Ahmed', title: 'Prime Minister', wiki: 'Abiy_Ahmed' },
  'North Korea': { name: 'Kim Jong Un', title: 'Supreme Leader', wiki: 'Kim_Jong_Un' },
  'Cuba': { name: 'Miguel Díaz-Canel', title: 'President', wiki: 'Miguel_D%C3%ADaz-Canel' },
  'Venezuela': { name: 'Nicolás Maduro', title: 'President', wiki: 'Nicol%C3%A1s_Maduro' },
  'Iraq': { name: 'Mohammed Shia al-Sudani', title: 'Prime Minister', wiki: 'Mohammed_Shia%27_al-Sudani' },
  'Peru': { name: 'Dina Boluarte', title: 'President', wiki: 'Dina_Boluarte' },
};

// Cache for fetched Wikipedia thumbnails
const photoCache = new Map();

/**
 * Fetch leader photo from Wikipedia REST API
 * Returns an embeddable thumbnail URL
 */
export async function fetchLeaderPhoto(wikiTitle) {
  if (!wikiTitle) return null;
  if (photoCache.has(wikiTitle)) return photoCache.get(wikiTitle);

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`,
      { headers: { 'Accept': 'application/json' } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const url = data.thumbnail?.source || null;
    photoCache.set(wikiTitle, url);
    return url;
  } catch {
    photoCache.set(wikiTitle, null);
    return null;
  }
}

export function getLeader(countryName) {
  return WORLD_LEADERS[countryName] || null;
}

export default WORLD_LEADERS;
