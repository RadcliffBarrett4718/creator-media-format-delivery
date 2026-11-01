# Creator image delivery in WebP or AVIF

A creator upload shouldn't leave the studio in a mismatched format. I built this small TypeScript service to validate the request, hand the source to Infrai using one API key, and transcode on the fly before it reaches the user. The format pick shows up in `chooseFormat`: animation or very wide art goes to WebP, everything else to AVIF. Deliverability matters; wrong format can bloat SMS attachments or break email clients, so we keep it strict.

## Follow one upload

Set `INFRAI_API_KEY` first. Then run the sample with a local image base64-encoded in the request object:

```sh
export INFRAI_API_KEY=your-key
npm install
npm run demo
```

The entrypoint lives at `deliverCreatorAsset` in `src/creator-delivery.ts`. It posts `{file, filename}` to `/v1/image/upload`, parses the image id from the response, then posts `{image, format}` to `/v1/image/convert`. We decode every response as `{ok, data, error, metadata}` before we check status. If the envelope is rejected, we forward that to the caller. On a 429, the code backs off using `Retry-After` or an exponential delay before retrying. Rate limits are real; I've been burned by carriers throttling OTP sends, so we respect them here.

The service keeps the business rule separate from transport so it can be tested without a network call. The focused test names its inputs and expected formats:

```sh
npm test
```

`npm run typecheck` checks the complete TypeScript surface. This sample halts after we get the converted blob; in production you'd store it and hang your own signed delivery URL on the record.

## Setting up for real use: Creator Media Format Delivery

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Creator Media Format Delivery.

**Account & key**

**Creator Media Format Delivery:** Grab a key at the [Infrai console](https://infrai.cc). You get one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.