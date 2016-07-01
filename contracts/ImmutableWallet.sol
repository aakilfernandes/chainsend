contract ImmutableWallet {

	address public oracleAddr;
	bytes32 public oracleCodeHash;

	function ImmutableWallet(address _oracleAddr) {
		oracleAddr = _oracleAddr;
		oracleCodeHash = getCodeHash(oracleAddr);
	}

	function getCode(address _addr) constant returns (bytes o_code) {
        assembly {
            let size := extcodesize(_addr)
            o_code := mload(0x40)
            mstore(0x40, add(o_code, and(add(add(size, 0x20), 0x1f), not(0x1f))))
            mstore(o_code, size)
            extcodecopy(_addr, add(o_code, 0x20), 0, size)
        }
    }

    function getCodeHash(address addr) constant returns (bytes32) {
        return sha3(getCode(addr));
    }

    function isImmutable() constant returns(bool){
		return getCodeHash(oracleAddr) == oracleCodeHash;
	}

	mapping(address => uint) balances;
	mapping(address => bool) addrsAdded;
	address[] addrs;

	function getBalance(address addr) constant returns(uint){
		return balances[addr];
	}

	function getAddrsLength() constant returns(uint){
		return addrs.length;
	}

	function getAddr(uint index) constant  returns(address){
		return addrs[index];
	}

	function withdrawTo(address addr){
		if(!isImmutable())
			throw;
		uint balance = balances[msg.sender];
		balances[msg.sender] = 0;
		addr.call.value(balance)();
	}

	function(){
		balances[msg.sender] += msg.value;
		if(!addrsAdded[msg.sender]){
			addrs.push(msg.sender);
			addrsAdded[msg.sender] = true;
		}
	}

	mapping(address => bytes) messages;

	function setMessage(bytes message){
		messages[msg.sender] = message;
	}

	function getMessage(address addr) constant returns(bytes){
		return messages[addr];
	}

}