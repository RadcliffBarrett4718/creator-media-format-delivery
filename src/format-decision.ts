export type DeliveryFormat = "webp" | "avif";

export function chooseFormat(input: { animated: boolean; width: number }): DeliveryFormat {
  return input.animated || input.width > 2400 ? "webp" : "avif";
}
