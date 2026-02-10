/**
 * World Leaders Data
 * Maps country names to their current head of state/government
 * Photo URLs sourced from Wikimedia Commons (stable, public domain/CC)
 */

const WORLD_LEADERS = {
  'United States': {
    name: 'Donald Trump',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Donald_Trump_official_portrait_%282024%29.jpg/220px-Donald_Trump_official_portrait_%282024%29.jpg',
  },
  'China': {
    name: 'Xi Jinping',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Xi_Jinping_2019.jpg/220px-Xi_Jinping_2019.jpg',
  },
  'Russia': {
    name: 'Vladimir Putin',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Vladimir_Putin_%282024-11-22%29.jpg/220px-Vladimir_Putin_%282024-11-22%29.jpg',
  },
  'United Kingdom': {
    name: 'Keir Starmer',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Official_portrait_of_Keir_Starmer.jpg/220px-Official_portrait_of_Keir_Starmer.jpg',
  },
  'France': {
    name: 'Emmanuel Macron',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Emmanuel_Macron_in_2019.jpg/220px-Emmanuel_Macron_in_2019.jpg',
  },
  'Germany': {
    name: 'Friedrich Merz',
    title: 'Chancellor',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/2020-02-14_Friedrich_Merz-0677_%28cropped%29.jpg/220px-2020-02-14_Friedrich_Merz-0677_%28cropped%29.jpg',
  },
  'Japan': {
    name: 'Shigeru Ishiba',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Shigeru_Ishiba_20241001.jpg/220px-Shigeru_Ishiba_20241001.jpg',
  },
  'India': {
    name: 'Narendra Modi',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Narendra_Modi_2021.jpg/220px-Narendra_Modi_2021.jpg',
  },
  'Brazil': {
    name: 'Luiz Inácio Lula da Silva',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Lula_-_foto_oficial_-_05_jan_2023_%28cropped%29.jpg/220px-Lula_-_foto_oficial_-_05_jan_2023_%28cropped%29.jpg',
  },
  'Canada': {
    name: 'Mark Carney',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Mark_Carney_official_portrait.jpg/220px-Mark_Carney_official_portrait.jpg',
  },
  'Australia': {
    name: 'Anthony Albanese',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/The_Hon_Anthony_Albanese_MP.jpg/220px-The_Hon_Anthony_Albanese_MP.jpg',
  },
  'South Korea': {
    name: 'Han Duck-soo',
    title: 'Acting President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Han_Duck-soo_May_2022.jpg/220px-Han_Duck-soo_May_2022.jpg',
  },
  'Mexico': {
    name: 'Claudia Sheinbaum',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Claudia_Sheinbaum_Pardo_%28cropped%29.jpg/220px-Claudia_Sheinbaum_Pardo_%28cropped%29.jpg',
  },
  'Italy': {
    name: 'Giorgia Meloni',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Giorgia_Meloni_Official_2022_%28cropped%29.jpg/220px-Giorgia_Meloni_Official_2022_%28cropped%29.jpg',
  },
  'Spain': {
    name: 'Pedro Sánchez',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Pedro_S%C3%A1nchez_in_2024.jpg/220px-Pedro_S%C3%A1nchez_in_2024.jpg',
  },
  'Turkey': {
    name: 'Recep Tayyip Erdoğan',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Recep_Tayyip_Erdo%C4%9Fan_2024_%28cropped%29.jpg/220px-Recep_Tayyip_Erdo%C4%9Fan_2024_%28cropped%29.jpg',
  },
  'Saudi Arabia': {
    name: 'Mohammed bin Salman',
    title: 'Crown Prince & PM',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Crown_Prince_Mohammad_bin_Salman_Al_Saud_-_2022.jpg/220px-Crown_Prince_Mohammad_bin_Salman_Al_Saud_-_2022.jpg',
  },
  'Iran': {
    name: 'Masoud Pezeshkian',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Masoud_Pezeshkian_%28cropped%29.jpg/220px-Masoud_Pezeshkian_%28cropped%29.jpg',
  },
  'Israel': {
    name: 'Benjamin Netanyahu',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Benjamin_Netanyahu_2023.jpg/220px-Benjamin_Netanyahu_2023.jpg',
  },
  'Egypt': {
    name: 'Abdel Fattah el-Sisi',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Abdel_Fattah_el-Sisi_in_2023.jpg/220px-Abdel_Fattah_el-Sisi_in_2023.jpg',
  },
  'South Africa': {
    name: 'Cyril Ramaphosa',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Cyril_Ramaphosa_2023.jpg/220px-Cyril_Ramaphosa_2023.jpg',
  },
  'Nigeria': {
    name: 'Bola Tinubu',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Bola_Tinubu_portrait.jpg/220px-Bola_Tinubu_portrait.jpg',
  },
  'Argentina': {
    name: 'Javier Milei',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Javier_Milei_2024.jpg/220px-Javier_Milei_2024.jpg',
  },
  'Indonesia': {
    name: 'Prabowo Subianto',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Prabowo_Subianto%2C_President_of_Indonesia.jpg/220px-Prabowo_Subianto%2C_President_of_Indonesia.jpg',
  },
  'Poland': {
    name: 'Donald Tusk',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Donald_Tusk_%282024%29.jpg/220px-Donald_Tusk_%282024%29.jpg',
  },
  'Netherlands': {
    name: 'Dick Schoof',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Dick_Schoof_2024.jpg/220px-Dick_Schoof_2024.jpg',
  },
  'Sweden': {
    name: 'Ulf Kristersson',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Ulf_Kristersson_in_2022.jpg/220px-Ulf_Kristersson_in_2022.jpg',
  },
  'Norway': {
    name: 'Jonas Gahr Støre',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Jonas_Gahr_St%C3%B8re_2023.jpg/220px-Jonas_Gahr_St%C3%B8re_2023.jpg',
  },
  'Switzerland': {
    name: 'Karin Keller-Sutter',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Karin_Keller-Sutter_%282023%29.jpg/220px-Karin_Keller-Sutter_%282023%29.jpg',
  },
  'Ukraine': {
    name: 'Volodymyr Zelenskyy',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Volodymyr_Zelensky_2023.jpg/220px-Volodymyr_Zelensky_2023.jpg',
  },
  'Pakistan': {
    name: 'Shehbaz Sharif',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Shehbaz_Sharif_in_2024_%28cropped%29.jpg/220px-Shehbaz_Sharif_in_2024_%28cropped%29.jpg',
  },
  'Thailand': {
    name: 'Paetongtarn Shinawatra',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Paetongtarn_Shinawatra_%28cropped%29.jpg/220px-Paetongtarn_Shinawatra_%28cropped%29.jpg',
  },
  'Philippines': {
    name: 'Bongbong Marcos',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Bongbong_Marcos_official_portrait_%28cropped%29.jpg/220px-Bongbong_Marcos_official_portrait_%28cropped%29.jpg',
  },
  'Vietnam': {
    name: 'Tô Lâm',
    title: 'General Secretary',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/To_Lam_2024_%28cropped%29.jpg/220px-To_Lam_2024_%28cropped%29.jpg',
  },
  'Colombia': {
    name: 'Gustavo Petro',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Gustavo_Petro_2022.jpg/220px-Gustavo_Petro_2022.jpg',
  },
  'Chile': {
    name: 'Gabriel Boric',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Gabriel_Boric_Font_%28cropped%29.jpg/220px-Gabriel_Boric_Font_%28cropped%29.jpg',
  },
  'New Zealand': {
    name: 'Christopher Luxon',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Christopher_Luxon_2023_%28cropped%29.jpg/220px-Christopher_Luxon_2023_%28cropped%29.jpg',
  },
  'Greece': {
    name: 'Kyriakos Mitsotakis',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Kyriakos_Mitsotakis_2023_%28cropped%29.jpg/220px-Kyriakos_Mitsotakis_2023_%28cropped%29.jpg',
  },
  'Portugal': {
    name: 'Luís Montenegro',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Lu%C3%ADs_Montenegro_2024.jpg/220px-Lu%C3%ADs_Montenegro_2024.jpg',
  },
  'Denmark': {
    name: 'Mette Frederiksen',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Mette_Frederiksen_in_2023.jpg/220px-Mette_Frederiksen_in_2023.jpg',
  },
  'Finland': {
    name: 'Petteri Orpo',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Petteri_Orpo_2023_%28cropped%29.jpg/220px-Petteri_Orpo_2023_%28cropped%29.jpg',
  },
  'Taiwan': {
    name: 'Lai Ching-te',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/William_Lai_2024.jpg/220px-William_Lai_2024.jpg',
  },
  'Singapore': {
    name: 'Lawrence Wong',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Lawrence_Wong_20220526.jpg/220px-Lawrence_Wong_20220526.jpg',
  },
  'Malaysia': {
    name: 'Anwar Ibrahim',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Anwar_Ibrahim_%282023%29.jpg/220px-Anwar_Ibrahim_%282023%29.jpg',
  },
  'Kenya': {
    name: 'William Ruto',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1c/William_Ruto_2022.jpg/220px-William_Ruto_2022.jpg',
  },
  'Ethiopia': {
    name: 'Abiy Ahmed',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/45/Abiy_Ahmed_2023_%28cropped%29.jpg/220px-Abiy_Ahmed_2023_%28cropped%29.jpg',
  },
  'North Korea': {
    name: 'Kim Jong Un',
    title: 'Supreme Leader',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Kim_Jong-un_in_2024_%28cropped%29.jpg/220px-Kim_Jong-un_in_2024_%28cropped%29.jpg',
  },
  'Cuba': {
    name: 'Miguel Díaz-Canel',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Miguel_D%C3%ADaz-Canel_2023.jpg/220px-Miguel_D%C3%ADaz-Canel_2023.jpg',
  },
  'Venezuela': {
    name: 'Nicolás Maduro',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Nicol%C3%A1s_Maduro_2023.jpg/220px-Nicol%C3%A1s_Maduro_2023.jpg',
  },
  'Iraq': {
    name: 'Mohammed Shia al-Sudani',
    title: 'Prime Minister',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/Mohammed_Shia%27_Al_Sudani_%28cropped%29.jpg/220px-Mohammed_Shia%27_Al_Sudani_%28cropped%29.jpg',
  },
  'Peru': {
    name: 'Dina Boluarte',
    title: 'President',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Dina_Boluarte_2023_%28cropped%29.jpg/220px-Dina_Boluarte_2023_%28cropped%29.jpg',
  },
};

export function getLeader(countryName) {
  return WORLD_LEADERS[countryName] || null;
}

export default WORLD_LEADERS;
