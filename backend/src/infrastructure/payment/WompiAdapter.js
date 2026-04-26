const PaymentPort = require('../../domain/payment/PaymentPort');

class WompiAdapter extends PaymentPort {
  constructor() {
    super();
    this.publicKey  = process.env.WOMPI_PUBLIC_KEY;
    this.privateKey = process.env.WOMPI_PRIVATE_KEY;
    this.baseUrl    = process.env.WOMPI_BASE_URL || 'https://sandbox.wompi.co/v1';
  }

  async createPayment({ amount, currency, orderId, idempotencyKey, metadata }) {
    // En sandbox de Wompi se genera el link de pago
    // Cuando tengas llaves reales solo cambias las variables de entorno
    const amountInCents = Math.round(amount * 100);

    // Simulación para desarrollo — reemplaza con llamada real a Wompi
    if (!this.privateKey || this.privateKey === 'sandbox_key') {
      return {
        paymentId:   `wompi_sim_${idempotencyKey}`,
        status:      'pending',
        redirectUrl: `https://checkout.wompi.co/p/?public-key=${this.publicKey}&amount-in-cents=${amountInCents}&currency=${currency}&reference=${orderId}`,
      };
    }

    // Llamada real a Wompi cuando tengas llaves
    const response = await fetch(`${this.baseUrl}/payment_links`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${this.privateKey}`,
      },
      body: JSON.stringify({
        name:             `Orden ${orderId}`,
        description:      `Pago OrderFlow #${orderId}`,
        single_use:       true,
        collect_shipping: false,
        currency,
        amount_in_cents:  amountInCents,
        redirect_url:     process.env.PAYMENT_REDIRECT_URL,
        reference:        orderId,
      }),
    });

    if (!response.ok)
      throw new Error('Error al crear el pago en Wompi');

    const data = await response.json();
    return {
      paymentId:   data.data.id,
      status:      'pending',
      redirectUrl: `https://checkout.wompi.co/p/?public-key=${this.publicKey}&payment-link-id=${data.data.id}`,
    };
  }

  async getPaymentStatus(paymentId) {
    if (!this.privateKey || this.privateKey === 'sandbox_key') {
      return { paymentId, status: 'approved', amount: 0 };
    }

    const response = await fetch(`${this.baseUrl}/transactions/${paymentId}`, {
      headers: { 'Authorization': `Bearer ${this.privateKey}` },
    });

    if (!response.ok)
      throw new Error('Error al consultar el pago en Wompi');

    const data = await response.json();
    return {
      paymentId: data.data.id,
      status:    data.data.status.toLowerCase(),
      amount:    data.data.amount_in_cents / 100,
    };
  }
}

module.exports = WompiAdapter;