import log from './helpers/logger'
import startSpinner from './helpers/loader'
import { sleep } from './helpers/util'
import { prompt } from './helpers/prompt'
import { validateDomain } from './helpers/domain'
import ACM from 'aws-sdk/clients/acm'
import Route53 from 'aws-sdk/clients/route53'
import { createHash } from 'crypto'
import getHostedZoneId from './hosted-zone'

const hash = (data: string) =>
  createHash('sha1').update(data).digest('base64').replace(/[^\w]/g, '')

const requestCert = async (options: Options): Promise<CertResult> => {
  const { isDemo } = options
  let { domain, region } = options

  if (!domain) {
    domain = (await prompt({
      message: 'What domain do you need a certificate for?',
      validate: validateDomain,
    })) as string
  }

  if (!region) {
    region = await prompt({
      message: 'Which AWS region?',
      initial: 'us-east-1',
    })
  }

  const { hostedZoneId } = await getHostedZoneId({ domain, region, isDemo })

  const route53 = new Route53({ apiVersion: '2013-04-01', region })
  const acm = new ACM({ apiVersion: '2015-12-08', region })

  if (!isDemo) {
    const { CertificateSummaryList } = await acm.listCertificates().promise()
    const existingCertificate = CertificateSummaryList?.find(
      ({ DomainName }) => DomainName === domain,
    )
    if (existingCertificate && existingCertificate.CertificateArn) {
      log.info('Certificate has already been created. Proceeding.')
      return { certificateArn: existingCertificate.CertificateArn }
    }
  }

  let certificateArn
  if (!isDemo) {
    const { CertificateArn } = await acm
      .requestCertificate({
        DomainName: domain,
        ValidationMethod: 'DNS',
        SubjectAlternativeNames: [`*.${domain}`],
        IdempotencyToken: hash(domain),
      })
      .promise()
    certificateArn = CertificateArn
  } else {
    certificateArn = 'placeholder'
  }

  if (!certificateArn) {
    log.error('Certificate request failed!')
    process.exit(1)
  }
  log.info(`Certificate created. Arn: ${certificateArn}`)

  let ResourceRecord: ACM.ResourceRecord

  const waitingMessage = 'Waiting 5 seconds...'
  const gettingInfoMessage =
    'Getting info about DNS requirements for certificate.'

  if (isDemo) {
    log.log(waitingMessage)
    await sleep(2.5 * 1000)

    log.log(gettingInfoMessage)
  } else {
    while (true) {
      log.log(waitingMessage)
      await sleep(5 * 1000)

      log.log(gettingInfoMessage)

      const { Certificate: certificate } = await acm
        .describeCertificate({ CertificateArn: certificateArn })
        .promise()

      if (!certificate) {
        log.error(`Unable to retrieve certificate with arn ${certificateArn}`)
        continue
      }

      const { DomainValidationOptions } = certificate
      const dnsInfo = DomainValidationOptions?.find(
        ({ ValidationMethod }) => ValidationMethod === 'DNS',
      )

      if (!dnsInfo || !dnsInfo.ValidationDomain || !dnsInfo.ResourceRecord) {
        log.error(
          `Unable to retrieve DNS validation info for certificate with arn ${certificateArn}`,
        )
        continue
      }

      ;({ ResourceRecord } = dnsInfo)
      break
    }

    const { Value, Name, Type } = ResourceRecord as ACM.ResourceRecord
    const Changes = [
      {
        Action: 'CREATE',
        ResourceRecordSet: {
          Name,
          Type,
          ResourceRecords: [
            {
              Value,
            },
          ],
          TTL: 3600,
        },
      },
    ]

    await route53
      .changeResourceRecordSets({
        HostedZoneId: hostedZoneId,
        ChangeBatch: { Changes },
      })
      .promise()
  }

  const spinner = startSpinner(
    'Waiting for DNS verification to complete for ACM certificate. Note: this can take several minutes.',
  )

  if (isDemo) {
    await sleep(2.5 * 1000)
  } else {
    while (true) {
      await sleep(5 * 1000)

      const { Certificate: certificateUpdate } = await acm
        .describeCertificate({ CertificateArn: certificateArn })
        .promise()

      if (!certificateUpdate) {
        log.warn(`Unable to retrieve certificate with arn ${certificateArn}`)
        continue
      }

      const { DomainValidationOptions: validationInfo } = certificateUpdate
      const updatedDnsInfo = validationInfo?.find(
        ({ ValidationMethod }) => ValidationMethod === 'DNS',
      )
      if (!updatedDnsInfo) {
        log.warn(
          `Unable to retrieve info for certificate with arn ${certificateArn}`,
        )
        continue
      }

      const { ValidationStatus } = updatedDnsInfo
      if (ValidationStatus === 'SUCCESS') {
        break
      }
      if (ValidationStatus === 'FAILED') {
        log.error(`Certificate DNS verification failed.`)
        process.exit(1)
      }
    }
  }

  spinner.stop()
  log.log('AMC certificate verification complete!')

  return { certificateArn }
}

export default requestCert
