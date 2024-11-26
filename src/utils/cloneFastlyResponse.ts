export function cloneFastlyResponse(body: string | ArrayBuffer | null, response: Response) {
  return new Response(body, {
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
  })
}
