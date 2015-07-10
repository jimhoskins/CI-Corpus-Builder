'use strict';

var username = '73a9b89e-4414-47a0-9cb8-0a16e7b46ce3';
var password = 'GJORLArYnWDB';
var corpus_create_URL='https://gateway.watsonplatform.net/concept-insights-beta/api/v1/corpus/'+username+'/';
var corpusListUrl='https://gateway.watsonplatform.net/concept-insights-beta/api/v1/corpus/';
var wiki_concepts_URL="https://gateway.watsonplatform.net/concept-insights-beta/api/v1/graph/wikipedia/en-20120601?func=annotateText";
var corpus_search_URL="https://gateway.watsonplatform.net/concept-insights-beta/api/v1/searchable/"+username+"/salesadvisor";
var fetch_doc_URL="https://gateway.watsonplatform.net/concept-insights-beta/api/v1/corpus/"+username+"/";
var tempfile="tempfile.zip";
var labelTag="<H1>"; //UPPERCASE! Search the doc for this tag to make the label

var watson = Npm.require('watson-developer-cloud');
var fs = Npm.require('fs');
var AdmZip = Npm.require('adm-zip');
var unzip=Npm.require('unzip');
var zipDocs = new Mongo.Collection(null);


// service wrapper
var conceptInsights = watson.concept_insights({
	version: 'v1',
	username: username,
	password: password
	});

function doUnzip() 
	{
	console.log("Unzipping "+tempfile);
	var zip = new AdmZip(tempfile);
	var zipEntries = zip.getEntries();
	var metafile = [];
	var count = 0;
	zipDocs.remove({});
	zipEntries.forEach(function(zipEntry) 
		{
		var entry={"filename":"","docId":"","label":"","data":""};
		var fn=zipEntry.entryName; //filename
		entry.filename=fn;
		entry.docId=fn.replace(/[%\.]/g,""); //Watson doesn't like percent signs or periods.
		console.log(entry.docId);
		var docData=zipEntry.getData().toString();
		entry.data=docData;
		var upData=docData.toUpperCase();
		var labelStart=upData.indexOf(labelTag)+labelTag.length;
		var labelEnd=upData.indexOf("</"+labelTag.substr(1));
		entry.label=docData.substring(labelStart,labelEnd);
		metafile=metafile.concat(entry); //for returning to browser
		zipDocs.insert(entry);			// for adding to corpus later
		count++;
		});
	return metafile;
	}

function makeACorpus(name)
	{
	console.log("makeACorpus: "+name);
	console.log("URL: "+corpus_create_URL+name);
	console.log("data: "+username+":"+password)
	try
		{
		var results=HTTP.put(corpus_create_URL+name,
			{
			"data":{"access": "private"},
			"auth": username+":"+password
	  		});
		console.log("Corpus "+name+" was created.");
		}
	catch(err)
		{
		console.log('Error creating the corpus:', err);
		throw err;
		}
	}

// load the corpus with the documents
function loadCorpus(corpusName) 
	{
	var documents=zipDocs.find();
//	var documents = JSON.parse(fs.readFileSync('/home/david/Documents/Maximum Press/testDocs/doclist.json', 'utf-8'));
	documents.forEach(addDoctoCorpus,{"corpusName":corpusName});
	}

/**
 * Add a document to the corpus
 * @param doc
 * @param index
 * @param array
 * @returns
 */
function addDoctoCorpus(doc, index, array) 
	{
	addedDocs.insert({"label":doc.label});
	console.log("Added "+doc.label);
//	var _document=
//		{
//		user: username,
//		corpus: this.corpusName,
//		// document data
//		documentid: doc.docId,
//		document: {
//			id: doc.docId,
//			label: doc.label,
//			parts: [{
//				name: doc.docId,
//      	   		data: html
//          		}]
//        	}
//		};


	try
		{
		console.log("\n\n\nURL is "+corpus_create_URL+this.corpusName+'/'+doc.docId);
		var stuff={
				"auth":username+":"+password,
		  		"label": doc.label,
				"parts":[{
					"name": doc.docId,
	      	   		"data": doc.data
	          		}]
		  		};
		console.log(stuff);
		var results=HTTP.put(corpus_create_URL+this.corpusName+'/'+doc.docId, stuff);
//			{
//			"auth":username+":"+password,
//	  		"label": doc.label,
//	  		"documentid": doc.docId,
//			"parts":[{
//				name: doc.docId,
//      	   		data: doc.data
//          		}]
//	  		});
		console.log("Add doc "+doc.docId+" to corpus "+this.corpusName+" returned "+results);
		}
	catch(err)
		{
		console.log('Error adding document to the corpus:', err);
		throw err;
		}
	
//	conceptInsights.updateDocument(_document, function(err) 
//  	{
//      if (err)
//      	return console.log(err);
//      else
//        console.log('document created:', _document);
//      });
	}


Meteor.methods({
	
	process_zipFile:function(zipfile)
		{
		console.log("Processing zip ");
		addedDocs.remove({}); //clear the list
		var data=EJSON.parse(zipfile);
		console.log("zipfile is type "+typeof zipfile);
		
		var status="Unzip failed: Unknown error."; //default to failure
		try
			{
			fs.writeFileSync(tempfile, data, 'binary');
			console.log("File "+tempfile+" was written.");
			status=doUnzip();
			}
		catch (err)
			{
			console.log("Error! ");
			console.log(err);
			status={"status":"error","message":err};
			throw err;
			}
		return status;
		},
		
	  // create the corpus
	buildCorpus:function(corpusName)
		{
		console.log("Creating corpus "+corpusName);
		makeACorpus(corpusName); //throws exception to callback if error
		console.log("Loading documents into corpus "+corpusName);
		loadCorpus(corpusName);	 // this too
		return true;
		},

	// Get a list of corpora
	listCorpora:function() 
		{
		console.log("Getting corpus list...");
		var corps=null;
		var corps=HTTP.get(corpusListUrl, 
			{
			"access": "public",
			"id": username,
			"auth":username+":"+password
			});

		console.log("Retrieved corpora");
		var ourCorpora=[];
		for (var seq in corps.data) 
			{
			var corpname=corps.data[seq].id;
			var parts=corpname.split('/');
			if (username==parts[1])
				{
				ourCorpora=ourCorpora.concat({"name":parts[2]});
				}
			}
		
		return ourCorpora;	
		}
		

}); //meteor.methods


