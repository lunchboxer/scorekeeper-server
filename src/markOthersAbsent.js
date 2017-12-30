import { fromEvent } from 'graphcool-lib'

export default async event => {
  try {
    const graphcool = fromEvent(event)
    const api = graphcool.api('simple/v1')
    const { sessionId } = event.data

    const res = await getOthers(api, sessionId)

    // students will be organized into arrays by group, so flattened
    const students = [].concat(
      ...res.ClassSession.groups.map(group => group.students)
    )
    students.forEach(student => {
      markAbsent(api, student, sessionId)
    })
    const studentIds = students.map(student => student.id)
    return { data: { changed: studentIds } }
  } catch (e) {
    console.log(e)
    return {
      error: 'An unexpected error occured while marking students absent.'
    }
  }
}
const markAbsent = async (api, student, sessionId) => {
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
    session: sessionId
  }
  return api.request(query, variables)
}

// find students for this classSession with no attendance records yet
const getOthers = async (api, sessionId) => {
  const query = `
  query StudentsNotMarkedQuery($sessionId: ID!) {
    ClassSession(id: $sessionId) {
      groups {
        students(filter: {attendances_none: {classSession: {id: $sessionId}}}) {
          id
        }
      }
    }
  }`
  const variables = {
    sessionId
  }

  return api.request(query, variables)
}

// graphcool doesn't support cascades or multiple mutation queries, yet, so we do a foreach
