// Existing published tax-inclusive rates. Fill the four Stripe IDs only after
// live-price approval/registration. Empty IDs keep checkout disabled in production.
export const PRIVATE_TEA_CHECKOUT_PRICES: Record<string, { price: string; amount: number }> = {
  regular_solo: { price: "", amount: 25000 },
  regular_guest: { price: "", amount: 16500 },
  peak_solo: { price: "", amount: 27500 },
  peak_guest: { price: "", amount: 19000 },
};
export const privateTeaCheckoutConfigured = () => Object.values(PRIVATE_TEA_CHECKOUT_PRICES).every(p => /^price_[A-Za-z0-9]+$/.test(p.price));
