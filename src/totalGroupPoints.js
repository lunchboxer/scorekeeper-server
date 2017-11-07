import { fromEvent } from 'graphcool-lib'

export default async event => {

  // query the api about points filtering by given student
  const graphcool = fromEvent(event)
  const api = graphcool.api('simple/v1')

  const { groupId } = event.data
  const query = `
    query ($groupId: ID!){
      positive: _allPointsMeta(filter: {
        student: {
          group : {
            id: $groupId
          }
        }
        value: 1
      }) {
        count
      }
      negative: _allPointsMeta(filter: {
        student: {
          group: {
            id: $groupId
          }
        }
        value: -1
      }) {
        count
      }
    }
  `
  const variables = { groupId }
  const counts = await api.request(query, variables)
  const positive = counts.positive.count
  const negative = counts.negative.count
  const total = positive - negative
  return { data: { total, groupId } }
}
