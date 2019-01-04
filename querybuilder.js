module.exports = class QueryBuilder {
	constructor(query){
		this.setQuery(query);
		this.prefixesHandled = false;
	}

	setQuery(query){
		this.query = query;
		this.prefixesHandled = false;
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

			//tmp is now prefixShort:xxxx[' '|.|}]
			let endOfWord = tmp.indexOf(" ");
			if(endOfWord > tmp.indexOf("."))
				endOfWord = tmp.indexOf(".");
			if(endOfWord > tmp.indexOf("}"))
				endOfWord = tmp.indexOf("}");
			tmp = tmp.substr(0, endOfWord);

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
		// first off, to make sure the query more legible:
		this.query = this.query.replace("}", " }");
		this.query = this.query.replace("]", " ]");

		// now handle the prefixes
		this.handleRDFPrefix('linkrec', 'http://linkrec.be/terms/');
		this.handleRDFPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
		this.handleRDFPrefix('foaf', 'http://xmlns.com/foaf/0.1/');
		this.handleRDFPrefix('xsd', 'http://www.w3.org/2001/XMLSchema#');
		this.handleRDFPrefix('vcard', 'http://www.w3.org/2006/vcard/ns#');
		this.handleRDFPrefix('geo', 'http://www.opengis.net/ont/geosparql#');
		this.prefixesHandled = true;
	}

	/**
	 * replaces all occurences of the paramname with the value
	 * @deprecated warning this method is not sparql injection save
	 * @param {string} paramname name of the 
	 * @param {string} paramval make sure no sparql injection code is present in this parameter
	 */
	bindParam(paramname, paramval){
		while(this.query.indexOf(paramname) !== -1)
			this.query = this.query.replace(paramname, paramval);
		this.prefixesHandled = false;
	}

	bindParamAsNumber(paramname, paramval){
		let newval = parseInt(paramval, 10);//sparql injection prevention
		this.bindParam(paramname, newval);
	}

	bindParamAsInt(paramname, paramval){
		let newval = '"' + parseInt(paramval, 10) + '"^^xsd:int';//sparql injection prevention
		this.bindParam(paramname, newval);
	}

	bindParamAsString(paramname, paramval){
		let newval = paramval.replace(/"/g, "\\\"");//sparql injection prevention
		newval = paramval.replace(/\\/g, "\\\\");//sparql injection prevention
		newval = '"' + newval + '"';
		this.bindParam(paramname, newval);
	}

	result(){
		if(!this.prefixesHandled)
			this.handleAllPrefixesKnown();
		return this.query;
	}
}