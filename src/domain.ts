import log from './helpers/logger'
import startSpinner from './helpers/loader'
import { sleep } from './helpers/util'
import { prompt } from './helpers/prompt'
import { validateDomain, getDomainInfo } from './helpers/domain'
import { getStoredContactDetails, storeContactDetails } from './helpers/storage'
import Route53Domains from 'aws-sdk/clients/route53domains'

const registerDomain = async (options: Options): Promise<DomainResult> => {
  const { isDemo } = options
  let { region, domain } = options

  if (!region) {
    region = (await prompt({
      message: 'Which AWS region?',
      initial: 'us-east-1',
    })) as string
  }

  const route53domains = new Route53Domains({
    apiVersion: '2014-05-15',
    region,
  })

  if (!domain) {
    domain = (await prompt({
      message: 'Domain',
      validate: validateDomain,
    })) as string
  }

  let rootDomain = domain
  const { isSubdomain, tld, sld } = getDomainInfo(domain)
  if (isSubdomain) {
    rootDomain = `${sld}.${tld}`
    log.info(
      `Note: ${domain} is a subdomain, so ${rootDomain} is the domain that will be registered.`,
    )
  }

  if (!isDemo) {
    const { Domains } = await route53domains.listDomains().promise()
    const domains = Domains.map(({ DomainName }) => DomainName)
    const domainIsAlreadyOwned = domains.includes(rootDomain)
    if (domainIsAlreadyOwned) {
      log.info('Domain is already owned. Proceeding.')
      return { domain, region }
    }

    const {
      Availability: availability,
    } = await route53domains
      .checkDomainAvailability({ DomainName: rootDomain })
      .promise()

    if (availability !== 'AVAILABLE') {
      log.error(
        `Domain ${rootDomain} is not available! Status = ${availability}`,
      )
      process.exit(1)
    }
  }

  const existingContactDetail = getStoredContactDetails()

  let shouldUseExistingContactDetails = false
  if (existingContactDetail) {
    log.debug('Existing contact details:')
    log.debug(existingContactDetail)

    shouldUseExistingContactDetails = await prompt({
      type: 'confirm',
      message: 'Existing contact details detected. Use those?',
      initial: true,
    })
  }

  let contactDetails: Route53Domains.ContactDetail = {}
  if (shouldUseExistingContactDetails) {
    contactDetails = existingContactDetail as Route53Domains.ContactDetail
  } else {
    log.log("We'll need some contact info then.\n")

    contactDetails.FirstName = await prompt({ message: 'First name' })
    contactDetails.LastName = await prompt({ message: 'Last name' })
    contactDetails.AddressLine1 = await prompt({ message: 'Address line 1' })
    contactDetails.AddressLine2 = await prompt({ message: 'Address line 2' })
    contactDetails.City = await prompt({ message: 'City' })
    contactDetails.State = await prompt({ message: 'State' })
    contactDetails.CountryCode = await prompt({
      message: 'Country Code',
      initial: 'US',
    })
    contactDetails.ZipCode = await prompt({ message: 'Zipcode' })
    contactDetails.Email = await prompt({ message: 'Email' })
    contactDetails.PhoneNumber = await prompt({
      message: 'Phone number (in the form +1.1234567890)',
      validate: (value: string) =>
        /^\+\d{1,5}\.\d{10}$/.test(value) ||
        'Must be in the form +<country code>.<10-digit number>',
    })
    contactDetails.ContactType = 'PERSON'

    log.log("Great! We'll save those for next time.\n")
    storeContactDetails(contactDetails)
  }

  log.log(
    '\nWarning! Proceeding will cause charges to your AWS account. See https://d32ze2gidvkk54.cloudfront.net/Amazon_Route_53_Domain_Registration_Pricing_20140731.pdf for Domain Registration pricing by TLD.',
  )
  const shouldProceed = await prompt({
    type: 'confirm',
    message: 'Proceed?',
  })
  if (!shouldProceed) {
    process.exit()
  }

  let operationId = ''

  if (!isDemo) {
    const domainRequestOptions = {
      DomainName: rootDomain,
      DurationInYears: 1,
      AutoRenew: true,
      AdminContact: contactDetails,
      RegistrantContact: contactDetails,
      TechContact: contactDetails,
      PrivacyProtectAdminContact: true,
      PrivacyProtectRegistrantContact: true,
      PrivacyProtectTechContact: true,
    }
    const { OperationId } = await route53domains
      .registerDomain(domainRequestOptions)
      .promise()

    operationId = OperationId
    log.debug(`Route53 operationId: ${operationId}`)
  }

  const spinner = startSpinner(
    'Waiting for domain registration request to complete. Note: this can take ~15 minutes.',
  )

  if (isDemo) {
    await sleep(2.5 * 1000)
  } else {
    while (true) {
      const { Status: status } = await route53domains
        .getOperationDetail({ OperationId: operationId })
        .promise()

      if (status === 'SUCCESSFUL') {
        break
      } else if (status === 'ERROR' || status === 'FAILED') {
        log.error(`Domain registration did not succeed. Status: ${status}.`)
        process.exit(1)
      }

      await sleep(10 * 1000)
    }
  }

  spinner.stop()
  log.log('Domain registration complete!')

  return { region, domain }
}

export default registerDomain
