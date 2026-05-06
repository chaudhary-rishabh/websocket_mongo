// Run with: node scripts/generate-keys.js
// Generates RS256 key pair and prints .env lines

import { generateKeyPair } from 'crypto'
import { promisify } from 'util'

const generateKeyPairAsync = promisify(generateKeyPair)

const { privateKey, publicKey } = await generateKeyPairAsync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
})

const escapedPrivate = privateKey.replace(/\n/g, '\\n')
const escapedPublic = publicKey.replace(/\n/g, '\\n')

console.log('\nCopy these into your .env file:\n')
console.log(`JWT_PRIVATE_KEY="${escapedPrivate}"`)
console.log(`JWT_PUBLIC_KEY="${escapedPublic}"`)
