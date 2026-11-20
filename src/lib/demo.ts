import type { Memory, Profile } from './types'

const base = import.meta.env.BASE_URL
const art = (name: string) => `${base}demo/${name}.svg`

export const DEMO_OWNER = 'demo-owner'

export const demoProfile: Profile = {
  id: DEMO_OWNER,
  handle: 'demo',
  displayName: 'A sample box',
  bio: 'An example of what a Momento box looks like.',
  isPublic: true,
}

let n = 0
const side = (
  label: string,
  imageUrl: string | null,
  note: string | null,
  width: number | null,
  height: number | null,
) => ({ id: `s${++n}`, position: n, label, imageUrl, note, width, height })

/** Sample memories shown when the site runs without a backend, and on first visit. */
export const demoMemories: Memory[] = [
  {
    id: 'm1',
    ownerId: DEMO_OWNER,
    kind: 'object',
    title: 'Festival wristband',
    place: 'Pilton, Somerset',
    happenedOn: '2018-06-24',
    story: 'Wore it until October. Mum finally cut it off while I was asleep.',
    isShown: false,
    model: 'band',
    sides: [side('Front', art('wristband'), null, 240, 300)],
  },
  {
    id: 'm2',
    ownerId: DEMO_OWNER,
    kind: 'card',
    title: 'Gran’s card for my 21st',
    place: 'Harrogate, Yorkshire',
    happenedOn: '2019-03-12',
    story:
      'She always wrote in green ink. This one is in blue: she said it was a special occasion.',
    isShown: true,
    sides: [
      side('Front', art('card'), null, 220, 310),
      side(
        'Inside',
        null,
        'My dearest Nikita,\n\nTwenty-one! I still remember holding you the day you were born. You were so cross about it.\n\nSpend this on something silly, not sensible. There’s plenty of time for sensible.\n\nAll my love, always,\nGran x',
        220,
        310,
      ),
      side('Back', null, 'Hedgerow Cards\nPrinted in Yorkshire on recycled board', 220, 310),
    ],
  },
  {
    id: 'm3',
    ownerId: DEMO_OWNER,
    kind: 'photo',
    title: 'Polzeath, first holiday',
    place: 'Polzeath, Cornwall',
    happenedOn: '2019-08-04',
    story: 'Six days of rain, then one perfect evening on the beach.',
    isShown: true,
    sides: [
      side('Front', art('photo'), null, 300, 230),
      side('Back', null, 'Polzeath ’19\nthe one good evening!', 300, 230),
    ],
  },
  {
    id: 'm4',
    ownerId: DEMO_OWNER,
    kind: 'ticket',
    title: 'First gig, Brixton',
    place: 'Brixton, London',
    happenedOn: '2019-11-22',
    story: 'Row F, seat 12. Lost my voice for a week afterwards.',
    isShown: false,
    sides: [
      side('Front', art('ticket'), null, 300, 150),
      side('Back', null, 'Best night ever.\nSang every word.', 300, 150),
    ],
  },
  {
    id: 'm5',
    ownerId: DEMO_OWNER,
    kind: 'flower',
    title: 'Daisy from the wedding',
    place: 'Ludlow, Shropshire',
    happenedOn: '2021-06-19',
    story: 'Pressed from Priya’s bouquet the night of the wedding.',
    isShown: true,
    sides: [
      side('Front', art('flower'), null, 220, 330),
      side('Back', null, 'From P’s bouquet\n19.6.21\n\nShe threw it straight at me.', 220, 330),
    ],
  },
  {
    id: 'm6',
    ownerId: DEMO_OWNER,
    kind: 'postcard',
    title: 'Postcard from the Lakes',
    place: 'Keswick, Cumbria',
    happenedOn: '2021-09-09',
    story: 'Sent it to myself. It arrived two days after I got home.',
    isShown: false,
    sides: [
      side('Front', art('postcard'), null, 310, 210),
      side(
        'Back',
        null,
        'Dear me,\nClimbed Catbells at sunrise. Legs gone. Worth it.\nWish you were here. Oh wait.\nN x',
        310,
        210,
      ),
    ],
  },
  {
    id: 'm7',
    ownerId: DEMO_OWNER,
    kind: 'object',
    title: 'Shell from St Ives',
    place: 'St Ives, Cornwall',
    happenedOn: '2022-07-30',
    story: 'Found on the very last morning, still wet from the tide.',
    isShown: false,
    sides: [side('Front', art('shell'), null, 240, 220)],
  },
  {
    id: 'm8',
    ownerId: DEMO_OWNER,
    kind: 'photo',
    title: 'Mum’s 60th, the garden',
    place: 'Bath, Somerset',
    happenedOn: '2023-05-17',
    story: 'The fairy lights finally worked, just as it got dark.',
    isShown: true,
    sides: [
      side('Front', art('polaroid'), null, 230, 280),
      side('Back', null, 'Mum’s 60th\nthe lights worked!!', 230, 280),
    ],
  },
  {
    id: 'm9',
    ownerId: DEMO_OWNER,
    kind: 'letter',
    title: 'Letter from Dad',
    place: 'Leeds, Yorkshire',
    happenedOn: '2023-12-25',
    story: 'Tucked inside a Christmas present. Just for me.',
    isShown: false,
    sides: [
      side('Envelope', art('letter'), null, 310, 200),
      side(
        'Letter',
        null,
        'Nik,\n\nI’m not good at saying this out loud, so I’m writing it down.\n\nI am so proud of the person you’ve become. Not for the grades or the job. For how kind you are.\n\nLove you, kiddo.\nDad',
        300,
        400,
      ),
    ],
  },
]
