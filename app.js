const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const app = express()
app.use(express.json())

const dbpath = path.join(__dirname, 'covid19India.db')
let db = null

const InitializeServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () =>
      console.log('Server is running at http://localhost:3000'),
    )
  } catch (e) {
    console.log(`DB Error : ${e.message}`)
    process.exit(1)
  }
}
InitializeServer()

const convertObjectsIntoCamelFont = dbObject => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getstatesQuery = `
    SELECT * FROM state;`
  const dbresponse = await db.all(getstatesQuery)
  response.send(
    dbresponse.map(eachstate => convertObjectsIntoCamelFont(eachstate)),
  )
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getAStateQuery = `
  SELECT * FROM state WHERE state_id = ${stateId};`
  const dbResponse = await db.get(getAStateQuery)
  response.send(convertObjectsIntoCamelFont(dbResponse))
})

app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const addDistrictQuery = `
    INSERT INTO 
      district (district_name, state_id, cases, cured, active, deaths)
    VALUES 
    (
      '${districtName}',
       ${stateId},
       ${cases}.
       ${cured},
       ${active},
       ${deaths}
    );`

  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getADistrictQuery = `
  SELECT * FROM district WHERE district_id = ${districtId};`
  const dbResponse = await db.get(getADistrictQuery)
  response.send(convertObjectsIntoCamelFont(dbResponse))
})

app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteQuery = `
  DELETE FROM district WHERE district_id = ${districtId};`
  await db.run(deleteQuery)
  response.send('District Removed')
})

app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const districtsDetails = request.body
  const {districtName, stateId, cases, cured, active, deaths} = districtsDetails
  const updateQuery = `
  UPDATE district 
  SET 
  district_name= "${districtName}",
  state_id= ${stateId},
  cases= ${cases},
  cured= ${cured},
  active= ${active},
  deaths= ${deaths}
  WHERE district_id = ${districtId};`
  await db.run(updateQuery)
  response.send('District Details Updated')
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const totalQuery = `SELECT sum(cases), sum(cured), sum(active), sum(deaths)
  FROM  district 
  WHERE state_id = ${stateId};`
  const stats = await db.get(totalQuery)
  console.log(stats)
  response.send({
    totalCases: stats['sum(cases)'],
    totalCured: stats['sum(cured)'],
    totalActive: stats['sum(active)'],
    totaldeaths: stats['sum(deaths)'],
  })
})

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getAnObjQuery = `
  SELECT state_id FROM district WHERE district_id = ${districtId};`
  const stateId_res = await db.get(getAnObjQuery)
  const getStateName = `
  SELECT state_name FROM state WHERE state_id = ${stateId_res.state_id}`
  const dbResponse = await db.get(getStateName)
  response.send(convertObjectsIntoCamelFont(dbResponse))
})

module.exports = app
