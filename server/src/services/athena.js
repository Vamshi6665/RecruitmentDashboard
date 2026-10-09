// Thin Athena client: start a query with execution parameters, poll until it finishes,
// page through results, and return rows as plain objects. Results go through the LRU cache.
import {
  AthenaClient, GetQueryExecutionCommand, GetQueryResultsCommand, StartQueryExecutionCommand,
} from '@aws-sdk/client-athena'

/** Athena execution parameters are inserted as SQL literals, so strings are quoted here. */
export const toLiteral = v => (typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`)

export function createAthenaRunner({ region, credentials, database, workgroup, outputLocation, timeoutMs }, cache, client = new AthenaClient({ region, credentials })) {
  async function execute(sql, params, deadlineMs) {
    const start = await client.send(new StartQueryExecutionCommand({
      QueryString: sql,
      QueryExecutionContext: { Database: database },
      WorkGroup: workgroup,
      ResultConfiguration: outputLocation ? { OutputLocation: outputLocation } : undefined,
      ExecutionParameters: params.length ? params.map(toLiteral) : undefined,
    }))
    const id = start.QueryExecutionId
    const deadline = Date.now() + deadlineMs
    let delay = 250
    for (;;) {
      const q = await client.send(new GetQueryExecutionCommand({ QueryExecutionId: id }))
      const state = q.QueryExecution?.Status?.State
      if (state === 'SUCCEEDED') break
      if (state === 'FAILED' || state === 'CANCELLED') {
        throw Object.assign(new Error(`Athena ${state}: ${q.QueryExecution?.Status?.StateChangeReason ?? 'no reason given'}`), { code: 'athena_query_failed', status: 502 })
      }
      if (Date.now() > deadline) throw Object.assign(new Error(`Athena query ${id} timed out`), { code: 'athena_timeout', status: 504 })
      await new Promise(r => setTimeout(r, delay))
      delay = Math.min(delay * 1.6, 2000)
    }
    const rows = []
    let header = null
    let token
    do {
      const res = await client.send(new GetQueryResultsCommand({ QueryExecutionId: id, NextToken: token, MaxResults: 1000 }))
      for (const r of res.ResultSet?.Rows ?? []) {
        const vals = (r.Data ?? []).map(d => d.VarCharValue ?? null)
        if (!header) { header = vals.map(v => v ?? ''); continue }
        rows.push(Object.fromEntries(header.map((h, i) => [h, vals[i]])))
      }
      token = res.NextToken
    } while (token)
    return rows
  }

  /** Run `sql` (with `{db}` placeholders) and `?` params; cached by text + params. */
  function run(sql, params = [], { deadlineMs = timeoutMs } = {}) {
    const text = sql.replaceAll('{db}', database)
    return cache.wrap(`athena\u0000${text}\u0000${params.join('\u0001')}`, () => execute(text, params, deadlineMs))
  }

  return { run }
}
