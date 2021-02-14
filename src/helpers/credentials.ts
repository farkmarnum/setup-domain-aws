import AWS, { Credentials, SharedIniFileCredentials } from 'aws-sdk'

export const setCredentials = (profile?: string): void => {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    // From ENV:
    AWS.config.credentials = new Credentials({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    })
  } else {
    // From ~/.aws/credentials:
    AWS.config.credentials = new SharedIniFileCredentials({
      profile: profile || 'default',
    })
  }
}
