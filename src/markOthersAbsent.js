import { fromEvent } from 'graphcool-lib'

// find students with no record for this class session yet.

export default async event => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { sessionid } = event.data

    const res = await getOthers(api, sessionid)

    // students will be organized into arrays by group, so flattened
    const students = [].concat(
      ...res.ClassSession.groups.map(group => group.students)
    )
    students.forEach(student => {
      markAbsent(api, student, sessionid)
    })
    return { data: { count: students.length } }
  } catch (e) {
    console.log(e)
    return {
      error: 'An unexpected error occured while marking students absent.'
    }
  }
}
const markAbsent = async (api, student, sessionid) => {
  const query = `
  mutation AddAttendanceMutation(
    $student: ID!
    $session: ID!
  ) {
    createAttendance(
      studentId: $student
      classSessionId: $session
      status: Absent
    ) {
      id
    }
  }
  `
  const variables = {
    student: student.id,
    session: sessionid
  }
  return api.request(query, variables)
}
const getOthers = async (api, sessionid) => {
  const query = `
  query StudentsNotMarkedQuery($sessionid: ID!) {
    ClassSession(id: $sessionid) {
      groups {
        students(filter: {attendances_none: {classSession: {id: $sessionid}}}) {
          id
        }
      }
    }
  }`
  const variables = {
    sessionid
  }

  return api.request(query, variables)
}

// graphcool doesn't support cascades or multiple mutation queries, yet, so we do a foreach
