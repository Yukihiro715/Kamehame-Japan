// Existing published tax-inclusive rates, registered in the KAMEHAME JAPAN
// live Stripe account. Missing price IDs keep checkout disabled.
export const PRIVATE_TEA_CHECKOUT_PRICES: Record<string, { price: string; amount: number }> = {
  regular_solo: { price: "price_1UbNBbDpZ5Y8WoJ2xL41MZJS", amount: 25000 },
  regular_guest: { price: "price_1UbNBQDpZ5Y8WoJ2z5yRYKhe", amount: 16500 },
  peak_solo: { price: "price_1UbNBgDpZ5Y8WoJ2XQtTZsgN", amount: 27500 },
  peak_guest: { price: "price_1UbNBlDpZ5Y8WoJ2wr7OXUEM", amount: 19000 },
};
export const privateTeaCheckoutConfigured = () => Object.values(PRIVATE_TEA_CHECKOUT_PRICES).every(p => /^price_[A-Za-z0-9]+$/.test(p.price));
