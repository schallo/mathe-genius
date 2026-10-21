// All German UI texts (GAME_DESIGN §10). Keep them short – the player is 9.

export const texts = {
  title: {
    name: 'Mathe-Genie',
    subtitle: 'Rechnen mit Freunden',
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
    wildSign: 'Steg',
    wildSoon: 'Das Boot zu den wilden Inseln kommt bald!',
    underConstruction: (hut: string) => `${hut}: Hier wird gebaut!`,
  },
  show: {
    soon: 'Bald geht’s los!',
    back: 'Zurück',
    praise: ['Richtig!', 'Super!', 'Klasse!', 'Genau!', 'Stark gerechnet!'],
    praiseName: (name: string) => [`Super, ${name}!`, `Klasse, ${name}!`],
    hint: 'Fast! Schau mal:',
    solution: 'Kein Problem – so geht’s:',
    retype: 'Tipp das Ergebnis ab!',
    rest: 'Rest',
    challenge: 'Extra',
    streak: 'Fünf in Folge!',
    endSolved: (solved: number, total: number) => `Du hast ${solved} von ${total} geschafft!`,
    endEffort: 'Du bist drangeblieben!',
    endCoins: (coins: number) => `+${coins} Münzen`,
    again: 'Nochmal',
    toVillage: 'Ins Dorf',
  },
}
