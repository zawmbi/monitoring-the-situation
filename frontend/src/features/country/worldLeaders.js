/**
 * World Leaders Data
 * Maps country names to their current head of state/government
 * Photos fetched dynamically from Wikipedia REST API
 */

const WORLD_LEADERS = {
  // ─── Americas ───
  'United States': { name: 'Donald Trump', title: 'President', wiki: 'Donald_Trump' },
  'Canada': { name: 'Mark Carney', title: 'Prime Minister', wiki: 'Mark_Carney' },
  'Mexico': { name: 'Claudia Sheinbaum', title: 'President', wiki: 'Claudia_Sheinbaum' },
  'Brazil': { name: 'Luiz Inácio Lula da Silva', title: 'President', wiki: 'Luiz_In%C3%A1cio_Lula_da_Silva' },
  'Argentina': { name: 'Javier Milei', title: 'President', wiki: 'Javier_Milei' },
  'Colombia': { name: 'Gustavo Petro', title: 'President', wiki: 'Gustavo_Petro' },
  'Chile': { name: 'Gabriel Boric', title: 'President', wiki: 'Gabriel_Boric' },
  'Peru': { name: 'Dina Boluarte', title: 'President', wiki: 'Dina_Boluarte' },
  'Venezuela': { name: 'Nicolás Maduro', title: 'President', wiki: 'Nicol%C3%A1s_Maduro' },
  'Cuba': { name: 'Miguel Díaz-Canel', title: 'President', wiki: 'Miguel_D%C3%ADaz-Canel' },
  'Ecuador': { name: 'Daniel Noboa', title: 'President', wiki: 'Daniel_Noboa' },
  'Guatemala': { name: 'Bernardo Arévalo', title: 'President', wiki: 'Bernardo_Ar%C3%A9valo' },
  'Honduras': { name: 'Xiomara Castro', title: 'President', wiki: 'Xiomara_Castro' },
  'El Salvador': { name: 'Nayib Bukele', title: 'President', wiki: 'Nayib_Bukele' },
  'Costa Rica': { name: 'Rodrigo Chaves', title: 'President', wiki: 'Rodrigo_Chaves_Robles' },
  'Panama': { name: 'José Raúl Mulino', title: 'President', wiki: 'Jos%C3%A9_Ra%C3%BAl_Mulino' },
  'Dominican Republic': { name: 'Luis Abinader', title: 'President', wiki: 'Luis_Abinader' },
  'Haiti': { name: 'Alix Didier Fils-Aimé', title: 'Prime Minister', wiki: 'Alix_Didier_Fils-Aim%C3%A9' },
  'Jamaica': { name: 'Andrew Holness', title: 'Prime Minister', wiki: 'Andrew_Holness' },
  'Trinidad and Tobago': { name: 'Keith Rowley', title: 'Prime Minister', wiki: 'Keith_Rowley' },
  'Uruguay': { name: 'Yamandú Orsi', title: 'President', wiki: 'Yamand%C3%BA_Orsi' },
  'Paraguay': { name: 'Santiago Peña', title: 'President', wiki: 'Santiago_Pe%C3%B1a' },
  'Bolivia': { name: 'Luis Arce', title: 'President', wiki: 'Luis_Arce' },
  'Nicaragua': { name: 'Daniel Ortega', title: 'President', wiki: 'Daniel_Ortega' },
  'Guyana': { name: 'Irfaan Ali', title: 'President', wiki: 'Irfaan_Ali' },
  'Suriname': { name: 'Chan Santokhi', title: 'President', wiki: 'Chan_Santokhi' },
  'Belize': { name: 'Johnny Briceño', title: 'Prime Minister', wiki: 'Johnny_Brice%C3%B1o' },
  'Barbados': { name: 'Mia Mottley', title: 'Prime Minister', wiki: 'Mia_Mottley' },
  'Bahamas': { name: 'Philip Davis', title: 'Prime Minister', wiki: 'Philip_Davis_(politician)' },

  // ─── Europe ───
  'United Kingdom': { name: 'Keir Starmer', title: 'Prime Minister', wiki: 'Keir_Starmer' },
  'France': { name: 'Emmanuel Macron', title: 'President', wiki: 'Emmanuel_Macron' },
  'Germany': { name: 'Friedrich Merz', title: 'Chancellor', wiki: 'Friedrich_Merz' },
  'Italy': { name: 'Giorgia Meloni', title: 'Prime Minister', wiki: 'Giorgia_Meloni' },
  'Spain': { name: 'Pedro Sánchez', title: 'Prime Minister', wiki: 'Pedro_S%C3%A1nchez' },
  'Poland': { name: 'Donald Tusk', title: 'Prime Minister', wiki: 'Donald_Tusk' },
  'Netherlands': { name: 'Dick Schoof', title: 'Prime Minister', wiki: 'Dick_Schoof' },
  'Belgium': { name: 'Bart De Wever', title: 'Prime Minister', wiki: 'Bart_De_Wever' },
  'Sweden': { name: 'Ulf Kristersson', title: 'Prime Minister', wiki: 'Ulf_Kristersson' },
  'Norway': { name: 'Jonas Gahr Støre', title: 'Prime Minister', wiki: 'Jonas_Gahr_St%C3%B8re' },
  'Denmark': { name: 'Mette Frederiksen', title: 'Prime Minister', wiki: 'Mette_Frederiksen' },
  'Finland': { name: 'Petteri Orpo', title: 'Prime Minister', wiki: 'Petteri_Orpo' },
  'Switzerland': { name: 'Karin Keller-Sutter', title: 'President', wiki: 'Karin_Keller-Sutter' },
  'Austria': { name: 'Herbert Kickl', title: 'Chancellor', wiki: 'Herbert_Kickl' },
  'Greece': { name: 'Kyriakos Mitsotakis', title: 'Prime Minister', wiki: 'Kyriakos_Mitsotakis' },
  'Portugal': { name: 'Luís Montenegro', title: 'Prime Minister', wiki: 'Lu%C3%ADs_Montenegro_(politician)' },
  'Ireland': { name: 'Micheál Martin', title: 'Taoiseach', wiki: 'Miche%C3%A1l_Martin' },
  'Czechia': { name: 'Petr Fiala', title: 'Prime Minister', wiki: 'Petr_Fiala' },
  'Romania': { name: 'Marcel Ciolacu', title: 'Prime Minister', wiki: 'Marcel_Ciolacu' },
  'Hungary': { name: 'Viktor Orbán', title: 'Prime Minister', wiki: 'Viktor_Orb%C3%A1n' },
  'Slovakia': { name: 'Robert Fico', title: 'Prime Minister', wiki: 'Robert_Fico' },
  'Bulgaria': { name: 'Rosen Zhelyazkov', title: 'Prime Minister', wiki: 'Rosen_Zhelyazkov' },
  'Croatia': { name: 'Andrej Plenković', title: 'Prime Minister', wiki: 'Andrej_Plenkovi%C4%87' },
  'Serbia': { name: 'Aleksandar Vučić', title: 'President', wiki: 'Aleksandar_Vu%C4%8Di%C4%87' },
  'Slovenia': { name: 'Robert Golob', title: 'Prime Minister', wiki: 'Robert_Golob' },
  'Lithuania': { name: 'Gintautas Paluckas', title: 'Prime Minister', wiki: 'Gintautas_Paluckas' },
  'Latvia': { name: 'Evika Siliņa', title: 'Prime Minister', wiki: 'Evika_Sili%C5%86a' },
  'Estonia': { name: 'Kristen Michal', title: 'Prime Minister', wiki: 'Kristen_Michal' },
  'Luxembourg': { name: 'Luc Frieden', title: 'Prime Minister', wiki: 'Luc_Frieden' },
  'Iceland': { name: 'Kristrún Frostadóttir', title: 'Prime Minister', wiki: 'Kristr%C3%BAn_Frostad%C3%B3ttir' },
  'Malta': { name: 'Robert Abela', title: 'Prime Minister', wiki: 'Robert_Abela' },
  'Montenegro': { name: 'Milojko Spajić', title: 'Prime Minister', wiki: 'Milojko_Spaji%C4%87' },
  'North Macedonia': { name: 'Hristijan Mickoski', title: 'Prime Minister', wiki: 'Hristijan_Mickoski' },
  'Albania': { name: 'Edi Rama', title: 'Prime Minister', wiki: 'Edi_Rama' },
  'Kosovo': { name: 'Albin Kurti', title: 'Prime Minister', wiki: 'Albin_Kurti' },
  'Moldova': { name: 'Maia Sandu', title: 'President', wiki: 'Maia_Sandu' },
  'Bosnia and Herzegovina': { name: 'Borjana Krišto', title: 'Chairwoman of Council', wiki: 'Borjana_Kri%C5%A1to' },
  'Cyprus': { name: 'Nikos Christodoulides', title: 'President', wiki: 'Nikos_Christodoulides' },
  'Ukraine': { name: 'Volodymyr Zelenskyy', title: 'President', wiki: 'Volodymyr_Zelenskyy' },
  'Russia': { name: 'Vladimir Putin', title: 'President', wiki: 'Vladimir_Putin' },
  'Belarus': { name: 'Alexander Lukashenko', title: 'President', wiki: 'Alexander_Lukashenko' },
  'Georgia': { name: 'Irakli Kobakhidze', title: 'Prime Minister', wiki: 'Irakli_Kobakhidze' },
  'Armenia': { name: 'Nikol Pashinyan', title: 'Prime Minister', wiki: 'Nikol_Pashinyan' },
  'Azerbaijan': { name: 'Ilham Aliyev', title: 'President', wiki: 'Ilham_Aliyev' },
  'Andorra': { name: 'Xavier Espot', title: 'Prime Minister', wiki: 'Xavier_Espot' },
  'Monaco': { name: 'Didier Guillaume', title: 'Minister of State', wiki: 'Didier_Guillaume' },
  'Liechtenstein': { name: 'Daniel Risch', title: 'Prime Minister', wiki: 'Daniel_Risch' },
  'San Marino': { name: 'Francesca Civerchia', title: 'Captain Regent', wiki: 'Captains_Regent' },

  // ─── Asia ───
  'China': { name: 'Xi Jinping', title: 'President', wiki: 'Xi_Jinping' },
  'Japan': { name: 'Shigeru Ishiba', title: 'Prime Minister', wiki: 'Shigeru_Ishiba' },
  'India': { name: 'Narendra Modi', title: 'Prime Minister', wiki: 'Narendra_Modi' },
  'South Korea': { name: 'Han Duck-soo', title: 'Acting President', wiki: 'Han_Duck-soo' },
  'Indonesia': { name: 'Prabowo Subianto', title: 'President', wiki: 'Prabowo_Subianto' },
  'Turkey': { name: 'Recep Tayyip Erdoğan', title: 'President', wiki: 'Recep_Tayyip_Erdo%C4%9Fan' },
  'Saudi Arabia': { name: 'Mohammed bin Salman', title: 'Crown Prince & PM', wiki: 'Mohammed_bin_Salman' },
  'Iran': { name: 'Masoud Pezeshkian', title: 'President', wiki: 'Masoud_Pezeshkian' },
  'Israel': { name: 'Benjamin Netanyahu', title: 'Prime Minister', wiki: 'Benjamin_Netanyahu' },
  'Pakistan': { name: 'Shehbaz Sharif', title: 'Prime Minister', wiki: 'Shehbaz_Sharif' },
  'Thailand': { name: 'Paetongtarn Shinawatra', title: 'Prime Minister', wiki: 'Paetongtarn_Shinawatra' },
  'Philippines': { name: 'Bongbong Marcos', title: 'President', wiki: 'Bongbong_Marcos' },
  'Vietnam': { name: 'Tô Lâm', title: 'General Secretary', wiki: 'T%C3%B4_L%C3%A2m' },
  'Taiwan': { name: 'Lai Ching-te', title: 'President', wiki: 'Lai_Ching-te' },
  'Singapore': { name: 'Lawrence Wong', title: 'Prime Minister', wiki: 'Lawrence_Wong' },
  'Malaysia': { name: 'Anwar Ibrahim', title: 'Prime Minister', wiki: 'Anwar_Ibrahim' },
  'North Korea': { name: 'Kim Jong Un', title: 'Supreme Leader', wiki: 'Kim_Jong_Un' },
  'Iraq': { name: 'Mohammed Shia al-Sudani', title: 'Prime Minister', wiki: 'Mohammed_Shia%27_al-Sudani' },
  'Bangladesh': { name: 'Muhammad Yunus', title: 'Chief Adviser', wiki: 'Muhammad_Yunus' },
  'Myanmar': { name: 'Min Aung Hlaing', title: 'SAC Chairman', wiki: 'Min_Aung_Hlaing' },
  'Afghanistan': { name: 'Hibatullah Akhundzada', title: 'Supreme Leader', wiki: 'Hibatullah_Akhundzada' },
  'Nepal': { name: 'KP Sharma Oli', title: 'Prime Minister', wiki: 'KP_Sharma_Oli' },
  'Sri Lanka': { name: 'Anura Kumara Dissanayake', title: 'President', wiki: 'Anura_Kumara_Dissanayake' },
  'Cambodia': { name: 'Hun Manet', title: 'Prime Minister', wiki: 'Hun_Manet' },
  'Laos': { name: 'Sonexay Siphandone', title: 'Prime Minister', wiki: 'Sonexay_Siphandone' },
  'Mongolia': { name: 'Luvsannamsrain Oyun-Erdene', title: 'Prime Minister', wiki: 'Luvsannamsrain_Oyun-Erdene' },
  'Kazakhstan': { name: 'Kassym-Jomart Tokayev', title: 'President', wiki: 'Kassym-Jomart_Tokayev' },
  'Uzbekistan': { name: 'Shavkat Mirziyoyev', title: 'President', wiki: 'Shavkat_Mirziyoyev' },
  'Turkmenistan': { name: 'Serdar Berdimuhamedow', title: 'President', wiki: 'Serdar_Berdimuhamedow' },
  'Tajikistan': { name: 'Emomali Rahmon', title: 'President', wiki: 'Emomali_Rahmon' },
  'Kyrgyzstan': { name: 'Sadyr Japarov', title: 'President', wiki: 'Sadyr_Japarov' },
  'Jordan': { name: 'Abdullah II', title: 'King', wiki: 'Abdullah_II_of_Jordan' },
  'Lebanon': { name: 'Nawaf Salam', title: 'Prime Minister', wiki: 'Nawaf_Salam' },
  'Syria': { name: 'Ahmad al-Sharaa', title: 'President', wiki: 'Abu_Mohammed_al-Julani' },
  'Yemen': { name: 'Rashad al-Alimi', title: 'Presidential Council Chair', wiki: 'Rashad_al-Alimi' },
  'Oman': { name: 'Haitham bin Tariq', title: 'Sultan', wiki: 'Haitham_bin_Tariq' },
  'Kuwait': { name: 'Mishal Al-Ahmad Al-Jaber Al-Sabah', title: 'Emir', wiki: 'Mishal_Al-Ahmad_Al-Jaber_Al-Sabah' },
  'Qatar': { name: 'Tamim bin Hamad Al Thani', title: 'Emir', wiki: 'Tamim_bin_Hamad_Al_Thani' },
  'Bahrain': { name: 'Hamad bin Isa Al Khalifa', title: 'King', wiki: 'Hamad_bin_Isa_Al_Khalifa' },
  'United Arab Emirates': { name: 'Mohamed bin Zayed Al Nahyan', title: 'President', wiki: 'Mohamed_bin_Zayed_Al_Nahyan' },
  'Brunei Darussalam': { name: 'Hassanal Bolkiah', title: 'Sultan', wiki: 'Hassanal_Bolkiah' },
  'East Timor': { name: 'Xanana Gusmão', title: 'Prime Minister', wiki: 'Xanana_Gusm%C3%A3o' },
  'Maldives': { name: 'Mohamed Muizzu', title: 'President', wiki: 'Mohamed_Muizzu' },
  'Bhutan': { name: 'Tshering Tobgay', title: 'Prime Minister', wiki: 'Tshering_Tobgay' },

  // ─── Africa ───
  'South Africa': { name: 'Cyril Ramaphosa', title: 'President', wiki: 'Cyril_Ramaphosa' },
  'Nigeria': { name: 'Bola Tinubu', title: 'President', wiki: 'Bola_Tinubu' },
  'Egypt': { name: 'Abdel Fattah el-Sisi', title: 'President', wiki: 'Abdel_Fattah_el-Sisi' },
  'Kenya': { name: 'William Ruto', title: 'President', wiki: 'William_Ruto' },
  'Ethiopia': { name: 'Abiy Ahmed', title: 'Prime Minister', wiki: 'Abiy_Ahmed' },
  'DR Congo': { name: 'Félix Tshisekedi', title: 'President', wiki: 'F%C3%A9lix_Tshisekedi' },
  'Tanzania': { name: 'Samia Suluhu Hassan', title: 'President', wiki: 'Samia_Suluhu_Hassan' },
  'Uganda': { name: 'Yoweri Museveni', title: 'President', wiki: 'Yoweri_Museveni' },
  'Ghana': { name: 'John Mahama', title: 'President', wiki: 'John_Mahama' },
  'Ivory Coast': { name: 'Alassane Ouattara', title: 'President', wiki: 'Alassane_Ouattara' },
  'Cameroon': { name: 'Paul Biya', title: 'President', wiki: 'Paul_Biya' },
  'Senegal': { name: 'Bassirou Diomaye Faye', title: 'President', wiki: 'Bassirou_Diomaye_Faye' },
  'Angola': { name: 'João Lourenço', title: 'President', wiki: 'Jo%C3%A3o_Louren%C3%A7o' },
  'Mozambique': { name: 'Daniel Chapo', title: 'President', wiki: 'Daniel_Chapo' },
  'Madagascar': { name: 'Andry Rajoelina', title: 'President', wiki: 'Andry_Rajoelina' },
  'Morocco': { name: 'Aziz Akhannouch', title: 'Prime Minister', wiki: 'Aziz_Akhannouch' },
  'Tunisia': { name: 'Kais Saied', title: 'President', wiki: 'Kais_Saied' },
  'Algeria': { name: 'Abdelmadjid Tebboune', title: 'President', wiki: 'Abdelmadjid_Tebboune' },
  'Libya': { name: 'Abdul Hamid Dbeibeh', title: 'Prime Minister (GNU)', wiki: 'Abdul_Hamid_Dbeibeh' },
  'Sudan': { name: 'Abdel Fattah al-Burhan', title: 'SAC Chairman', wiki: 'Abdel_Fattah_al-Burhan' },
  'South Sudan': { name: 'Salva Kiir Mayardit', title: 'President', wiki: 'Salva_Kiir_Mayardit' },
  'Rwanda': { name: 'Paul Kagame', title: 'President', wiki: 'Paul_Kagame' },
  'Zimbabwe': { name: 'Emmerson Mnangagwa', title: 'President', wiki: 'Emmerson_Mnangagwa' },
  'Zambia': { name: 'Hakainde Hichilema', title: 'President', wiki: 'Hakainde_Hichilema' },
  'Mali': { name: 'Assimi Goïta', title: 'President (Transitional)', wiki: 'Assimi_Go%C3%AFta' },
  'Burkina Faso': { name: 'Ibrahim Traoré', title: 'President (Transitional)', wiki: 'Ibrahim_Traor%C3%A9' },
  'Niger': { name: 'Abdourahamane Tchiani', title: 'Head of State', wiki: 'Abdourahamane_Tchiani' },
  'Chad': { name: 'Mahamat Idriss Déby', title: 'President', wiki: 'Mahamat_Idriss_D%C3%A9by' },
  'Somalia': { name: 'Hassan Sheikh Mohamud', title: 'President', wiki: 'Hassan_Sheikh_Mohamud' },
  'Eritrea': { name: 'Isaias Afwerki', title: 'President', wiki: 'Isaias_Afwerki' },
  'Djibouti': { name: 'Ismaïl Omar Guelleh', title: 'President', wiki: 'Isma%C3%AFl_Omar_Guelleh' },
  'Namibia': { name: 'Netumbo Nandi-Ndaitwah', title: 'President', wiki: 'Netumbo_Nandi-Ndaitwah' },
  'Botswana': { name: 'Duma Boko', title: 'President', wiki: 'Duma_Boko' },
  'Malawi': { name: 'Lazarus Chakwera', title: 'President', wiki: 'Lazarus_Chakwera' },
  'Gabon': { name: 'Brice Clotaire Oligui Nguema', title: 'President (Transitional)', wiki: 'Brice_Clotaire_Oligui_Nguema' },
  'Republic of the Congo': { name: 'Denis Sassou Nguesso', title: 'President', wiki: 'Denis_Sassou_Nguesso' },
  'Mauritania': { name: 'Mohamed Ould Ghazouani', title: 'President', wiki: 'Mohamed_Ould_Ghazouani' },
  'Togo': { name: 'Faure Gnassingbé', title: 'President', wiki: 'Faure_Gnassingb%C3%A9' },
  'Benin': { name: 'Patrice Talon', title: 'President', wiki: 'Patrice_Talon' },
  'Guinea': { name: 'Mamadi Doumbouya', title: 'President (Transitional)', wiki: 'Mamadi_Doumbouya' },
  'Sierra Leone': { name: 'Julius Maada Bio', title: 'President', wiki: 'Julius_Maada_Bio' },
  'Liberia': { name: 'Joseph Boakai', title: 'President', wiki: 'Joseph_Boakai' },
  'Lesotho': { name: 'Sam Matekane', title: 'Prime Minister', wiki: 'Sam_Matekane' },
  'Eswatini': { name: 'Mswati III', title: 'King', wiki: 'Mswati_III' },
  'Central African Republic': { name: 'Faustin-Archange Touadéra', title: 'President', wiki: 'Faustin-Archange_Touad%C3%A9ra' },
  'Equatorial Guinea': { name: 'Teodoro Obiang', title: 'President', wiki: 'Teodoro_Obiang_Nguema_Mbasogo' },
  'Burundi': { name: 'Évariste Ndayishimiye', title: 'President', wiki: '%C3%89variste_Ndayishimiye' },
  'Gambia': { name: 'Adama Barrow', title: 'President', wiki: 'Adama_Barrow' },
  'Guinea-Bissau': { name: 'Umaro Sissoco Embaló', title: 'President', wiki: 'Umaro_Sissoco_Embal%C3%B3' },
  'Comoros': { name: 'Azali Assoumani', title: 'President', wiki: 'Azali_Assoumani' },
  'Mauritius': { name: 'Navin Ramgoolam', title: 'Prime Minister', wiki: 'Navin_Ramgoolam' },
  'Seychelles': { name: 'Wavel Ramkalawan', title: 'President', wiki: 'Wavel_Ramkalawan' },
  'Cape Verde': { name: 'Ulisses Correia e Silva', title: 'Prime Minister', wiki: 'Ulisses_Correia_e_Silva' },

  // ─── Oceania ───
  'Australia': { name: 'Anthony Albanese', title: 'Prime Minister', wiki: 'Anthony_Albanese' },
  'New Zealand': { name: 'Christopher Luxon', title: 'Prime Minister', wiki: 'Christopher_Luxon' },
  'Papua New Guinea': { name: 'James Marape', title: 'Prime Minister', wiki: 'James_Marape' },
  'Fiji': { name: 'Sitiveni Rabuka', title: 'Prime Minister', wiki: 'Sitiveni_Rabuka' },
  'Solomon Islands': { name: 'Jeremiah Manele', title: 'Prime Minister', wiki: 'Jeremiah_Manele' },
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
