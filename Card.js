import * as util from 'util'

class Card {
  constructor (nr) {
    this.nr = nr
    this.type = 0
    this.wantToCharge = Boolean(0)
  }

  update (buffer) {
    this.type = buffer.readInt16BE(0)
    this.wantToCharge = Boolean(buffer.readInt16BE(2))
  }
}

export const generateCards = len => {
  const cards = []
  for (let i = 0; i < len; i++) {
    cards.push(new Card(i + 1))
  }
  return cards
}

export const updateCards = util.promisify(
  (start, buffer, offset, cards, callback) => {
    let byte = start
    const min = 0
    const max = buffer.length / offset
    for (let i = min; i < max; i++) {
      cards[i].update(buffer.slice(byte, byte + offset))
      byte += offset
    }
    callback(null, cards)
  }
)
