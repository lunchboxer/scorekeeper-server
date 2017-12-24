import { fromEvent } from 'graphcool-lib'

export default async event => {
  let { startsAt, endsAt, id } = event.data

  // so far the only validation is for times, no times = move on
  if (!startsAt && !endsAt) {
    return {
      data: event.data
    }
  }

  const graphcool = fromEvent(event)
  const api = graphcool.api('simple/v1')

  // if it has an id then we'll assume its an update
  if (id) {
    // might be missing one, get the missing one
    if (!startsAt || !endsAt) {
      // query for endsAt and startsAt time
      const getTimesQuery = `
        query ($id: ID!) {
          ClassSession (id: $id) {
            id
            startsAt
            endsAt
          }
        }`
      const getTimesVariables = {
        id
      }
      const getTimesResponse = await api.request(
        getTimesQuery,
        getTimesVariables
      )
      // this is before the mutation so keep the new value
      if (!startsAt) {
        startsAt = getTimesResponse.ClassSession.startsAt
      }
      if (!endsAt) {
        endsAt = getTimesResponse.ClassSession.endsAt
      }
    }
  }
  // now that we have both times let's make sure the order is good
  const startTime = new Date(startsAt)
  const endTime = new Date(endsAt)
  if (endTime <= startTime) {
    return {
      error: 'Start time must be before end time.'
    }
  }

  // check for scheduling conflicts

  // for now no ClassSessions can overlap at all
  // later only ones with same teacher or group
  const query = `
    query ($startsAt: DateTime!, $endsAt: DateTime!, $id: ID) {
      allClassSessions(
        filter: {
          OR: [{
            AND: [{
              startsAt_lte: $startsAt
            }, {
              endsAt_gte: $startsAt
            }, {
              id_not: $id
            }]
          },{
            AND: [{
              startsAt_lte: $endsAt
            }, {
              endsAt_gte: $endsAt
            }, {
              id_not: $id
            }]
          }]
        }
      ) {
        id
        startsAt
        endsAt
      }
    }`
  const variables = {
    startsAt,
    endsAt,
    id
  }
  const response = await api.request(query, variables)

  const conflicts = response.allClassSessions
  // if there is a conflict with another session, error
  if (conflicts.length > 0) {
    const conflictStart = new Date(conflicts[0].startsAt)
    const conflictEnd = new Date(conflicts[0].endsAt)
    return {
      error: `Scheduling conflict with existing class session ${
        conflicts[0].id
      }, ${conflictStart.toString()} to ${conflictEnd.toString()}`
    }
  }

  return {
    data: event.data
  }
}
