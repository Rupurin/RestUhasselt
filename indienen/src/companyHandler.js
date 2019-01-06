var QueryBuilder = require('./QueryBuilder')
var JSONPrettifier = require('./JSONprettifier');
var QueryExecutor = require('./QueryExecutor');
var qe = new QueryExecutor();

module.exports = class CompanyHandler {
	constructor(id){
		this.companyID = id;
    }

	setCompanyID(id){
		this.companyID = parseInt(id,10);
	}

	getCompanyID(){
		return this.companyID;
    }

    async thisCompanyExists(){
		return qe.checkCompanyExists(this.companyID);
	}
	
	/**
	 * the info of the company
	 * returns an empty json if the company does not exists
	 */
    async getCompanyInfo(){
		var query = `SELECT DISTINCT ?title ?addressStreet ?addressCity ?addressPostalCode ?addressCountry ?telephone ?email ?bio WHERE 
		{
			?p vcard:agent $id .
            ?p vcard:title ?title .
            ?p vcard:hasAddress ?address .
            ?address vcard:street-address ?addressStreet .
            ?address vcard:locality ?addressCity .
            ?address vcard:postal-code ?addressPostalCode .
            ?address vcard:country-name ?addressCountry .
            
            OPTIONAL {
                ?p vcard:hasTelephone ?phone .
                ?phone vcard:hasValue ?telephone .
                ?p vcard:email ?email .
				?p linkrec:BIO ?bio .
            }
		}`;
		let qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.companyID);
		
		// Execute the query and reform into the desired output
		return await qe.executeGetToOutput(qb.result());
	}

	/**
	 * returns a list of all the existing companys on the server 
	 */
	static async getCompanyList(){
		var query = `SELECT DISTINCT ?id ?title ?addressStreet ?addressCity ?addressPostalCode ?addressCountry ?telephone ?email ?bio WHERE 
		{
			?p vcard:agent ?id .
            ?p vcard:title ?title .
            ?p vcard:hasAddress ?address .
            ?address vcard:street-address ?addressStreet .
            ?address vcard:locality ?addressCity .
            ?address vcard:postal-code ?addressPostalCode .
            ?address vcard:country-name ?addressCountry .
		}`;
		let qb = new QueryBuilder(query);
		
		// Execute the query and reform into the desired output
		return await qe.executeGetToOutput(qb.result());
	}

	/**
	 * checks if the parameters that are required to create a new company are present
	 * @return true if all paramaters are present
	 * 		   false if there is at least one parameter missing
	 * @param requestBody the boddy of the put request 
	 */
	static hasNeededParams(requestBody){
		if(requestBody.title === undefined){
			return false;
		}
		if(requestBody.addressStreet === undefined){
			return false;
		}
		if(requestBody.addressCity === undefined){
			return false;
		}
		if(requestBody.addressPostalCode === undefined){
			return false;
		}
		if(requestBody.addressCountry === undefined){
			return false;
		}
		return true
	}

	/**
	 * create a new empty company
	 */
	async addNewCompany(){
		var query = `
			INSERT DATA {
				<http://linkrec.be/terms#company$id> a linkrec:Company .
				<http://linkrec.be/terms#company$id> vcard:agent $idTyped .
				<http://linkrec.be/terms#company$id> vcard:hasAddress [] .
				<http://linkrec.be/terms#company$id> vcard:hasTelephone [] .
			}
		`;
		var qb = new QueryBuilder(query);
		qb.bindParamAsInt('$idTyped', this.companyID);
		qb.bindParamAsNumber('$id', this.companyID);
		
		return await qe.executeUpdateQuery(qb.result());
	}

	/**
	 * update the values of the company (the company must exists)
	 * @param requestBody.title
	 * @param requestBody.address
	 * @param requestBody.addressStreet
	 * @param requestBody.addressCity
	 * @param requestBody.addressPostalCode
	 * @param requestBody.addressCountry
	 * @param requestBody.email
	 * @param requestBody.BIO
	 * @param requestBody.telephone
	 */
	async updateCompanyInfo(requestBody){
		var links = "";

		if(requestBody.title !== undefined){
			links += "?p vcard:title $title .\n";
		}
		if(requestBody.addressStreet !== undefined){
			links += "?address vcard:street-address $addressStreet .\n";
		}
		if(requestBody.addressCity !== undefined){
			links += "?address vcard:locality $addressCity .\n";
		}
		if(requestBody.addressPostalCode !== undefined){
			links += "?address vcard:postal-code $addressPostalCode .\n";
		}
		if(requestBody.addressCountry !== undefined){
			links += "?address vcard:country-name $addressCountry .\n";
		}
		if(requestBody.email !== undefined){
			links += "?p vcard:email $email .\n";
		}
		if(requestBody.bio !== undefined){
			links += "?p linkrec:BIO $bio .\n";
		}
		if(requestBody.telephone !== undefined){
			links += `?phone vcard:hasValue $telephone .
					  ?phone a vcard:Home .
					  ?phone a vcard:Voice .\n`;
		}

		var deleteStatement = "DELETE{ $statement }WHERE{?p vcard:agent $id .\n ?p vcard:hasAddress ?address .\n ?p vcard:hasTelephone ?phone . $statement };";
		var remove = "";
		let seperateStatements = links.split("\n");
		for(var data in seperateStatements){
			if(seperateStatements[data] ==="")
				continue;
			remove += deleteStatement.replace(/\$statement/g, seperateStatements[data].replace(/\$/g, "?"));
		}
		var insert = "INSERT { " + links + "}\n";
		var where = "WHERE {?p vcard:agent $id .\n ?p vcard:hasAddress ?address .\n ?p vcard:hasTelephone ?phone .\n};";
		let query = remove + insert  + where;
		var qb = new QueryBuilder(query);

		qb.bindParamAsInt('$id', this.companyID);

		if(requestBody.title !== undefined)
			qb.bindParamAsString('$title', requestBody.title);
		if(requestBody.addressStreet !== undefined)
			qb.bindParamAsString('$addressStreet', requestBody.addressStreet);
		if(requestBody.addressCity !== undefined)
			qb.bindParamAsString('$addressCity', requestBody.addressCity);
		if(requestBody.addressPostalCode !== undefined)
			qb.bindParamAsString('$addressPostalCode', requestBody.addressPostalCode);
		if(requestBody.addressCountry !== undefined)
			qb.bindParamAsString('$addressCountry', requestBody.addressCountry);
		if(requestBody.email !== undefined)
			qb.bindParamAsString('$email', requestBody.email);
		if(requestBody.bio !== undefined)
			qb.bindParamAsString('$bio', requestBody.bio);
		if(requestBody.telephone !== undefined)
			qb.bindParamAsString('$telephone', "tel:" + requestBody.telephone);
		
		return await qe.executeUpdateQuery(qb.result());
	}
}
