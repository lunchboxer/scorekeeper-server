import { fromEvent } from 'graphcool-lib'

export default async event => {
  const graphcool = fromEvent(event)
  const api = graphcool.api('simple/v1')

  const { value } = event.data
  const { id } = event.data
  // const studentId= "cj9nmjr7k00fq0126ekndjhlj"

  // have to make 3 calls
  // this seems very expensive
  // 1 find that student I just connected the point to
  // seems like making a new resolver instead could be done with fewer calls
  // 2 find current total
  const query = `
    query ($studentId: ID!){
      Student (
        id: $studentId
      ){
        pointsTotal
      }
    }
  `
  const variables = { studentId }
  const queryResponse = await api.request(query, variables)
  let sum = queryResponse.Student.pointsTotal
  console.log(sum)

  // 3 update the pointsTotal
  sum += event.data.value
  const mutation = `
    mutation ($sum: Int!, $studentId: ID!){
      updateStudent(
        id: $studentId
        pointsTotal: $sum
      ) {
        id
      }
    }
  `
  const mutationVariables = { sum, studentId }
  const mutationResponse = await api.request(mutation, mutationVariables)

  return { data: event.data }
}
