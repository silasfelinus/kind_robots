// /utils/scripts/verifyNetworkSafety.ts
//
// Regression guard for text-generation/t-005: the outbound-URL safety
// checks (server/utils/networkSafety.ts) that block cloud-metadata/
// link-local (and, unless explicitly allowed, loopback) destinations before
// a stored Server.baseUrl -- or any endpoint derived from one -- is dialed.
// Entirely DB-free and covers only the pure/synchronous surface
// (`isPrivateOrReservedIpv4`, `isPrivateOrReservedIpv6`, `isBlockedIpLiteral`,
// `isBlockedHostnameLiteral`, `validateUrlSyntax`, `resolveRedirectLocation`)
// -- `resolveAndValidateHost`/`validateOutboundUrl`'s DNS-resolution branch
// does real network I/O and is deliberately not exercised here, matching
// this repo's DB-free/no-network contract-test convention.
import assert from 'node:assert/strict'
import {
  isBlockedHostnameLiteral,
  isBlockedIpLiteral,
  isPrivateOrReservedIpv4,
  isPrivateOrReservedIpv6,
  resolveRedirectLocation,
  validateUrlSyntax,
} from '../../server/utils/networkSafety'

let failures = 0

function check(label: string, fn: () => void): void {
  try {
    fn()
    console.log(`ok - ${label}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL - ${label}`)
    console.error(error instanceof Error ? error.message : error)
  }
}

// -- isPrivateOrReservedIpv4 --------------------------------------------------

check('blocks 169.254.169.254 (AWS/GCP/Azure/DO/Oracle cloud metadata)', () => {
  assert.equal(isPrivateOrReservedIpv4('169.254.169.254'), true)
})

check('blocks the whole 169.254.0.0/16 link-local range', () => {
  assert.equal(isPrivateOrReservedIpv4('169.254.1.1'), true)
  assert.equal(isPrivateOrReservedIpv4('169.254.255.255'), true)
})

check('blocks 0.0.0.0/8', () => {
  assert.equal(isPrivateOrReservedIpv4('0.0.0.0'), true)
  assert.equal(isPrivateOrReservedIpv4('0.1.2.3'), true)
})

check('blocks loopback 127.0.0.0/8 by default', () => {
  assert.equal(isPrivateOrReservedIpv4('127.0.0.1'), true)
  assert.equal(isPrivateOrReservedIpv4('127.1.2.3'), true)
})

check(
  'allows loopback when allowLoopback is set (operator-configured endpoints only)',
  () => {
    assert.equal(
      isPrivateOrReservedIpv4('127.0.0.1', { allowLoopback: true }),
      false,
    )
  },
)

check('never allows metadata/link-local through allowLoopback', () => {
  assert.equal(
    isPrivateOrReservedIpv4('169.254.169.254', { allowLoopback: true }),
    true,
  )
})

check(
  'does NOT block RFC1918 private ranges (home-LAN self-hosted servers)',
  () => {
    assert.equal(isPrivateOrReservedIpv4('10.0.0.5'), false)
    assert.equal(isPrivateOrReservedIpv4('172.16.0.1'), false)
    assert.equal(isPrivateOrReservedIpv4('172.31.255.254'), false)
    assert.equal(isPrivateOrReservedIpv4('192.168.1.50'), false)
  },
)

check(
  'does NOT block 100.64.0.0/10 (Tailscale CGNAT range -- ServerAccessMode.TAILSCALE)',
  () => {
    assert.equal(isPrivateOrReservedIpv4('100.64.0.1'), false)
    assert.equal(isPrivateOrReservedIpv4('100.100.100.1'), false)
    assert.equal(isPrivateOrReservedIpv4('100.127.255.254'), false)
  },
)

check(
  'blocks the single-IP Alibaba Cloud metadata address even though it is in the CGNAT range',
  () => {
    assert.equal(isBlockedIpLiteral('100.100.100.200'), true)
  },
)

check('does NOT block real public addresses', () => {
  assert.equal(isPrivateOrReservedIpv4('8.8.8.8'), false)
  assert.equal(isPrivateOrReservedIpv4('1.1.1.1'), false)
})

check(
  'rejects malformed IPv4-shaped strings instead of misclassifying them',
  () => {
    assert.equal(isPrivateOrReservedIpv4('999.1.1.1'), false)
    assert.equal(isPrivateOrReservedIpv4('1.2.3'), false)
  },
)

// -- isPrivateOrReservedIpv6 --------------------------------------------------

check('blocks ::1 loopback by default, allows it with allowLoopback', () => {
  assert.equal(isPrivateOrReservedIpv6('::1'), true)
  assert.equal(isPrivateOrReservedIpv6('::1', { allowLoopback: true }), false)
})

check('blocks :: unspecified regardless of allowLoopback', () => {
  assert.equal(isPrivateOrReservedIpv6('::'), true)
  assert.equal(isPrivateOrReservedIpv6('::', { allowLoopback: true }), true)
})

check('blocks fe80::/10 link-local', () => {
  assert.equal(isPrivateOrReservedIpv6('fe80::1'), true)
  assert.equal(isPrivateOrReservedIpv6('fe80::abcd:1234:5678:9abc'), true)
})

check('blocks ff00::/8 multicast', () => {
  assert.equal(isPrivateOrReservedIpv6('ff02::1'), true)
})

check('blocks AWS IPv6 metadata address fd00:ec2::254', () => {
  assert.equal(isBlockedIpLiteral('fd00:ec2::254'), true)
})

check(
  'resolves IPv4-mapped IPv6 addresses and validates the embedded IPv4',
  () => {
    assert.equal(isPrivateOrReservedIpv6('::ffff:127.0.0.1'), true)
    assert.equal(isPrivateOrReservedIpv6('::ffff:169.254.169.254'), true)
    assert.equal(isPrivateOrReservedIpv6('::ffff:8.8.8.8'), false)
  },
)

check('does NOT block Tailscale ULA addresses (fd7a:115c:a1e0::/48)', () => {
  assert.equal(isPrivateOrReservedIpv6('fd7a:115c:a1e0::1'), false)
})

check('does NOT block ordinary public IPv6 addresses', () => {
  assert.equal(isPrivateOrReservedIpv6('2606:4700:4700::1111'), false)
})

check('rejects non-IPv6 strings without throwing', () => {
  assert.equal(isPrivateOrReservedIpv6('not-an-ip'), false)
})

// -- isBlockedHostnameLiteral --------------------------------------------------

check(
  'blocks "localhost" and "*.localhost" by default, allows with allowLoopback',
  () => {
    assert.equal(isBlockedHostnameLiteral('localhost'), true)
    assert.equal(isBlockedHostnameLiteral('foo.localhost'), true)
    assert.equal(
      isBlockedHostnameLiteral('localhost', { allowLoopback: true }),
      false,
    )
  },
)

check(
  'blocks known cloud-metadata hostnames regardless of allowLoopback',
  () => {
    assert.equal(isBlockedHostnameLiteral('metadata.google.internal'), true)
    assert.equal(
      isBlockedHostnameLiteral('metadata.google.internal', {
        allowLoopback: true,
      }),
      true,
    )
    assert.equal(isBlockedHostnameLiteral('metadata'), true)
  },
)

check('does NOT block an ordinary or Tailscale MagicDNS hostname', () => {
  assert.equal(isBlockedHostnameLiteral('myollama.tailnet-name.ts.net'), false)
  assert.equal(isBlockedHostnameLiteral('ollama.home.arpa'), false)
})

// -- validateUrlSyntax --------------------------------------------------------

check('rejects non-http/https schemes', () => {
  const result = validateUrlSyntax('ftp://example.com/')
  assert.equal(result.ok, false)
})

check('rejects file: scheme (classic SSRF-via-scheme-confusion vector)', () => {
  const result = validateUrlSyntax('file:///etc/passwd')
  assert.equal(result.ok, false)
})

check('rejects an unparseable URL', () => {
  const result = validateUrlSyntax('not a url')
  assert.equal(result.ok, false)
})

check('rejects a literal cloud-metadata IP target', () => {
  const result = validateUrlSyntax('http://169.254.169.254/latest/meta-data/')
  assert.equal(result.ok, false)
})

check('rejects a bracketed IPv6 loopback target by default', () => {
  const result = validateUrlSyntax('http://[::1]:8080/')
  assert.equal(result.ok, false)
})

check('accepts a home-LAN http target', () => {
  const result = validateUrlSyntax('http://192.168.1.50:11434/api/chat')
  assert.equal(result.ok, true)
})

check('accepts a Tailscale CGNAT http target', () => {
  const result = validateUrlSyntax('http://100.101.102.103:11434/api/chat')
  assert.equal(result.ok, true)
})

check('accepts the well-known cloud API https targets', () => {
  assert.equal(
    validateUrlSyntax('https://api.openai.com/v1/chat/completions').ok,
    true,
  )
  assert.equal(
    validateUrlSyntax('https://api.anthropic.com/v1/messages').ok,
    true,
  )
})

check('accepts a loopback target only when allowLoopback is set', () => {
  assert.equal(validateUrlSyntax('http://localhost:11434/api/chat').ok, false)
  assert.equal(
    validateUrlSyntax('http://localhost:11434/api/chat', {
      allowLoopback: true,
    }).ok,
    true,
  )
  assert.equal(validateUrlSyntax('http://127.0.0.1:11434/api/chat').ok, false)
  assert.equal(
    validateUrlSyntax('http://127.0.0.1:11434/api/chat', {
      allowLoopback: true,
    }).ok,
    true,
  )
})

// -- resolveRedirectLocation ---------------------------------------------------

check('resolves a relative Location against the originating URL', () => {
  const from = new URL('http://192.168.1.50:11434/api/chat')
  const next = resolveRedirectLocation(from, '/v2/api/chat')
  assert.ok(next)
  assert.equal(next?.href, 'http://192.168.1.50:11434/v2/api/chat')
})

check('resolves an absolute Location as-is', () => {
  const from = new URL('http://192.168.1.50:11434/api/chat')
  const next = resolveRedirectLocation(
    from,
    'http://169.254.169.254/latest/meta-data/',
  )
  assert.ok(next)
  assert.equal(next?.hostname, '169.254.169.254')
})

check('returns null for a missing or unusable Location header', () => {
  const from = new URL('http://192.168.1.50:11434/api/chat')
  assert.equal(resolveRedirectLocation(from, null), null)
  assert.equal(resolveRedirectLocation(from, ''), null)
})

if (failures > 0) {
  console.error(`\n${failures} failure(s).`)
  process.exitCode = 1
} else {
  console.log('\nAll network-safety self-tests passed.')
}
