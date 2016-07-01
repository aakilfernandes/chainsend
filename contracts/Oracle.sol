contract Oracle{
	uint a;

	function Oracle(){
		a = 100;
	}

	function setA(uint _a){
		a = _a;
	}
}