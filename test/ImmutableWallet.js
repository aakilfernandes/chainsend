"use strict";

const fs = require('fs')
const crypto = require('crypto')
const contracts = JSON.parse(fs.readFileSync('./generated/contracts.json', 'utf8')).contracts
const chaithereum = require('chaithereum')
const web3 = chaithereum.web3
const chai = chaithereum.chai
const expect = chaithereum.chai.expect

const nullAddress = '0x' + Array(21).join('00')
const drainedBalance = web3.toBigNumber(web3.toWei(10, 'ether'))
const gasExpenditures = Array(10)

let account
let accounts
let originalBalance
let addresses

before(() => {
  return chaithereum.promise.then(() => {
    account = chaithereum.account
    accounts = chaithereum.accounts
  })
})

before(() => {
  return chaithereum.generateAddresses().then((_addresses) => {
    addresses = _addresses
  })
})

before(() => {
  return web3.eth.getBalance.q(account).then((_balance) => {
    originalBalance = _balance
  })
})

before(() => {
  //drain balances to 1 eth
  return web3.Q.all(
    Object.keys(new Int8Array(10)).map((index) => {
      return web3.Q.all([
        web3.eth.estimateGas.q({
          to: nullAddress,
          value: originalBalance.minus(drainedBalance),
          from: accounts[index]
        }).then((gas) => {
          gasExpenditures[index] = gas
        }).should.be.fulfilled,
        web3.eth.sendTransaction.q({
          to: nullAddress,
          value: originalBalance.minus(drainedBalance),
          from: accounts[index]
        }).should.be.fulfilled
      ])

    })
  )
})

describe('ImmutableWallet', () => {

  let oracle
  let wallet

  it('should successfully instatiate oracle', () => {
    return web3.eth.contract(JSON.parse(contracts.Oracle.interface)).new.q(
      { data: contracts.Oracle.bytecode }
    ).should.eventually.be.contract.then((_oracle) => {
      oracle = _oracle
    })
  })

  it('should successfully instatiate wallet', () => {
    return web3.eth.contract(JSON.parse(contracts.ImmutableWallet.interface)).new.q(
      oracle.address,
      { data: contracts.ImmutableWallet.bytecode }
    ).should.eventually.be.contract.then((_wallet) => {
      wallet = _wallet
    })
  })

  it('wallet.oracleAddr should be correct', () => {
    return wallet.oracleAddr.q().should.eventually.be.equal(oracle.address)
  })

  it('wallet.oracleCodeHash should be correct', () => {
    return wallet.oracleCodeHash.q().should.eventually.be.equal(
      web3.sha3(contracts.Oracle.runtimeBytecode, { encoding: 'hex' })
    )
  })

  it('wallet.getCode should be correct', () => {
    return wallet.getCode.q(oracle.address).should.eventually.be.equal(
      '0x' + contracts.Oracle.runtimeBytecode
    )
  })

  it('wallet.getCodeHash should be correct', () => {
    return wallet.getCodeHash.q(oracle.address).should.eventually.be.equal(
      web3.sha3(contracts.Oracle.runtimeBytecode, { encoding: 'hex' })
    )
  })

  it('wallet.getBalance(account) should be 0', () => {
    return wallet.getBalance.q(account).should.eventually.be.bignumber.equal(0)
  })

  it('wallet.getAddrsLength() should be 0', () => {
    return wallet.getAddrsLength.q().should.eventually.be.bignumber.equal(0)
  })

  it('should deposit 10 wei from accounts[1]', () => {

    return web3.Q.all([
      web3.eth.estimateGas.q({
        to: wallet.address,
        value: 10,
        from: accounts[1]
      }).then((gas) => {
        gasExpenditures[1] += gas
      }).should.be.fulfilled,
      web3.eth.sendTransaction.q({
        to: wallet.address,
        value: 10,
        from: accounts[1]
      }).should.be.fulfilled
    ])

  })

  it('should deposit 10 wei from accounts[1] (again)', () => {

    return web3.Q.all([
      web3.eth.estimateGas.q({
        to: wallet.address,
        value: 10,
        from: accounts[1]
      }).then((gas) => {
        gasExpenditures[1] += gas
      }).should.be.fulfilled,
      web3.eth.sendTransaction.q({
        to: wallet.address,
        value: 10,
        from: accounts[1]
      }).should.be.fulfilled
    ])

  })

  it('should deposit 15 wei from accounts[2]', () => {

    return web3.Q.all([
      web3.eth.estimateGas.q({
        to: wallet.address,
        value: 15,
        from: accounts[2]
      }).then((gas) => {
        gasExpenditures[2] += gas
      }).should.be.fulfilled,
      web3.eth.sendTransaction.q({
        to: wallet.address,
        value: 15,
        from: accounts[2]
      }).should.be.fulfilled
    ])

  })

  it('accounts[1] should be short 20 wei', () => {
    return web3.eth.getBalance.q(accounts[1]).should.eventually.be.bignumber.equal(
      drainedBalance.minus(20).minus(gasExpenditures[1])
    )
  })

  it('accounts[2] should be short 15 wei', () => {
    return web3.eth.getBalance.q(accounts[2]).should.eventually.be.bignumber.equal(
      drainedBalance.minus(15).minus(gasExpenditures[2])
    )
  })

  it('wallet should have balance of 35 wei', () => {
    return web3.eth.getBalance.q(wallet.address).should.eventually.bignumber.equal(35)
  })

  it('wallet.getBalance(accounts[1]) should be 20', () => {
    return wallet.getBalance.q(accounts[1]).should.eventually.bignumber.equal(20)
  })

  it('wallet.getBalance(accounts[2]) should be 15', () => {
    return wallet.getBalance.q(accounts[2]).should.eventually.bignumber.equal(15)
  })

  it('wallet.withdrawTo(addresses[1]) should be called from accounts[1]', () => {
    return web3.Q.all([
      wallet.withdrawTo.estimateGas.q(addresses[1], { from: accounts[1] }).then((gas) => {
        gasExpenditures[1] += gas
      }).should.be.fulfilled,
      wallet.withdrawTo.q(addresses[1], { from: accounts[1] }).should.be.fulfilled
    ])
  })

  it('wallet should have balance of 15 wei', () => {
    return web3.eth.getBalance.q(wallet.address).should.eventually.bignumber.equal(15)
  })

  it('wallet.getBalance(accounts[1]) should be 0', () => {
    return wallet.getBalance.q(accounts[1]).should.eventually.bignumber.equal(0)
  })

  it('wallet.getBalance(accounts[2]) should be 15', () => {
    return wallet.getBalance.q(accounts[2]).should.eventually.bignumber.equal(15)
  })

  it('addresses[1] should have 20 wei', () => {
    return web3.eth.getBalance.q(addresses[1]).should.eventually.bignumber.equal(20)
  })

  it('wallet.withdrawTo(addresses[2]) should be called from accounts[2]', () => {
    return web3.Q.all([
      wallet.withdrawTo.estimateGas.q(addresses[2], { from: accounts[2] }).then((gas) => {
        gasExpenditures[2] += gas
      }).should.be.fulfilled,
      wallet.withdrawTo.q(addresses[2], { from: accounts[2] }).should.be.fulfilled
    ])
  })

  it('wallet should have balance of 0 wei', () => {
    return web3.eth.getBalance.q(wallet.address).should.eventually.bignumber.equal(0)
  })

  it('wallet.getBalance(accounts[1]) should be 0', () => {
    return wallet.getBalance.q(accounts[1]).should.eventually.bignumber.equal(0)
  })

  it('wallet.getBalance(accounts[2]) should be 0', () => {
    return wallet.getBalance.q(accounts[2]).should.eventually.bignumber.equal(0)
  })

  it('addresses[2] should have 15 wei', () => {
    return web3.eth.getBalance.q(addresses[2]).should.eventually.bignumber.equal(15)
  })

  it('should be able to set a message from accounts[1]', () => {
    return wallet.setMessage.q('hello world!', { from: accounts[1] }).should.be.fulfilled;
  })

  it('should able to get correct message from accounts[1]', () => {
    return wallet.getMessage.q(accounts[1]).should.eventually.be.ascii('hello world!');
  })

})