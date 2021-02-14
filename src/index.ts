import { Command } from 'commander'
import log from './helpers/logger'
import { setCredentials } from './helpers/credentials'
import requestCert from './cert'
import uploadConfig from './config'
import registerDomain from './domain'

export const init = async (
  options: Options,
  callback: (options: Options) => Promise<any>,
): Promise<any> => {
  if (options.verbose) log.setLogLevel('info')
  if (options.extraVerbose) log.setLogLevel('debug')

  const { profile } = options
  setCredentials(profile)

  return await callback(options)
}

const program = new Command()

const full = async (options: Options) => {
  const { domain, hostedZoneId } = await registerDomain(options)
  const { certificateArn } = await requestCert({ ...options, domain })
  await uploadConfig({ ...options, domain, hostedZoneId, certificateArn })
}

program.version('0.0.1')

program
  .command('full')
  .description(
    'Register domain, request certificate & validate via DNS, and set HOSTED_ZONE_ID, DOMAIN, & CERTIFICATE_ARN as secrets in GitHub repo.',
  )
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--dry-run', 'Dry run')
  .option(
    '-p, --profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default'",
  )
  .action((options) => init(options, full))

program
  .command('register')
  .description('Register domain in Route53')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--dry-run', 'Dry run')
  .option(
    '-p, --profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default'",
  )
  .action((options) => init(options, registerDomain))

program
  .command('cert')
  .description('Request certificate in ACM & validate via Route53 DNS')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--dry-run', 'Dry run')
  .option(
    '-p, --profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default'",
  )
  .action((options) => init(options, requestCert))

program
  .command('upload-config')
  .description(
    'upload HOSTED_ZONE_ID, CERTIFICATE_ARN, DOMAIN values to GitHub secrets',
  )
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--dry-run', 'Dry run')
  .action((options) => init(options, uploadConfig))

program.parse()
