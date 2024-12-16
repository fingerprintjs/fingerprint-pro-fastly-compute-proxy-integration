import { describe, expect, it } from '@jest/globals'
import { cloneFastlyResponse } from '../../src/utils/cloneFastlyResponse'

describe('cloneFastlyResponse', () => {
  it('should clone a response with string body', async () => {
    const originalBody = 'Test body'
    const originalResponse = new Response(originalBody, {
      status: 200,
      statusText: 'OK',
      headers: { 'Content-Type': 'text/plain' },
    })

    const clonedResponse = cloneFastlyResponse(originalBody, originalResponse)

    expect(clonedResponse).toBeInstanceOf(Response)
    expect(clonedResponse.status).toBe(200)
    expect(clonedResponse.statusText).toBe('OK')
    expect(clonedResponse.headers.get('Content-Type')).toBe('text/plain')
    expect(await clonedResponse.text()).toBe(originalBody)
  })

  it('should clone a response with ArrayBuffer body', async () => {
    const originalBody = new ArrayBuffer(8)
    const view = new Uint8Array(originalBody)
    view.set([1, 2, 3, 4, 5, 6, 7, 8])
    const originalResponse = new Response(originalBody, {
      status: 201,
      statusText: 'Created',
      headers: { 'Content-Type': 'application/octet-stream' },
    })

    const clonedResponse = cloneFastlyResponse(originalBody, originalResponse)

    expect(clonedResponse).toBeInstanceOf(Response)
    expect(clonedResponse.status).toBe(201)
    expect(clonedResponse.statusText).toBe('Created')
    expect(clonedResponse.headers.get('Content-Type')).toBe('application/octet-stream')
    const clonedArrayBuffer = await clonedResponse.arrayBuffer()
    expect(new Uint8Array(clonedArrayBuffer)).toEqual(new Uint8Array(originalBody))
  })

  it('should clone a response with null body', async () => {
    const originalResponse = new Response(null, {
      status: 204,
      statusText: 'No Content',
      headers: { 'X-Custom-Header': 'Test' },
    })

    const clonedResponse = cloneFastlyResponse(null, originalResponse)

    expect(clonedResponse).toBeInstanceOf(Response)
    expect(clonedResponse.status).toBe(204)
    expect(clonedResponse.statusText).toBe('No Content')
    expect(clonedResponse.headers.get('X-Custom-Header')).toBe('Test')
    expect(await clonedResponse.text()).toBe('')
  })

  it('should clone a response with multiple headers', async () => {
    const originalBody = 'Test body'
    const originalResponse = new Response(originalBody, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'text/plain',
        'X-Custom-Header-1': 'Value 1',
        'X-Custom-Header-2': 'Value 2',
      },
    })

    const clonedResponse = cloneFastlyResponse(originalBody, originalResponse)

    expect(clonedResponse).toBeInstanceOf(Response)
    expect(clonedResponse.status).toBe(200)
    expect(clonedResponse.statusText).toBe('OK')
    expect(clonedResponse.headers.get('Content-Type')).toBe('text/plain')
    expect(clonedResponse.headers.get('X-Custom-Header-1')).toBe('Value 1')
    expect(clonedResponse.headers.get('X-Custom-Header-2')).toBe('Value 2')
    expect(await clonedResponse.text()).toBe(originalBody)
  })
})
