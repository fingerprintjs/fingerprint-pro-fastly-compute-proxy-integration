import { getIngressBackendByRegion } from '../../src/utils/getIngressBackendByRegion'
import { expect } from '@jest/globals'

describe('Get Ingress Backend By Region', () => {
  it('should return eu.fpjs if url has eu region query param', () => {
    const url = new URL('https://test/?region=eu')
    const result = getIngressBackendByRegion(url)
    expect(result).toBe('eu.api.fpjs.io')
  })
  it('should return ap.fpjs if url has ap region query param', () => {
    const url = new URL('https://test/?region=ap')
    const result = getIngressBackendByRegion(url)
    expect(result).toBe('ap.api.fpjs.io')
  })
  it('should return fpjs if url has us region query param', () => {
    const url = new URL('https://test/?region=us')
    const result = getIngressBackendByRegion(url)
    expect(result).toBe('api.fpjs.io')
  })
  it('should return fpjs if url has invalid region query param', () => {
    const url = new URL('https://test/?region=invalid')
    const result = getIngressBackendByRegion(url)
    expect(result).toBe('api.fpjs.io')
  })
})
