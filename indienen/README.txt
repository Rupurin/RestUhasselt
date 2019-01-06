Stappen om draaiend te krijgen:
1) download de zip op apache jena fuseki (met .war file) op https://jena.apache.org/download/
2) start de fuseki server (in powershell gebruik je het commando "./fuseki-server --mem --update /Test"
4) ga naar http://localhost:3030
5) klik op "add data"
6) upload database.rdf
7) de database is nu opgestart.

8) installeer node.js (https://nodejs.org/en/)
9) open nieuwe terminal in de src map
10) run het commando "npm i"
11) wacht tot alles geinstalleerd is
12) run het commando "node index.js"
13) de api is nu actief

14) Gebruik Postman (https://www.getpostman.com/)
15) importeer de file "Wis-Api.postman_collection.json" (staat in de map demonstratie plan)
16) Alle api calls kunnen nu uitgevoerd worden

Om variablen met een request te versturen:
	1) Bij opstellen van een request:
		a) klik op "body".
		b) klik op x-www-form-urlencoded
		c) vul parameter in
	2) Klik op send.
	(Postman blijft wachten op een antwoord, oneindig lang. Heeft geen slechte gevolgen, gewoon mee opppassen)