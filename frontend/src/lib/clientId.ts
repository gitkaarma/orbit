const KEY = 'orbit_client_id'

/** A stable, browser-local anonymous id used to key server-side favorites (no login). */
export function getClientId(): string {
  let id = localStorage.getItem(KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(KEY, id)
  }
  return id
}
