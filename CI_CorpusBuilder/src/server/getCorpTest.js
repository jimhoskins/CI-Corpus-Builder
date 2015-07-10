var username = '73a9b89e-4414-47a0-9cb8-0a16e7b46ce3';
var password = '(redacted)';
var corpusName = 'salesadvisor';
var wiki_concepts_URL="https://gateway.watsonplatform.net/concept-insights-beta/api/v1/graph/wikipedia/en-20120601?func=annotateText";
var corpus_search_URL="https://gateway.watsonplatform.net/concept-insights-beta/api/v1/searchable/"+username+"/salesadvisor";
var fetch_doc_URL="https://gateway.watsonplatform.net/concept-insights-beta/api/v1/corpus/"+username+"/salesadvisor/";

var watson = Npm.require('watson-developer-cloud');
var fs = Npm.require('fs');
var AdmZip = Npm.require('adm-zip');
var unzip=Npm.require('unzip');


var conceptInsights = watson.concept_insights({
	version: 'v1',
	username: username,
	password: password
	});


Meteor.methods({
	
	// Get a list of corpora
	listCorpus:function() 
		{
		console.log("Getting corpus list...");
		corps=null;//global results
		var getCorpSync=Meteor.wrapAsync(conceptInsights.getCorpus);
		corps=getCorpSync({
	  		'id': username,
	  		'access': 'public'
	  		});
		console.log("Retrieved corpora");
		console.log(corps);
		
  	  	return corps;	
		}
	}); //meteor.methods
