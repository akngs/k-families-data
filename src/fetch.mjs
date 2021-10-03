import fetch from 'node-fetch'
import { URL, URLSearchParams } from 'url'
import * as fs from 'fs/promises'

const WDQS_ENDPOINT = 'https://query.wikidata.org/bigdata/namespace/wdq/sparql'

async function main() {
  console.info('Running sparql queries...')

  const queryNames = ['persons', 'relatives', 'relatives-indirect']
  const queries = await Promise.all(queryNames.map(loadQuery))
  const [persons, relatives, relativesIndirect] = await Promise.all(queries.map(query))

  console.info('Writing raw csvs...')
  fs.mkdir('data', { recursive: true })
  await Promise.all([
    writeRawCsv('persons', persons),
    writeRawCsv('relatives', relatives),
    writeRawCsv('relatives-indirect', relativesIndirect),
  ])
}

async function loadQuery(name) {
  return fs.readFile(`queries/${name}.sparql`, { encoding: 'utf-8' })
}

async function writeRawCsv(name, content) {
  fs.writeFile(`data/raw-${name}.csv`, content)
}

async function query(sparql) {
  const url = new URL(WDQS_ENDPOINT)
  url.search = new URLSearchParams({ query: sparql })
  const res = await fetch(url, { headers: { Accept: 'text/csv' } })
  const text = await res.text()

  if (res.status !== 200) {
    console.error(res.status)
    console.error(text)
    throw new Error()
  }

  return text
}

// eslint doesn't recognize async/await in top-level code yet
main().then()
