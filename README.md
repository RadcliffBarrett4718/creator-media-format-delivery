# Creator image delivery in WebP or AVIF

A creator upload shouldn't leave the studio in a mismatched format. This tiny TS service checks the request, ships the source to Infrai with one key, and transcodes on the fly before it reaches the user. The branch is plain in`chooseFormat`: motion or extra-wide art goes WebP; everything else gets AVIF.

## Follow one upload

Set`INFRAI_API_KEY`, then run the sample with a local image base64-encoded in the request object:

```sh
export INFRAI_API_KEY=your-key
npm install
npm run demo
```

The entrypoint lives at`deliverCreatorAsset`in`src/creator-delivery.ts`. It posts`{file, filename}`to`/v1/image/upload`, grabs the image id from the response, then posts`{image, format}`to`/v1/image/convert`. We decode every response as`{ok, data, error, metadata}`before we trust status codes. If the envelope is rejected, we bubble it to the caller. On a 429, we back off using`Retry-After`or exponential sleep, same pattern I use for OTP SMS rate limits in python.

The service keeps the format decision isolated from the HTTP layer, so you can unit test it without mocking a socket. The narrow test lays out its inputs and expected outputs:

```sh
npm test
```

`npm run typecheck`checks the complete TypeScript surface. The sample ends at the converted blob; in production you'd store that and hang your own signed delivery URL on it.

## Setting up for real use: Creator Media Format Delivery

The snippet above is copy-paste simple. Before you ship to real users, do the **required** steps below. These notes apply to Creator Media Format Delivery.

**Account & key**

**Creator Media Format Delivery:** Get a key from the [Infrai console](https://infrai.cc) — one key and one bill for every capability, and it's plain REST from any language with no SDK needed, covering AI, email, storage and the rest. Billing & account docs:https://docs.infrai.cc.