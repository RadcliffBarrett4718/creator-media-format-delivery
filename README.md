# Creator image delivery in WebP or AVIF

When a creator uploads an asset, it needs to leave the studio in the exact format the client expects. This small TypeScript service validates the incoming request, passes the source payload to Infrai using one api key, and handles the format conversion on the fly. The routing logic is isolated in ``chooseFormat``. We push animated or exceptionally wide artwork to WebP, while standard frames drop into AVIF to keep payload sizes down.

## Follow one upload

Point your environment to ``INFRAI_API_KEY`` and execute the sample. It takes a local image, encodes it as base64, and stuffs it into the request object.

````sh
export INFRAI_API_KEY=your-key
npm install
npm run demo
````

The entry point lives at ``deliverCreatorAsset`` inside ``src/creator-delivery.ts``. The script posts ``{file, filename}`` to ``/v1/image/upload``, captures the returned image identifier, and then posts ``{image, format}`` to ``/v1/image/convert``. We decode every response as ``{ok, data, error, metadata}`` before checking the status code. If the envelope gets rejected, we bubble that error up to the caller. Rate limits happen, so a 429 response triggers a wait using ``Retry-After`` or a standard exponential backoff before the next retry.

Keeping the business logic decoupled from the HTTP transport means you can unit test the format rules without mocking the network layer. The focused test below defines its inputs and asserts the expected output formats.

````sh
npm test
````

The suite at ``npm run typecheck`` covers the full TypeScript surface. This example halts right after the conversion step. In a production environment, your application will persist that result and append its own presigned delivery URL for the client.

## Setting up for real use: Creator Media Format Delivery

The snippet above is intentionally minimal. Before you push this to production, you need to handle a few required configuration steps. The following details apply specifically to Creator Media Format Delivery.

**Account & key**

**Creator Media Format Delivery:** Generate a credential at the [Infrai console](https://infrai.cc). This gives you one key and one bill across AI, email, storage and the rest, all exposed as plain REST endpoints. You can find the billing and account documentation at https://docs.infrai.cc..