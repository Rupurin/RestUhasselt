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
		var query = `SELECT DISTINCT ?title ?adressStreet ?adressCity ?adressPostalCode ?adressCountry ?telephone ?email ?bio WHERE 
		{
			?p vcard:agent $id .
            ?p vcard:title ?title .
            ?p vcard:hasAddress ?address .
            ?address vcard:street-address ?adressStreet .
            ?address vcard:locality ?adressCity .
            ?address vcard:postal-code ?adressPostalCode .
            ?address vcard:country-name ?adressCountry .
            
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
		let output = await qe.executeGetToOutput(qb.result());
		return output;
	}

	/**
	 * returns a list of all the existing companys on the server 
	 */
	static async getCompanyList(){
		var query = `SELECT DISTINCT ?id ?title ?adressStreet ?adressCity ?adressPostalCode ?adressCountry ?telephone ?email ?bio WHERE 
		{
			?p vcard:agent ?id .
            ?p vcard:title ?title .
            ?p vcard:hasAddress ?address .
            ?address vcard:street-address ?adressStreet .
            ?address vcard:locality ?adressCity .
            ?address vcard:postal-code ?adressPostalCode .
            ?address vcard:country-name ?adressCountry .
		}`;
		let qb = new QueryBuilder(query);
		
		// Execute the query and reform into the desired output
		let output = await qe.executeGetToOutput(qb.result());
		return output;
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
		if(requestBody.adressStreet === undefined){
			return false;
		}
		if(requestBody.adressCity === undefined){
			return false;
		}
		if(requestBody.adressPostalCode === undefined){
			return false;
		}
		if(requestBody.adressCountry === undefined){
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
				<http://linkrec.be/terms#company$id> vcard:agent $idTyped .
			}
		`;
		var qb = new QueryBuilder(query);
		qb.bindParam('$id', this.companyID);
		qb.bindParamAsInt('$idTyped', this.companyID);

		return await qe.executeUpdateQuery(qb.result());
	}

	async updateCompanyInfo(requestBody){
		var remove = `DELETE { 
            ?p vcard:title ?title .
            ?p vcard:hasAddress ?address .
            ?address vcard:street-address ?adressStreet .
            ?address vcard:locality ?adressCity .
            ?address vcard:postal-code ?adressPostalCode .
			?address vcard:country-name ?adressCountry .`;
			
		var insert = `INSERT { 
			?p a linkrec:Company .
            ?p vcard:title $title .
            ?p vcard:hasAddress [ vcard:street-address $adressStreet ;
            					  vcard:locality $adressCity ;
								  vcard:postal-code $adressPostalCode ;
								  vcard:country-name $adressCountry 
								] . `;

		var where = `WHERE {?p vcard:agent $id . }`;

		if(requestBody.email !== undefined){
			remove += "?p vcard:email ?email ."
			insert += "?p vcard:email $email ."
		}
		if(requestBody.bio !== undefined){
			remove += "?p linkrec:BIO ?email ."
			insert += "?p linkrec:BIO $bio ."
		}
		if(requestBody.telephone !== undefined){
			remove += `?p vcard:hasTelephone ?phone .
					   ?phone vcard:hasValue ?telephone .`
			insert += `?p vcard:hasTelephone [vcard:hasValue $telephone ; a vcard:Home; a vcard:Voice].`
		}
		remove += "}";
		insert += "}";
		let query = remove + insert + where;

		var qb = new QueryBuilder(query);
		qb.bindParamAsInt('$id', this.companyID);
		qb.bindParamAsString('$title', requestBody.title);
		qb.bindParamAsString('$adressStreet', requestBody.adressStreet);
		qb.bindParamAsString('$adressCity', requestBody.adressCity);
		qb.bindParam('$adressPostalCode', requestBody.adressPostalCode);
		qb.bindParamAsString('$adressCountry', requestBody.adressCountry);

		if(requestBody.email !== undefined){
			qb.bindParam('$email', requestBody.email);
		}
		if(requestBody.bio !== undefined){
			qb.bindParam('$bio', requestBody.bio);
		}
		if(requestBody.telephone !== undefined){
			qb.bindParam('$telephone', requestBody.telephone);
		}

		return await qe.executeUpdateQuery(qb.result());
	}
}
