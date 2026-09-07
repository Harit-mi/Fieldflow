import { describe, it, expect } from 'vitest';
import { calculateInvoice, calculateLedgerCharge } from './invoiceMath';

describe('invoiceMath', () => {
  it('calculates totals correctly with tax, tips, and partial payments', () => {
    const result = calculateInvoice({
      lineItems: [
        { id: '1', type: 'labor', description: 'Plumbing Repair', amountCents: 15000, quantity: 1, taxable: false },
        { id: '2', type: 'part', description: 'Pipe fittings', amountCents: 2000, quantity: 2, taxable: true },
      ],
      taxRatePercent: 8.5, // 8.5% on $40 of parts = $3.40 (340 cents)
      tipCents: 1000, // $10 tip
      amountPaidCents: 5000, // Paid $50 upfront
    });

    expect(result.subtotalCents).toBe(19000); // $150 + $40
    expect(result.taxableSubtotalCents).toBe(4000); // $40
    expect(result.taxCents).toBe(340); // $3.40
    expect(result.totalBeforeTipCents).toBe(19340); // $193.40
    expect(result.totalCents).toBe(20340); // $203.40
    expect(result.balanceDueCents).toBe(15340); // $203.40 - $50
  });

  describe('calculateLedgerCharge', () => {
    it('charges the remaining amount if partially paid', () => {
      // e.g. $500 invoice, $100 paid in cash on-site, $400 goes to tab
      expect(calculateLedgerCharge(50000, 10000)).toBe(40000);
    });

    it('charges the full amount if nothing paid', () => {
      expect(calculateLedgerCharge(50000, 0)).toBe(50000);
    });

    it('charges 0 if fully paid', () => {
      expect(calculateLedgerCharge(50000, 50000)).toBe(0);
    });
    
    it('charges 0 if overpaid', () => {
      expect(calculateLedgerCharge(50000, 60000)).toBe(0);
    });
  });
});
