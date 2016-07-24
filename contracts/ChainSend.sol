contract ChainSend {

  function ChainSend(address to, uint blocknumber, bytes32 blockhash) {
    
    if (to == address(0))
      throw;

    if (blockhash == bytes32(0))
      throw;

    if (blockhash != block.blockhash(blocknumber))
      throw;

    if(!to.send(msg.value))
      throw;

  }

  function(){
    throw;
  }

}
