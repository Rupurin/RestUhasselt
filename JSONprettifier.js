module.exports = class JSONPrettifier {
	constructor(){
	}

	simplifyResponse(obj){
		var newobj = [];
		for(var singleQueryObj in obj){
			let singleQuery = obj[singleQueryObj];
			let newObjItem = {};
			for(var singleQueryItem in singleQuery){
				let sqItem = singleQuery[singleQueryItem];
				//sqItem is now something like {type: 'literal', value:'xxxxx'}
				let tmp = sqItem['value'];
				newObjItem[singleQueryItem] = tmp;
			}
			newobj.push(newObjItem);
		}
		return newobj;
	}

	prettify(obj){
		let tmp = obj.results.bindings;
		tmp = this.simplifyResponse(tmp);
		tmp = JSON.stringify(tmp, null, ' ');
		//console.log(tmp);
		return tmp;
	}
}