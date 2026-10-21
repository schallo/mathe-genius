// Method hints (after the first wrong answer) and worked solutions (after the second).
// German, short, school notation. Hints teach the method; they never give the result.
import { OP_SYMBOL, PLACE_NAMES, euro, placeName, term, withRemainder, zahl } from './format'

export type Help = { hintSteps: string[]; solutionSteps: string[] }

const digitsOf = (n: number) => [...String(n)].map(Number).reverse() // index 0 = Einer

/** 47 → [40, 7]; 305 → [300, 5] */
export function placeParts(n: number): number[] {
  return digitsOf(n)
    .map((d, i) => d * 10 ** i)
    .filter((p) => p > 0)
    .reverse()
}

// ---------- Einmaleins ----------

export function einmaleinsMul(a: number, b: number): Help {
  const hint =
    b >= 6
      ? `Nimm die leichte Aufgabe ${a} · 5 und rechne ${a} · ${b - 5} dazu.`
      : b > 1
        ? `Rechne ${a} · ${b - 1} und dann noch einmal ${a} dazu.`
        : `Mal 1 ändert die Zahl nicht.`
  const solution =
    b >= 6
      ? [
          `${a} · 5 = ${a * 5}`,
          `${a} · ${b - 5} = ${a * (b - 5)}`,
          `${a * 5} + ${a * (b - 5)} = ${a * b}`,
        ]
      : b > 1
        ? [`${a} · ${b - 1} = ${a * (b - 1)}`, `${a * (b - 1)} + ${a} = ${a * b}`]
        : [`${a} · 1 = ${a}`]
  return { hintSteps: [hint], solutionSteps: [...solution, `${a} · ${b} = ${a * b}`] }
}

export function einmaleinsDiv(n: number, d: number): Help {
  const q = Math.floor(n / d)
  const r = n % d
  if (r === 0) {
    return {
      hintSteps: [`Denk an die Malaufgabe: ${d} · ? = ${n}`],
      solutionSteps: [`${d} · ${q} = ${n}`, `${n} : ${d} = ${q}`],
    }
  }
  return {
    hintSteps: [
      `Welche Zahl aus der ${d}er-Reihe ist knapp kleiner als ${n}?`,
      `Was übrig bleibt, ist der Rest.`,
    ],
    solutionSteps: [
      `${d} · ${q} = ${d * q}`,
      `${n} − ${d * q} = ${r}`,
      `${n} : ${d} = ${q} Rest ${r}`,
    ],
  }
}

export function missingFactor(factor: number, product: number): Help {
  const q = product / factor
  return {
    hintSteps: [`Welche Zahl mal ${factor} ergibt ${product}? Rechne ${product} : ${factor}.`],
    solutionSteps: [`${product} : ${factor} = ${q}`, `${q} · ${factor} = ${product}`, `= ${q}`],
  }
}

// ---------- Kopfrechnen ----------

/** Add or subtract the second number in place-value steps: 456 + 238 → +200, +30, +8. */
export function splitAddSub(a: number, b: number, op: '+' | '-'): Help {
  const parts = placeParts(b)
  const sym = OP_SYMBOL[op]
  const result = op === '+' ? a + b : a - b
  const unit = 10 ** Math.floor(Math.log10(parts[0]))
  if (parts.length === 1 && a % unit === 0) {
    // 340 − 80 → 34 Zehner − 8 Zehner = 26 Zehner
    const name = placeName(unit)
    return {
      hintSteps: [`Rechne mit den ${name}n: ${zahl(b)} sind ${zahl(b / unit)} ${name}.`],
      solutionSteps: [
        `${zahl(a / unit)} ${name} ${sym} ${zahl(b / unit)} ${name} = ${zahl(result / unit)} ${name}`,
        `${term(op, [a, b])} = ${zahl(result)}`,
      ],
    }
  }
  if (parts.length === 1) {
    // 718 − 20: go via the full hundred (718 − 18 = 700, 700 − 2 = 698) if the step crosses it
    const block = unit * 10
    const full = op === '+' ? Math.ceil((a + 1) / block) * block : Math.floor(a / block) * block
    const crosses = op === '+' ? result > full : result < full && a !== full
    if (crosses) {
      const first = Math.abs(full - a)
      return {
        hintSteps: [`Rechne erst bis ${zahl(full)}, dann weiter.`],
        solutionSteps: [
          `${zahl(a)} ${sym} ${zahl(first)} = ${zahl(full)}`,
          `${zahl(full)} ${sym} ${zahl(b - first)} = ${zahl(result)}`,
          `${term(op, [a, b])} = ${zahl(result)}`,
        ],
      }
    }
    return {
      hintSteps: [`Nur die ${placeName(unit)} ändern sich.`],
      solutionSteps: [`${term(op, [a, b])} = ${zahl(result)}`],
    }
  }
  const steps: string[] = []
  let current = a
  for (const p of parts) {
    const next = op === '+' ? current + p : current - p
    steps.push(`${zahl(current)} ${sym} ${zahl(p)} = ${zahl(next)}`)
    current = next
  }
  return {
    hintSteps: [
      `Zerlege ${zahl(b)} in ${parts.map(zahl).join(' + ')} und rechne Schritt für Schritt.`,
    ],
    solutionSteps: [...steps, `${term(op, [a, b])} = ${zahl(result)}`],
  }
}

// ---------- Halbschriftlich ----------

/** 6 · 47 → 6 · 40 + 6 · 7 */
export function halbMul(single: number, multi: number): Help {
  const parts = placeParts(multi)
  const products = parts.map((p) => single * p)
  const total = single * multi
  if (parts.length === 1) {
    const zeros = Math.round(Math.log10(multi / Number(String(multi)[0])))
    const lead = multi / 10 ** zeros
    return {
      hintSteps: [
        `Rechne zuerst ${single} · ${lead} und hänge dann ${zeros === 1 ? 'eine Null' : `${zeros} Nullen`} an.`,
      ],
      solutionSteps: [
        `${single} · ${lead} = ${single * lead}`,
        `${single} · ${zahl(multi)} = ${zahl(total)}`,
      ],
    }
  }
  return {
    hintSteps: [`Zerlege ${zahl(multi)} in ${parts.map(zahl).join(' + ')}.`],
    solutionSteps: [
      ...parts.map((p, i) => `${single} · ${zahl(p)} = ${zahl(products[i])}`),
      `${products.map(zahl).join(' + ')} = ${zahl(total)}`,
      `${single} · ${zahl(multi)} = ${zahl(total)}`,
    ],
  }
}

/** 23 · 30 → 23 · 3, then · 10 */
export function halbMulTens(a: number, tens: number): Help {
  const t = tens / 10
  return {
    hintSteps: [`Rechne zuerst ${a} · ${t}. Dann mal 10.`],
    solutionSteps: [
      ...halbMul(t, a).solutionSteps.slice(0, -1),
      `${a} · ${t} = ${a * t}`,
      `${a * t} · 10 = ${zahl(a * tens)}`,
      `${a} · ${tens} = ${zahl(a * tens)}`,
    ],
  }
}

/** Split the dividend into parts the divisor fits into: 846 : 3 → 600 + 240 + 6. */
export function divisionParts(n: number, d: number): number[] {
  const parts: number[] = []
  let rest = n
  for (let place = 10 ** (String(n).length - 1); place >= 1; place /= 10) {
    const k = Math.floor(rest / (d * place))
    if (k > 0) {
      parts.push(k * d * place)
      rest -= k * d * place
    }
  }
  return parts
}

export function halbDiv(n: number, d: number): Help {
  const parts = divisionParts(n, d)
  const q = n / d
  if (parts.length === 1) {
    // 100 : 2 → 10 : 2 = 5, then add the zero again
    let zeros = 0
    while ((n / 10 ** (zeros + 1)) % d === 0 && (q / 10 ** (zeros + 1)) % 1 === 0) zeros++
    const small = n / 10 ** zeros
    const word = zeros === 1 ? 'eine Null' : `${zeros} Nullen`
    return {
      hintSteps: [
        `Lass ${word} weg: Rechne zuerst ${zahl(small)} : ${d}. Dann hänge ${word} wieder an.`,
      ],
      solutionSteps: [
        `${zahl(small)} : ${d} = ${zahl(small / d)}`,
        `${zahl(n)} : ${d} = ${zahl(q)}`,
      ],
    }
  }
  return {
    hintSteps: [
      `Zerlege ${zahl(n)} in Zahlen, die gut durch ${d} gehen: ${parts.map(zahl).join(' + ')}.`,
    ],
    solutionSteps: [
      ...parts.map((p) => `${zahl(p)} : ${d} = ${zahl(p / d)}`),
      `${parts.map((p) => zahl(p / d)).join(' + ')} = ${zahl(q)}`,
      `${zahl(n)} : ${d} = ${zahl(q)}`,
    ],
  }
}

// ---------- Zahlenraum ----------

export function compare(numbers: number[]): Help {
  const max = Math.max(...numbers)
  return {
    hintSteps: [
      `Vergleiche die Ziffern von links nach rechts. Die erste Stelle, die verschieden ist, entscheidet.`,
    ],
    solutionSteps: [
      `${zahl(max)} ist ${numbers.length === 2 ? 'größer' : 'am größten'}.`,
      `= ${zahl(max)}`,
    ],
  }
}

export function round(n: number, to: number, result: number): Help {
  const next = Math.floor(n / (to / 10)) % 10
  return {
    hintSteps: [
      `Schau auf die Ziffer rechts neben der ${placeName(to)}stelle.`,
      `0, 1, 2, 3, 4: abrunden. 5, 6, 7, 8, 9: aufrunden.`,
    ],
    solutionSteps: [
      `Die Ziffer rechts daneben ist eine ${next}.`,
      next >= 5 ? `Also aufrunden.` : `Also abrunden.`,
      `${zahl(n)} ≈ ${zahl(result)}`,
    ],
  }
}

export function neighbour(n: number, dir: -1 | 1): Help {
  return {
    hintSteps: [dir === 1 ? `Der Nachfolger ist um 1 größer.` : `Der Vorgänger ist um 1 kleiner.`],
    solutionSteps: [`${zahl(n)} ${dir === 1 ? '+' : '−'} 1 = ${zahl(n + dir)}`],
  }
}

export function digit(n: number, place: number): Help {
  const d = Math.floor(n / place) % 10
  const columns = ['E', 'Z', 'H', 'T', 'ZT', 'HT'].slice(0, String(n).length).reverse()
  return {
    hintSteps: [`Schreib die Zahl in die Stellentafel: ${columns.join(' | ')}.`],
    solutionSteps: [`An der ${placeName(place)}stelle von ${zahl(n)} steht die ${d}.`, `= ${d}`],
  }
}

// ---------- Schriftlich ----------

export function writtenAdd(operands: number[]): Help {
  const width = Math.max(...operands.map((o) => String(o).length))
  const steps: string[] = []
  let carry = 0
  for (let i = 0; i < width; i++) {
    const ds = operands.filter((o) => String(o).length > i).map((o) => Math.floor(o / 10 ** i) % 10)
    const sum = ds.reduce((s, x) => s + x, 0) + carry
    const parts = carry ? [...ds, carry] : ds
    const last = i === width - 1
    steps.push(
      `${PLACE_NAMES[i]}: ${parts.join(' + ')} = ${sum}` +
        (!last && sum >= 10 ? ` → schreibe ${sum % 10}, Übertrag ${Math.floor(sum / 10)}` : ''),
    )
    carry = last ? 0 : Math.floor(sum / 10)
  }
  const total = operands.reduce((s, x) => s + x, 0)
  return {
    hintSteps: [`Rechne Stelle für Stelle, von rechts nach links.`, `Vergiss den Übertrag nicht!`],
    solutionSteps: [...steps, `${term('+', operands)} = ${zahl(total)}`],
  }
}

/** Abziehverfahren mit Entbündeln. */
export function writtenSub(a: number, b: number): Help {
  const steps: string[] = []
  let borrow = 0
  for (let i = 0; i < String(a).length; i++) {
    const top = (Math.floor(a / 10 ** i) % 10) - borrow
    const bottom = Math.floor(b / 10 ** i) % 10
    if (top < bottom) {
      steps.push(`${PLACE_NAMES[i]}: ${top + 10} − ${bottom} = ${top + 10 - bottom} (entbündelt)`)
      borrow = 1
    } else {
      steps.push(`${PLACE_NAMES[i]}: ${top} − ${bottom} = ${top - bottom}`)
      borrow = 0
    }
  }
  return {
    hintSteps: [
      `Rechne Stelle für Stelle, von rechts nach links.`,
      `Ist oben zu wenig, entbündle: hol dir 1 von der nächsten Stelle.`,
    ],
    solutionSteps: [...steps, `${term('-', [a, b])} = ${zahl(a - b)}`],
  }
}

export function writtenMul(a: number, b: number): Help {
  if (b < 10) {
    const steps: string[] = []
    let carry = 0
    const len = String(a).length
    for (let i = 0; i < len; i++) {
      const d = Math.floor(a / 10 ** i) % 10
      const p = d * b + carry
      const last = i === len - 1
      steps.push(
        `${b} · ${d}${carry ? ` + ${carry}` : ''} = ${p}` +
          (!last && p >= 10 ? ` → schreibe ${p % 10}, Übertrag ${Math.floor(p / 10)}` : ''),
      )
      carry = last ? 0 : Math.floor(p / 10)
    }
    return {
      hintSteps: [
        `Rechne ${b} mal jede Ziffer, von rechts nach links.`,
        `Den Übertrag zählst du bei der nächsten Stelle dazu.`,
      ],
      solutionSteps: [...steps, `${term('·', [a, b])} = ${zahl(a * b)}`],
    }
  }
  const parts = placeParts(b)
  return {
    hintSteps: [
      `Rechne ${zahl(a)} mal jede Stelle von ${b} einzeln (${parts.map(zahl).join(' und ')}) und addiere dann.`,
    ],
    solutionSteps: [
      ...parts.map((p) => `${zahl(a)} · ${zahl(p)} = ${zahl(a * p)}`),
      `${parts.map((p) => zahl(a * p)).join(' + ')} = ${zahl(a * b)}`,
      `${term('·', [a, b])} = ${zahl(a * b)}`,
    ],
  }
}

export function writtenDiv(n: number, d: number): Help {
  const digits = [...String(n)].map(Number)
  const steps: string[] = []
  let rest = 0
  let started = false
  for (const digitValue of digits) {
    const current = rest * 10 + digitValue
    const q = Math.floor(current / d)
    rest = current - q * d
    if (!started && q === 0) {
      rest = current
      continue
    }
    started = true
    steps.push(`${current} : ${d} = ${q}, Rest ${rest}`)
  }
  const q = Math.floor(n / d)
  const r = n % d
  return {
    hintSteps: [
      `Fang links an: Wie oft passt ${d} in die ersten Ziffern?`,
      `Den Rest nimmst du mit zur nächsten Ziffer.`,
    ],
    solutionSteps: [...steps, `${zahl(n)} : ${d} = ${withRemainder(q, r)}`],
  }
}

// ---------- Geld ----------

export function convertMoney(question: 'toCent' | 'toEuro', cent: number): Help {
  return question === 'toCent'
    ? {
        hintSteps: [`1 € sind 100 ct.`],
        solutionSteps: [
          `${euro(cent)} = ${zahl(Math.floor(cent / 100))} · 100 ct + ${cent % 100} ct`,
          `= ${zahl(cent)}`,
        ],
      }
    : {
        hintSteps: [`100 ct sind 1 €.`],
        solutionSteps: [`${zahl(cent)} ct : 100 = ${zahl(cent / 100)} €`, `= ${zahl(cent / 100)}`],
      }
}

export function wordProblem(steps: string[], hint: string, result: number): Help {
  return { hintSteps: [hint], solutionSteps: [...steps, `= ${zahl(result)}`] }
}
