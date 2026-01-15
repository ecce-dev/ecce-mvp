import { Turnstile } from '@marsidev/react-turnstile'

/*
* Cloudlfare Turnstile widget for reCAPTCHA v3
* docs: https://developers.cloudflare.com/turnstile/
* Site key: 0x4AAAAAACMszquNSi8MghX3
* Invisible mode
*/

export default function TurnstileWidget() {
  return <Turnstile
    siteKey='0x4AAAAAACMszquNSi8MghX3'
    options={{
      size: 'invisible',
    }}
  />
}
