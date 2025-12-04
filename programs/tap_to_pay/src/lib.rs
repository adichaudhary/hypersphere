use anchor_lang::prelude::*;

declare_id!("TapToPay111111111111111111111111111111111111");

#[program]
pub mod tap_to_pay {
    use super::*;

    pub fn pay_invoice(
        ctx: Context<PayInvoice>,
        payment_intent_id: String,
        amount: u64,
        nonce: [u8; 32],
        bump: u8,
    ) -> Result<()> {
        let pi = &mut ctx.accounts.payment_intent;

        // Verify amount matches
        if pi.amount != amount {
            return err!(ErrorCode::InvalidAmount);
        }

        // Verify nonce matches
        if pi.nonce != nonce {
            return err!(ErrorCode::InvalidNonce);
        }

        // Mark paid
        pi.status = 1u8;

        // Record tx_signature as payer pubkey string (per requirements)
        pi.tx_signature = ctx.accounts.payer.key().to_string();

        // Emit event
        emit!(PaymentEvent {
            payment_intent_id: payment_intent_id.clone(),
            merchant_pubkey: pi.merchant,
            amount: pi.amount,
            tx_signature: pi.tx_signature.clone(),
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct PayInvoice<'info> {
    /// CHECK: PDA for the existing PaymentIntent
    #[account(mut, seeds = [b"payment_intent", payment_intent_id.as_ref()], bump = bump)]
    pub payment_intent: Account<'info, PaymentIntent>,

    #[account(mut)]
    pub payer: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct PaymentIntent {
    pub id: String,
    pub merchant: Pubkey,
    pub amount: u64,
    /// 0 = pending, 1 = paid, 2 = expired
    pub status: u8,
    pub nonce: [u8; 32],
    pub tx_signature: String,
    pub created_at: i64,
}

#[event]
pub struct PaymentEvent {
    pub payment_intent_id: String,
    pub merchant_pubkey: Pubkey,
    pub amount: u64,
    pub tx_signature: String,
}

#[error_code]
pub enum ErrorCode {
    #[msg("The provided amount does not match the payment intent amount")]
    InvalidAmount,
    #[msg("The provided nonce does not match the payment intent nonce")]
    InvalidNonce,
}
