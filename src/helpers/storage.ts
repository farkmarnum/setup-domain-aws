import fs from 'fs'
import os from 'os'
import log from './logger'
import { ContactDetail } from 'aws-sdk/clients/route53domains'

const STORAGE_DIR = `${os.homedir()}/.setupDomainAws`
const CONTACT_DETAILS_FILE = `${STORAGE_DIR}/contactDetails.json`

export const getStoredContactDetails = (): ContactDetail | undefined => {
  try {
    log.debug('Checking for existing contact details.')

    const contactDetails = JSON.parse(
      fs.readFileSync(CONTACT_DETAILS_FILE, 'utf-8'),
    )

    if (contactDetails) {
      log.debug('Got existing contact details from file.')
    } else {
      log.debug('No existing contact details.')
    }

    return contactDetails
  } catch (err) {
    log.debug(`Warning: ${err.message}`)
  }
}

export const storeContactDetails = (contactDetails: ContactDetail): void => {
  if (!fs.existsSync(STORAGE_DIR)) {
    log.debug(`Creating ${STORAGE_DIR}`)
    fs.mkdirSync(STORAGE_DIR)
  }

  log.debug(`Writing contact details to ${CONTACT_DETAILS_FILE}`)
  fs.writeFileSync(
    CONTACT_DETAILS_FILE,
    JSON.stringify(contactDetails),
    'utf-8',
  )
}
