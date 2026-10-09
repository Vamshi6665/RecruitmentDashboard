import { describe, it, expect } from 'vitest'
import { createAthenaRunner, toLiteral } from '../src/services/athena.js'
import { createCache } from '../src/services/cache.js'
import { appsPage, filterParams } from '../src/services/sql.js'

function fakeClient(states, pages) {
  const sent = []
  let poll = 0, page = 0
  return {
    sent,
    send: async cmd => {
      const name = cmd.constructor.name
      sent.push({ name, input: cmd.input })
      if (name === 'StartQueryExecutionCommand') return { QueryExecutionId: 'q1' }
      if (name === 'GetQueryExecutionCommand') return { QueryExecution: { Status: states[Math.min(poll++, states.length - 1)] } }
      return pages[page++]
    },
  }
}
const row = vals => ({ Data: vals.map(v => ({ VarCharValue: v })) })

describe('Athena runner', () => {
  it('quotes parameters as SQL literals', () => {
    expect(toLiteral("O'Brien")).toBe("'O''Brien'")
    expect(toLiteral('')).toBe("''")
    expect(toLiteral(5)).toBe('5')
  })

  it('polls, pages through results and maps rows by header', async () => {
    const client = fakeClient([{ State: 'RUNNING' }, { State: 'SUCCEEDED' }], [
      { ResultSet: { Rows: [row(['a', 'b']), row(['1', '2'])] }, NextToken: 't' },
      { ResultSet: { Rows: [row(['3', null])] } },
    ])
    const runner = createAthenaRunner({ database: 'db', workgroup: 'wg', timeoutMs: 5000 }, createCache(), client)
    const rows = await runner.run('SELECT * FROM {db}.v_events WHERE x = ?', ['it\'s'])
    expect(rows).toEqual([{ a: '1', b: '2' }, { a: '3', b: null }])
    const start = client.sent[0].input
    expect(start.QueryString).toContain('FROM db.v_events')
    expect(start.ExecutionParameters).toEqual(["'it''s'"])
    expect(start.WorkGroup).toBe('wg')
  })

  it('surfaces failed queries with the Athena reason', async () => {
    const client = fakeClient([{ State: 'FAILED', StateChangeReason: 'TABLE_NOT_FOUND' }], [])
    const runner = createAthenaRunner({ database: 'db', workgroup: 'wg', timeoutMs: 5000 }, createCache(), client)
    await expect(runner.run('SELECT 1')).rejects.toThrow('TABLE_NOT_FOUND')
  })
})

describe('SQL helpers', () => {
  it('orders filter parameters to match the ? placeholders', () => {
    expect(filterParams({ from: 'F', to: 'T', recruiter: 'R', position: 'P', client: 'C' }))
      .toEqual(['F', 'T', 'R', 'R', 'P', 'P', 'C', 'C'])
  })
  it('clamps page limits', () => {
    expect(appsPage(-5, 999)).toContain('OFFSET 0 LIMIT 200')
  })
})
