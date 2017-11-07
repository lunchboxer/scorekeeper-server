import * as pinyin from 'pinyin'
import { FunctionEvent } from 'graphcool-lib'
import * as validator from 'validator'

interface EventData {
  id: string
  chineseName: string
  gender: string
  pinyinName: string
  dateOfBirth: string
}

export default async (event: FunctionEvent<EventData>) => {
  // check that chineseName is actually Chinese
  if (event.data.chineseName) {
    let onlyChineseCharacters = /^[\u3400-\u9FBF]+$/.test(event.data.chineseName)
    if (!onlyChineseCharacters) {
      return { error: 'ChineseName must contain only Chinese characters.' }
    }
    // convert name to pinyin and add it
    let pinyinName = pinyin(event.data.chineseName)
    pinyinName = pinyinName.join('')
    pinyinName = pinyinName.charAt(0).toUpperCase() + pinyinName.slice(1)
    event.data.pinyinName = pinyinName
  }
  // convert DOB to midnight UTC to avoid timezone problems
  // The datetime string coming in might have some junk on it
  // for simplicity let's assume it's an ISOstring
  if (event.data.dateOfBirth) {
    let dob = event.data.dateOfBirth
    // first, check if it's a date in the past
    if (!validator.isBefore(dob)) {
      return { error: 'dateOfBirth must be a past date' }
    } else {
      event.data.dateOfBirth = dob.split("T")[0] + "T00:00:00Z"
    }

  }

  return { data: event.data }
}
