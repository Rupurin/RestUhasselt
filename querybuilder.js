module.exports = class QueryBuilder {
	constructor(query){
		this.setQuery(query);
	}

	setQuery(query){
		this.query = query;
	}

	handleRDFPrefix(prefixShort, prefixLong){
		let query = this.query;
		if(prefixShort.substr(-1) !== ':'){
			prefixShort = prefixShort + ':';
		}
		while(query.indexOf(prefixShort) !== -1){
			let i = query.indexOf(prefixShort);

			//we know the short prefix is in the query
			//so we'll need to replace it
			let tmp = query.substr(i, query.length);	

			//tmp is now prefixShort:xxxx
			tmp = tmp.substr(0,tmp.indexOf(" "));

			//tmp2 is now xxxx
			let tmp2 = tmp.substr(tmp.indexOf(":") + 1, tmp.length);
			//make tmp2 into the full, non-shortened URI
			tmp2 = "<" + prefixLong + tmp2 + ">";

			query = query.replace(tmp, tmp2);
			i = query.indexOf(prefixShort);
		}
		this.query = query;
	}

	handleAllPrefixesKnown(){
		this.handleRDFPrefix('linkrec', 'http://linkrec.be/terms/');
		this.handleRDFPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
		this.handleRDFPrefix('foaf', 'http://xmlns.com/foaf/0.1/');
		this.handleRDFPrefix('xsd', 'http://www.w3.org/2001/XMLSchema#');
		this.handleRDFPrefix('vcard', 'http://www.w3.org/2006/vcard/ns#');
	}

	bindParam(paramname, paramval){
		this.query = this.query.replace(paramname, paramval);
	}

	bindParamAsInt(paramname, paramval){
		let newval = '"' + paramval + '"^^xsd:int';
		this.bindParam(paramname, newval);
	}

	bindParamAsString(paramname, paramval){
		let newval = '"' + paramval + '"';
		this.bindParam(paramname, newval);
	}

	result(){
		//console.log(this.query);
		return this.query;
	}
}