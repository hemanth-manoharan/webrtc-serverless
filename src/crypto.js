export async function generateKeyPair() {
  const keyPairPromise = await window.crypto.subtle.generateKey({
      name: "ECDSA",
      namedCurve: "P-384"
    },
    true,
    ["sign", "verify"]
  );
  return keyPairPromise;
}

export async function sign(pvtKey, data) {
  const signPromise = await window.crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: {name: "SHA-384"},
    },
    pvtKey,
    data
  );
  return signPromise;
}

export async function exportKeyJWK(key) {
  const exportedJWKPromise = await window.crypto.subtle.exportKey(
    "jwk",
    key
  );
  return exportedJWKPromise;
}

export async function importPrivateKeyJWK(jwk) {
  const importedKeyPromise = await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDSA",
      namedCurve: "P-384"
    },
    true,
    ["sign"]
  );
  return importedKeyPromise;
}
