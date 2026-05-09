import { importPKCS8, importSPKI } from 'jose'
import { env } from './env.js'

let privateKey: CryptoKey | undefined
let publicKey: CryptoKey | undefined

export async function initJWT(): Promise<void> {
  const rawPrivate = env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n')
  const rawPublic = env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n')

  privateKey = await importPKCS8(rawPrivate, 'RS256') as CryptoKey
  publicKey = await importSPKI(rawPublic, 'RS256') as CryptoKey
}

export function getPrivateKey(): CryptoKey {
  if (!privateKey) throw new Error('JWT keys not initialized — call initJWT() first')
  return privateKey
}

export function getPublicKey(): CryptoKey {
  if (!publicKey) throw new Error('JWT keys not initialized — call initJWT() first')
  return publicKey
}
