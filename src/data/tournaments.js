// Yeni turnuva eklemek için bu listeye satır ekle; sayaçlar otomatik güncellenir.
// result: champion | final | semi
export const tournaments = [
  { year: 2018, title: 'SQTR Turnuvası', logo: 'sqtr', result: 'champion', label: 'Şampiyon' },
  { year: 2019, title: 'Official Squad Showdown Season 3', logo: 'oss', result: 'semi', label: 'Yarı final' },
  { year: 2019, title: 'Squad Rivals Tier 1', logo: 'squad-rivals', result: 'semi', label: 'Yarı final' },
  {
    year: 2020,
    title: 'Official Tournament (OISC)',
    logo: 'oisc',
    result: 'semi',
    label: 'Yarı final',
    partner: 'IG',
  },
  { year: 2020, title: 'Best of Turks', logo: 'bot', result: 'champion', label: 'Şampiyon' },
  { year: 2021, title: 'Squad Open Tournament', logo: 'sot', result: 'semi', label: 'Yarı final (4.)', partner: 'H' },
  { year: 2021, title: 'SGC Season 1', logo: 'sgc', result: 'semi', label: 'Yarı final' },
  { year: 2022, title: 'Squad Charity League', logo: 'scl', result: 'final', label: 'Final', partner: 'RvN' },
  { year: 2022, title: 'Squad Rivals Finals', logo: 'squad-rivals', result: 'final', label: 'İkinci', partner: 'RvN' },
  { year: 2023, title: 'Squad Rivals', logo: 'rivals', result: 'champion', label: 'Tier 2 şampiyonu' },
];

export const tally = {
  champion: tournaments.filter((t) => t.result === 'champion').length,
  final: tournaments.filter((t) => t.result === 'final').length,
  semi: tournaments.filter((t) => t.result === 'semi').length,
};
