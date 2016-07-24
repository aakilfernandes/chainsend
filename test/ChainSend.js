"use strict";

const fs = require('fs')
const crypto = require('crypto')
const contracts = JSON.parse(fs.readFileSync('./generated/contracts.json', 'utf8')).contracts
const chaithereum = require('chaithereum')
const web3 = chaithereum.web3
const chai = chaithereum.chai
const expect = chaithereum.chai.expect

const nullAddress = '0x' + Array(21).join('00')
const tenEther = web3.toWei(10, 'ether')

let account
let accounts
let originalBalance
let addresses
let block

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
  return web3.eth.getBlock.q(0).then((_block) => {
    block = _block
  })
})

describe('ChainSend', () => {

  let chainsend
  
  it('should create a chainsend1 with (addresses[0], block.number, block.hash)', () => {
    return web3.eth.contract(JSON.parse(contracts.ChainSend.interface)).new.q(
      addresses[0], block.number, block.hash, {
        data: contracts.ChainSend.bytecode,
        value: tenEther,
        gas: block.gasLimit
      }
    ).should.eventually.be.contract.then((_chainsend) => {
      chainsend = _chainsend
    })
  })

  it('chainsend should have balance of 0', () => {
    return web3.eth.getBalance.q(chainsend.address).should.eventually.be.bignumber.equal(0)
  })

  it('addresses[0] should have balance of ten ether', () => {
    return web3.eth.getBalance.q(addresses[0]).should.eventually.be.bignumber.equal(tenEther)
  })

  it('should reject chainsend with (0, block.number, block.hash)', () => {
    return web3.eth.contract(JSON.parse(contracts.ChainSend.interface)).new.q(
      0, block.number, block.hash, { data: contracts.ChainSend.bytecode, value: tenEther }
    ).should.be.rejected
  })

  it('should reject chainsend with (address[1], block.number, 0)', () => {
    return web3.eth.contract(JSON.parse(contracts.ChainSend.interface)).new.q(
      0, block.number, 0, { data: contracts.ChainSend.bytecode, value: tenEther }
    ).should.be.rejected
  })

  it('should reject chainsend with (addresses[1], block.number, 1)', () => {
    return web3.eth.contract(JSON.parse(contracts.ChainSend.interface)).new.q(
      addresses[1], block.number, 1, { data: contracts.ChainSend.bytecode, value: tenEther }
    ).should.be.rejected
  })

  it('account should have balance depleted by more than 10 ether', () => {
    return web3.eth.getBalance.q(account).should.eventually.be.bignumber.lessThan(originalBalance.minus(tenEther))
  })

  it('account should have balance depleted by less than 20 ether', () => {
    return web3.eth.getBalance.q(account).should.eventually.be.bignumber.greaterThan(originalBalance.minus(tenEther).minus(tenEther))
  })

  it('addresses[1] should have balance of 0', () => {
    return web3.eth.getBalance.q(addresses[1]).should.eventually.be.bignumber.equal(0)
  })


})