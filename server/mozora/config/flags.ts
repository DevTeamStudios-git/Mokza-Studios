// Feature flag (brief section 4). Off unless set to exactly "1": with the flag off every Mozora API
// route answers 404 and scheduled jobs do nothing, so the host behaves exactly as before.
export function mozoraEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.MOZORA_ENABLED === '1';
}
