import fs from 'fs'
import sodium from 'tweetsodium'
import { Octokit } from '@octokit/core'
import log from './logger'

interface UploadToGitHubArgs {
  auth: string
  repo: string
  name: string
  value: string
}
export const uploadToGitHub = async ({
  auth,
  repo,
  name,
  value,
}: UploadToGitHubArgs): Promise<void> => {
  const octokit = new Octokit({ auth })

  const resp = await octokit.request(
    `GET /repos/${repo}/actions/secrets/public-key`,
  )
  const publicKey = resp.data.key
  const publicKeyId = resp.data.key_id
  const keyBytes = Buffer.from(publicKey, 'base64')

  const messageBytes = Buffer.from(value)
  const encryptedBytes = sodium.seal(messageBytes, keyBytes)
  const encrypted = Buffer.from(encryptedBytes).toString('base64')

  const [repoOwner, repoName] = repo.split(/\/(.+)/)

  const { status, data } = await octokit.request(
    `PUT /repos/${repo}/actions/secrets/${name}`,
    {
      owner: repoOwner,
      repo: repoName,
      secret_name: name,
      key_id: publicKeyId,
      encrypted_value: encrypted,
    },
  )

  if (status > 299 || status < 200) {
    log.debug(data)
    throw new Error(`Upload of ${name} was not successful`)
  }

  log.info(`Successfully set value for ${name}`)
}

interface WriteToFileArgs {
  domain: string
  hostedZoneId: string
  certificateArn: string
  path: string
}
export const writeToFile = ({
  domain,
  hostedZoneId,
  certificateArn,
  path,
}: WriteToFileArgs) => {
  const data = `
DOMAIN=${domain}
HOSTED_ZONE_ID=${hostedZoneId}
CERTIFICATE_ARN=${certificateArn}
`

  fs.writeFileSync(path, data)
}
