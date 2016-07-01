# Immutable Wallet

Note: This contract is still being tested and audited. It has not been deployed, however the intention is to deploy it before any DAO hard fork.

## Explanation

The Immutable Wallet is based on the assumption that Ethereum is an immutable ledger. Ether sent into this wallet can only be withdrawn if Ethereum remtins its fundamental claim of immutability.

## How it works

The Immutable Wallet 

## API

#### Get the balance of an address

    wallet.getBalance(address addr) constant returns(uint);

#### Withdraw balance to a different address

    wallet.withdrawTo(address addr);

#### Get the total number of addresses

    wallet.getAddrsLength();

#### Get the address at a specific index

    wallet.getAddr(uint index) constant returns(address);

#### Set your message

    wallet.setMessage(bytes message);

#### Get a message

    wallet.getMessage(address addr);
