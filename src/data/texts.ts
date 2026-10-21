// All German UI texts (GAME_DESIGN §10). Keep them short – the player is 9.

export const texts = {
  title: {
    name: 'Mathe-Bühne',
    play: 'Spielen',
    hello: (name: string) => `Hallo, ${name}!`,
  },
  create: {
    heading: 'So siehst du aus!',
    hint: 'Tipp auf dich zum Drehen',
    skin: 'Haut',
    hair: 'Frisur',
    hairColor: 'Haare',
    dress: 'Kleid',
    bow: 'Schleife',
    next: 'Weiter',
  },
  names: {
    askCharacter: 'Wie heißt du?',
    askPet: (species: string) => `Wie soll dein ${species} heißen?`,
    random: 'Zufall',
    space: 'Leertaste',
    done: 'Fertig',
    empty: 'Tipp zuerst einen Namen ein!',
  },
  starter: {
    heading: 'Such dir einen Freund aus!',
    next: 'Weiter',
  },
  village: {
    wildSign: 'Wildnis',
    wildSoon: 'Die Wildnis wird noch gebaut!',
    underConstruction: (hut: string) => `${hut}: Hier wird gebaut!`,
  },
  show: {
    soon: 'Bald geht’s los!',
    back: 'Zurück',
  },
}
