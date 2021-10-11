import fetch from 'node-fetch'
import { URL, URLSearchParams } from 'url'
import * as fs from 'fs/promises'

const WDQS_ENDPOINT = 'https://query.wikidata.org/bigdata/namespace/wdq/sparql'

/** Executes sparql queries and save raw csv files */
async function main() {
  console.info('Running sparql queries...')
  const queryNames = ['persons', 'relatives', 'relatives-indirect']
  const queries = await Promise.all(queryNames.map(loadQuery))
  const results = await Promise.all(queries.map((q, i) => query(queryNames[i], q)))

  console.info('Writing raw csvs...')
  fs.mkdir('data', { recursive: true })
  await Promise.all(queryNames.map((name, i) => writeRawCsv(name, results[i])))
}

/** Loads sparql query */
async function loadQuery(name) {
  return fs.readFile(`queries/${name}.sparql`, { encoding: 'utf-8' })
}

/** Writes csv */
async function writeRawCsv(name, content) {
  fs.writeFile(`data/raw-${name}.csv`, content)
}

/** Executes sparql query */
async function query(queryName, sparql) {
  const start = Date.now()
  const url = new URL(WDQS_ENDPOINT)
  url.search = new URLSearchParams({ query: sparql })
  const res = await fetch(url, { headers: { Accept: 'text/csv' } })
  const text = await res.text()
  const end = Date.now()
  console.info(`Time elasped for query "${queryName}": ${end - start}ms`)

  if (res.status !== 200) {
    console.error(res.status)
    console.error(text)
    throw new Error()
  }

  return text
}

// eslint doesn't recognize async/await in top-level code yet
main().then()
