#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, Symbol, Vec, Val};

#[contract]
pub struct EscrowContract;

#[contractimpl]
impl EscrowContract {
    pub fn create_escrow(env: Env, client: Address, developer: Address, amount: i64, fee_percent: i64) {
        env.storage().instance().set(&Symbol::new(&env, "client"), &client);
        env.storage().instance().set(&Symbol::new(&env, "developer"), &developer);
        env.storage().instance().set(&Symbol::new(&env, "amount"), &amount);
        env.storage().instance().set(&Symbol::new(&env, "fee_percent"), &fee_percent);
    }

    pub fn release_payment(env: Env) {
        let client: Address = env.storage().instance().get(&Symbol::new(&env, "client")).unwrap();
        let developer: Address = env.storage().instance().get(&Symbol::new(&env, "developer")).unwrap();
        let amount: i64 = env.storage().instance().get(&Symbol::new(&env, "amount")).unwrap();
        let fee_percent: i64 = env.storage().instance().get(&Symbol::new(&env, "fee_percent")).unwrap();

        let fee_amount = (amount * fee_percent) / 100;
        let developer_payout = amount - fee_amount;

        let fee_vec = Vec::from_array(&env, [Val::from_payload(fee_amount as u64)]);
        let payout_vec = Vec::from_array(&env, [Val::from_payload(developer_payout as u64)]);

        env.invoke_contract::<()>(&client, &Symbol::new(&env, "transfer"), fee_vec);
        env.invoke_contract::<()>(&developer, &Symbol::new(&env, "transfer"), payout_vec);
    }
}
