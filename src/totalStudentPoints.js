import { FunctionEvent, fromEvent } from 'graphcool-lib'

// for now we just take the studentId and return all points
// custom queries can only take a single parameter

export default async event => {
  console.log("event:", JSON.stringify(event))

  // query the api about points filtering by given student
  // 2 calls : counts of +1 points and counts of -1 points
  const graphcool = fromEvent(event)
  const api = graphcool.api('simple/v1')

  const { studentId } = event.data
  const query = `
    query ($studentId: ID!){
      positive: _allPointsMeta(filter: {
        student: {
          id: $studentId
        }
        value: 1
      }) {
        count
      }
      negative: _allPointsMeta(filter: {
        student: {
          id: $studentId
        }
        value: -1
      }) {
        count
      }
    }
  `
  const variables = { studentId }
  const counts = await api.request(query, variables)
  console.log("counts:", JSON.stringify(counts))
  const positive = counts.positive.count
  const negative = counts.negative.count
  const total = positive - negative
  return { data: { total } }
}
