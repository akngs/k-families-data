import { createReadStream } from 'fs'
import { createObjectCsvWriter as createCsvWriter } from 'csv-writer'
import csvParser from 'csv-parser'

async function main() {
  // Read raw data from CSV files and combine them as a single array
  const files = [
    'data/raw-relatives.csv',
    'data/raw-relatives-indirect.csv',
    'data/raw-persons.csv',
  ]
  const raw = (await Promise.all(files.map(readCsv)))
    .reduce((a, b) => a.concat(b), [])
    .map(simplifyPerson)

  // Cleanse the data
  const personMap = new Map(raw.map((d) => [
    d.key,
    [d.key, d.name, d.gender, d.birthdate, d.deathdate, d.description],
  ]))
  const nationalityMap = new Map()
  const person2person = []
  const person2nationality = []

  raw.forEach((rawPerson) => {
    if (rawPerson.invReltype) {
      const { invReltype } = rawPerson
      const reltype = inverseReltype(rawPerson, invReltype)
      person2person.push([rawPerson.key, rawPerson.relative, reltype])
      person2person.push([rawPerson.relative, rawPerson.key, invReltype])
    }
    if (rawPerson.nationalityKey) {
      nationalityMap.set(
        rawPerson.nationalityKey,
        [rawPerson.nationalityKey, rawPerson.nationalityLabel],
      )
      person2nationality.push([rawPerson.key, rawPerson.nationalityKey])
    }
  })

  // Save CSVs
  const outputs = [
    ['data/persons.csv', ['key', 'name', 'gender', 'birthdate', 'deathdate', 'description'], [...personMap.values()]],
    ['data/nationalities.csv', ['key', 'name'], [...nationalityMap.values()]],
    ['data/person2person.csv', ['a', 'b', 'reltype'], person2person],
    ['data/person2nationality.csv', ['person', 'nationality'], person2nationality],
  ].map(([fileName, fields, data]) => writeCsv(fileName, fields, unique(sort(data))))
  await Promise.all(outputs)
}

function readCsv(filename) {
  return new Promise((resolve) => {
    const data = []
    createReadStream(filename)
      .pipe(csvParser())
      .on('data', (d) => data.push(d))
      .on('end', () => resolve(data))
  })
}

function sort(rows) {
  return rows.sort((a, b) => {
    const aKey = a.join('\t')
    const bKey = b.join('\t')
    if (aKey === bKey) return 0
    return aKey > bKey ? 1 : -1
  })
}

function unique(rows) {
  if (rows.length === 0) return []

  const result = [rows[0]]
  for (let i = 1; i < rows.length; i += 1) {
    const last = result[result.length - 1]
    const cur = rows[i]
    if (last.join('\t') !== cur.join('\t')) result.push(cur)
  }
  return result
}

async function writeCsv(fullpath, header, rows) {
  await createCsvWriter({
    path: fullpath,
    header: header.map((x) => ({ id: x, title: x })),
  }).writeRecords(rows.map((r) => {
    const map = {}
    r.forEach((d, i) => { map[header[i]] = d })
    return map
  }))
}

function simplifyPerson(row) {
  return {
    key: simplifyUriEntity(row.human),
    name: row.humanLabel,
    description: row.humanDescription,
    nationalityKey: simplifyUriEntity(row.nationality),
    nationalityLabel: row.nationalityLabel,
    gender: simplifyGender(row.gender),
    birthdate: simplifyDate(row.birthdate),
    deathdate: simplifyDate(row.deathdate),
    relative: simplifyUriEntity(row.relative),
    invReltype: simplifyReltype(row.invReltype),
  }
}

function simplifyUriEntity(field) {
  if (!field) return null

  const m = field.match(/^https?:\/\/.+?\/([QP]\d+)$/)
  if (!m) {
    console.error(`Invalid entity URI: ${field}`)
    return null
  }

  return m[1]
}

function simplifyDate(field) {
  if (!field) return null

  const m = field.match(/^(\d\d\d\d)-(\d\d)-(\d\d).*$/)
  if (!m) {
    console.error(`Invalid date format: ${field}`)
    return null
  }

  return m.slice(1, 4).join('')
}

const GENDERS = {
  Q48270: 'nb', // non-binary
  Q1052281: 'tf', // trans-female
  Q2449503: 'tm', // trans-male
  Q6581072: 'f', // female
  Q6581097: 'm', // male
}

function simplifyGender(field) {
  const qid = simplifyUriEntity(field)
  if (!qid) return null

  const simplified = GENDERS[qid]
  if (!simplified) {
    console.error(`Unknown gender: ${qid}`)
    console.error(field)
    return null
  }

  return simplified
}

const RELTYPES = {
  P22: 'father',
  P25: 'mother',
  P26: 'spouse',
  P40: 'child',
  P3373: 'sibling',
  Q31184: 'sibling',
  Q9238344: 'grandfather',
  Q9235758: 'grandmother',
}

function simplifyReltype(field) {
  const qid = simplifyUriEntity(field)
  if (!qid) return null

  const simplified = RELTYPES[qid]
  if (!simplified) {
    console.error(`Unknown reltype: ${qid}`)
    console.error(field)
    return null
  }
  return simplified
}

const INV_RELTYPES = {
  mother: () => 'child',
  grandmother: () => 'grandchild',
  father: () => 'child',
  grandfather: () => 'grandchild',
  spouse: () => 'spouse',
  sibling: () => 'sibling',
  child: (p) => (p.gender === 'm' || p.gender === 'tm' ? 'father' : 'mother'),
  grandchild: (p) => (p.gender === 'm' || p.gender === 'tm' ? 'grandfather' : 'grandmother'),
}

function inverseReltype(person, reltype) {
  return INV_RELTYPES[reltype](person)
}

// eslint doesn't recognize async/await in top-level code yet
main().then()
