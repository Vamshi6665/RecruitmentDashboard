// Starts the server locally or in Docker.
import app from './app.js'
import { config } from './config.js'

app.listen(config.port, () => {
  console.log(`Recruitment Hub API on http://localhost:${config.port} (DATA_SOURCE=${config.dataSource})`)
})
