export const makeRequest = (url: URL, init?: RequestInit): FetchEvent => {
  return {
    request: new Request(url, init),
    client: mockClientInfo,
    server: mockServerInfo,
    waitUntil() {},
    respondWith(): void {},
  }
}

const mockClientInfo: ClientInfo = {
  geo: {
    as_name: null,
    city: null,
    area_code: null,
    as_number: null,
    conn_speed: null,
    conn_type: null,
    continent: null,
    country_code: null,
    country_code3: null,
    gmt_offset: null,
    latitude: null,
    longitude: null,
    metro_code: null,
    postal_code: null,
    country_name: null,
    region: null,
    proxy_type: null,
    utc_offset: null,
    proxy_description: null,
  },
  address: 'test',
  tlsClientCertificate: new ArrayBuffer(0),
  tlsClientHello: new ArrayBuffer(0),
  tlsJA3MD5: 'test',
  tlsProtocol: 'test',
  tlsCipherOpensslName: 'test',
}
const mockServerInfo: ServerInfo = {
  address: 'test',
}
