use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

declare_id!("4pNuGEBPFt8WnNzrqUyHJveRCZTBBSFXYttNNPgnj1Jb"); // Replace if changed

#[program]
pub mod gorbagana_blitz {
    use super::*;

    pub fn initialize_player(ctx: Context<InitializePlayer>, player_id: String) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.player_id = player_id;
        player.score = 0;
        player.power_up = None;
        player.power_up_expires = 0;
        Ok(())
    }

    pub fn update_score(ctx: Context<UpdateScore>, score: u64) -> Result<()> {
        let player = &mut ctx.accounts.player;
        player.score = score;
        Ok(())
    }

    pub fn buy_power_up(ctx: Context<BuyPowerUp>, power_up_type: String) -> Result<()> {
        let player = &mut ctx.accounts.player;
        let gor_account = &ctx.accounts.gor_account;
        let token_program = &ctx.accounts.token_program;

        let cost = match power_up_type.as_str() {
            "speedBoost" => 10_000_000, // 0.01 $GOR (6 decimals)
            _ => return Err(ErrorCode::InvalidPowerUp.into()),
        };

        token::transfer(
            CpiContext::new(
                token_program.to_account_info(),
                Transfer {
                    from: gor_account.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                    authority: ctx.accounts.signer.to_account_info(),
                },
            ),
            cost,
        )?;

        player.power_up = Some(power_up_type);
        player.power_up_expires = Clock::get()?.unix_timestamp + 8; // 8 seconds
        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializePlayer<'info> {
    #[account(init, payer = signer, space = 8 + 4 + 32 + 8 + 4 + 32 + 8)] // Discriminator + string length + u64 + option<string> + i64
    pub player: Account<'info, Player>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateScore<'info> {
    #[account(mut)]
    pub player: Account<'info, Player>,
}

#[derive(Accounts)]
pub struct BuyPowerUp<'info> {
    #[account(mut)]
    pub player: Account<'info, Player>,
    /// CHECK: This is a token account for $GOR, validated by the token program
    pub gor_account: AccountInfo<'info>, // Player's $GOR token account
    /// CHECK: This is the treasury token account for $GOR, validated by the token program
    pub treasury: AccountInfo<'info>,    // Game treasury for $GOR
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, token::Token>,
}

#[account]
#[derive(Default)]
pub struct Player {
    pub player_id: String,        // Variable length, approx 32 bytes max
    pub score: u64,               // 8 bytes
    pub power_up: Option<String>, // Option + variable length, approx 32 bytes max
    pub power_up_expires: i64,    // 8 bytes
}

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid power-up type")]
    InvalidPowerUp,
}