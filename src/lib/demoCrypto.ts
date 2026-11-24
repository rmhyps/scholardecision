const encoder = new TextEncoder()

function subtleCrypto() {
  if (!globalThis.crypto?.subtle) throw new Error('Gunakan localhost atau HTTPS untuk fitur kriptografi.')
  return globalThis.crypto.subtle
}

function hex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function sha256(value: string) {
  return hex(await subtleCrypto().digest('SHA-256', encoder.encode(value)))
}

export interface PasswordRecord {
  salt: Uint8Array<ArrayBuffer>
  digest: string
}

async function passwordDigest(password: string, salt: Uint8Array<ArrayBuffer>) {
  const subtle = subtleCrypto()
  const key = await subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 600_000 }, key, 256)
  return hex(bits)
}

export async function makePasswordRecord(password: string): Promise<PasswordRecord> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return { salt, digest: await passwordDigest(password, salt) }
}

export async function passwordMatches(password: string, record: PasswordRecord) {
  return (await passwordDigest(password, record.salt)) === record.digest
}

export async function signDemoPayload(payload: string) {
  const subtle = subtleCrypto()
  const keys = await subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify'])
  const algorithm = { name: 'ECDSA', hash: 'SHA-256' }
  const data = encoder.encode(payload)
  const signature = await subtle.sign(algorithm, keys.privateKey, data)
  if (!await subtle.verify(algorithm, keys.publicKey, signature, data)) throw new Error('Tanda tangan simulasi gagal diverifikasi.')
  return { signature: hex(signature), publicKey: await subtle.exportKey('jwk', keys.publicKey) }
}
