export interface LineItem {
  id: string;
  type: 'labor' | 'part' | 'custom';
  description: string;
  amountCents: number;
  quantity: number;
  taxable: boolean;
}

export interface InvoiceMathInput {
  lineItems: LineItem[];
  taxRatePercent: number; // e.g. 8.5 for 8.5%
  tipCents: number;
  amountPaidCents: number; // For partial payments
}

export interface InvoiceMathOutput {
  subtotalCents: number;
  taxableSubtotalCents: number;
  taxCents: number;
  totalBeforeTipCents: number;
  totalCents: number;
  balanceDueCents: number;
}

export function calculateInvoice(input: InvoiceMathInput): InvoiceMathOutput {
  let subtotalCents = 0;
  let taxableSubtotalCents = 0;

  for (const item of input.lineItems) {
    const itemTotal = item.amountCents * item.quantity;
    subtotalCents += itemTotal;
    if (item.taxable) {
      taxableSubtotalCents += itemTotal;
    }
  }

  // Calculate tax (round to nearest cent)
  const taxCents = Math.round(taxableSubtotalCents * (input.taxRatePercent / 100));

  const totalBeforeTipCents = subtotalCents + taxCents;
  const totalCents = totalBeforeTipCents + input.tipCents;
  
  const balanceDueCents = Math.max(0, totalCents - input.amountPaidCents);

  return {
    subtotalCents,
    taxableSubtotalCents,
    taxCents,
    totalBeforeTipCents,
    totalCents,
    balanceDueCents,
  };
}

/**
 * Calculates the amount to charge to a customer's ledger (tab) for an invoice.
 * As per accounting discipline, if an invoice is partially paid on-site, 
 * we only charge the *remaining unpaid amount* to the ledger, NOT the full invoice total.
 */
export function calculateLedgerCharge(invoiceTotalCents: number, amountPaidOnSiteCents: number): number {
  return Math.max(0, invoiceTotalCents - amountPaidOnSiteCents);
}
