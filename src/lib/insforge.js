async function issueDeviceTokenWithPassword({ baseUrl, email, password, deviceName }) {
  const accessToken = await signInWithPassword({ baseUrl, email, password });
  const issued = await issueDeviceToken({ baseUrl, accessToken, deviceName });
  return issued;
}

async function issueDeviceTokenWithAccessToken({ baseUrl, accessToken, deviceName }) {
  const issued = await issueDeviceToken({ baseUrl, accessToken, deviceName });
  return issued;
}

async function signInWithPassword({ baseUrl, email, password }) {
  const url = new URL('/api/auth/sessions', baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_e) {}

  if (!res.ok) {
    const msg = data?.message || data?.error || `HTTP ${res.status}`;
    throw new Error(`Sign-in failed: ${msg}`);
  }

  const accessToken = data?.accessToken;
  if (typeof accessToken !== 'string' || accessToken.length === 0) {
    throw new Error('Sign-in failed: missing accessToken');
  }

  return accessToken;
}

async function issueDeviceToken({ baseUrl, accessToken, deviceName }) {
  const url = new URL('/functions/vibescore-device-token-issue', baseUrl).toString();
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ device_name: deviceName, platform: 'macos' })
  });

  const text = await res.text();
  let data = null;
  try {
    data = JSON.parse(text);
  } catch (_e) {}

  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`;
    throw new Error(`Device token issue failed: ${msg}`);
  }

  const token = data?.token;
  const deviceId = data?.device_id;
  if (typeof token !== 'string' || token.length === 0) throw new Error('Device token issue failed: missing token');
  if (typeof deviceId !== 'string' || deviceId.length === 0) throw new Error('Device token issue failed: missing device_id');

  return { token, deviceId };
}

module.exports = {
  issueDeviceTokenWithPassword,
  issueDeviceTokenWithAccessToken
};
