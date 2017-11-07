import {
  fromEvent
} from 'graphcool-lib'

export default async event => {
  // make sure start is before end
  const {
    startsAt,
    endsAt
  } = event.data
  const startTime = new Date(startsAt)
  const endTime = new Date(endsAt)
  if (endTime - startTime <= 0) {
    return {
      error: 'Start time must be before end time.'
    }
  }

  // check for scheduling conflicts
  const graphcool = fromEvent(event)
  const api = graphcool.api('simple/v1')
  // for now no ClassSessions can overlap at all
  // later only ones with same teacher or group
  const query = `
    query ($startsAt: DateTime!, $endsAt: DateTime!) {
      allClassSessions(
        filter: {
          OR: [{
            AND: [{
              startsAt_lte: $startsAt
            }, {
              endsAt_gte: $startsAt
            }],
            AND: [{
              startsAt_lte: $endsAt
            }, {
              endsAt_gte: $endsAt
            }]
          }]
        }
      ) {
        id
        startsAt
        endsAt
      }
    }
  `
  const variables = { startsAt, endsAt }
  const response = await api.request(query, variables)
  const conflicts = response.allClassSessions
  console.log("conflicts:", JSON.stringify(conflicts))
  // if there is a conflict with another session, error
  if(conflicts.length > 0) {
    const conflictStart = new Date(conflicts[0].startsAt)
    const conflictEnd = new Date(conflicts[0].endsAt)
    return {
      error: `Scheduling conflict with existing class session ${conflicts[0].id}, ${conflictStart.toString()} to ${conflictEnd.toString()}`
    }
  }
  return {
    data: event.data
  }
}
