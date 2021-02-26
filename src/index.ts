#!/usr/bin/env node

import { Command } from 'commander'
import log from './helpers/logger'
import { setCredentials } from './helpers/credentials'
import requestCert from './cert'
import storeConfig from './store-config'
import registerDomain from './domain'
import getHostedZoneId from './hosted-zone'
import { loadPipedData } from './helpers/stdin'
import pkg from '../package.json'

export const init = async (
  options: Options,
  callback: (options: Options) => Promise<any>,
): Promise<any> => {
  if (options.verbose) log.setLogLevel('info')
  if (options.extraVerbose) log.setLogLevel('debug')

  options.isDemo =
    process.env.SETUP_DOMAIN_AWS_DEMO_MODE_DO_NOT_USE_THIS_IN_PROD === 'true'

  if (options.isDemo) {
    log.debug('STARTING IN DEMO MODE.')
  }

  const { profile } = options
  setCredentials(profile)

  await loadPipedData()

  if (options.getPatFromStdin && !global.pipedInput) {
    log.error('Did not receive stdin!')
    process.exit(1)
  }
  await callback(options)
  process.exit(0)
}

const program = new Command()

const full = async (options: Options) => {
  const { domain, region } = await registerDomain(options)
  const { hostedZoneId } = await getHostedZoneId({ ...options, domain, region })
  const { certificateArn } = await requestCert({ ...options, domain, region })
  await storeConfig({
    ...options,
    domain,
    hostedZoneId,
    certificateArn,
    region,
  })

  log.log()
}

program
  .version(pkg.version)
  .description(
    'Use `setup-domain-aws full` to setup all resources, or other commands to set up one at a time',
  )

program
  .command('full')
  .description(
    'Register domain, request certificate & validate via DNS, and set HOSTED_ZONE_ID, DOMAIN, & CERTIFICATE_ARN as secrets in GitHub repo.',
  )
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option(
    '--profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default')",
  )
  .option('--domain <domain>', 'Domain')
  .option('--region <region>', 'AWS region')
  .option('--get-pat-from-stdin', 'Get GitHub Personal Access Token from stdin')
  .option(
    '--store-config-target <target>',
    'Where to store the generated config: github://<owner/repo> | file://<file_path> | secretsmanager://<prefix> | ssm://<prefix>',
  )
  .action((options) => init(options, full))

program
  .command('register')
  .description('Register domain in Route53')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--domain <domain>', 'Domain')
  .option('--region <region>', 'AWS region')
  .option(
    '--profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default')",
  )
  .action((options) => init(options, registerDomain))

program
  .command('get-hosted-zone')
  .description('Get Hosted Zone Id')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--region <region>', 'AWS region')
  .option('--domain <domain>', 'Domain')
  .option(
    '--profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default')",
  )
  .action((options) => init(options, getHostedZoneId))

program
  .command('cert')
  .description('Request certificate in ACM & validate via Route53 DNS')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option('--region <region>', 'AWS region')
  .option('--domain <domain>', 'Domain')
  .option(
    '--profile <profile name>',
    "AWS profile to use (if unspecified, uses 'default')",
  )
  .action((options) => init(options, requestCert))

program
  .command('store-config')
  .description(
    'upload HOSTED_ZONE_ID, CERTIFICATE_ARN, DOMAIN values to GitHub secrets',
  )
  .usage('setup-domain-aws store-config ')
  .option('-v, --verbose', 'Verbose mode')
  .option('-vv, --extra-verbose', 'Debug mode')
  .option(
    '--store-config-target <target-type://target>',
    'Where to store the generated config: github://<owner/repo> | file://<file_path> | secretsmanager://<prefix> | ssm://<prefix>',
  )
  .option('--get-pat-from-stdin', 'Get GitHub Personal Access Token from stdin')
  .action((options) => init(options, storeConfig))

program.parse()
