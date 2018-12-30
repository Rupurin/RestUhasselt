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
	
	/**
	 * the info of the company
	 * returns an empty json if the company does not exists
	 */
    async getCompanyInfo(){
		var query = `SELECT DISTINCT ?title ?adressStreet ?adressCity ?adressPostalCode ?adressCountry ?telephone ?email ?bio WHERE 
		{
			?p linkrec:companyid $id .
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
			?p linkrec:companyid ?id .
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
}