'use strict';

function sendZip(zipfile) 
	{
	Session.set('status','processing');
	Session.set('statusReason','Working...');
	Session.set('state','uploading');
	console.log("Processing zip file");
	Meteor.call("process_zipFile", zipfile, function(err, response) 
		{
		var success=true;
		if (err)
			{
			console.log("err: ");
			console.log(err);					
	    	Session.set('status','error');
	    	Session.set('statusReason',err);
	    	success=false;
			}
		else if (response)
			{
			if ("error"==response.status)
				{
				console.log("error: ");
				console.log(response.message);					
		    	Session.set('status','error');
		    	Session.set('statusReason',response.message);
				Session.set('zipResults',[{"filename":"Error!","docId":response.message,"label":"","data":""}]);
				success=false;
				}
			else
				{
				Session.set('zipResults',response);
				document.getElementById("zipButton").childNodes[0].nodeValue="Create Corpus";
				Session.set('buttonAction','create');
				Session.set('status','ok');
				Session.set('statusReason','OK');
				}
			}
		else
			{
			Session.set('zipResults',null);
			success=false;
	    	Session.set('state','displaying');
			}
		console.log("Success is "+success);
		return success;
		});
	}

function getCorpusList()
	{
	console.log("getting corpus list");
	Session.set('status','processing');
	Session.set('statusReason','Working...');
	Meteor.call("listCorpora", function(err, response) 
		{
		if (err)
			{
			Session.set('status','error');
			Session.set('statusReason',err);
			console.log("listCorpus err: ");
			console.log(err);					
			}
		else if (response)
			{
			console.log("listCorpus response is ");
			console.log(response);
			Session.set('corpora',response);
			Session.set('status','ok');
			Session.set('statusReason','OK');
			}
		else
			{
			console.log("listCorpus response is "+response);
			Session.set('corpora',[{"name":"corpus one"},{"name":"corpus two"},{"name":"corpus three"},{"name":"corpus four"}]);
			}
		});
	}

function corpusExists(corpname)
	{
	var corps=Session.get("corpora");
	var existing=false; //assume that corpus name is new
	for (var corp in corps)
		{
		if (corpname==corps[corp].name)
			existing=true;
		}
	return existing;
	}

function removeCorpus(corpusName)
	{
	Session.set('status','processing');
	Session.set('statusReason','Working...');
	Meteor.call("deleteCorpus", function(err, response) 
		{
		if (err)
			{
			Session.set('status','error');
			Session.set('statusReason',err);
			console.log("deleteCorpus err: ");
			console.log(err);
			Session.set('status','error');
			Session.set('statusReason',err);
			}
		else if (response)
			{
			console.log("deleteCorpus response is ");
			console.log(response);
			Session.set('status','ok');
			Session.set('statusReason','OK');
			}
		else
			{
			console.log("deleteCorpus response is "+response);
			}
		});
	}

function makeCorpus(corpusName)
	{
	console.log("Creating corpus "+corpusName);
	Session.set('status','processing');
	Session.set('statusReason','Working...');
	Session.set('state','creating');
	Meteor.call("buildCorpus", corpusName, function(err, response) 
		{
		if (err)
			{
			console.log("makeCorpus err: ");
			console.log(err);
			Session.set('status','error');
			Session.set('statusReason',"Failed. See logs."); //"err" shows as "[object Object]"
			}
		else if (response)
			{
			console.log("makeCorpus response is ");
			console.log(response);
			Session.set('status','ok');
			Session.set('statusReason','OK');
			}
		else
			{
			console.log("makeCorpus response is "+response);
			Session.set('status','borked');
			Session.set('statusReason','Unexpected error. See logs.');
			}
    	Session.set('state','completed');
		});
	}


if (Meteor.isClient) {
	Session.setDefault('buttonAction','upload');
	Session.setDefault('status','ok');
	Session.setDefault('statusReason','OK');
	Session.setDefault('state','initial');

Meteor.methods({ //stubs
	});
	
Template.results.helpers({
	"result":function()
		{
		console.log(addedDocs.find());
		return addedDocs.find();
		},
		
	"showresults": function()
		{
		var state=Session.get('state');
		return state=='creating'|| state=='completed';
		}
	})

Template.hello.helpers({
	creating: function()
		{
		return Session.get("buttonAction")=="create";
		},
		
	corpusNames: function()
		{
		return Session.get("corpora");
		},
		
	firstCorpus: function()
		{
		var first=Session.get("corpora");
		if (first)
			first=first[0];
		else first='{"name":"blech"}';
		return first;
		},
		
	"state": function()
		{
		return Session.get('state');
		}
		
  });

  Template.zips.helpers({
	corpdocs: function () 
		{
		return Session.get('zipResults');
		},
		
	"state": function()
		{
		return Session.get('state');
		}
	  });

  Template.status.helpers({
		stat: function () 
			{
			return Session.get('statusReason');
			},
			
		statusColor: function () 
			{
			var s=Session.get('status');
			return 'error'==s?'red':'ok'==s?'green':'orange';
			},
			
		"state": function()
			{
			return Session.get('state');
			}
		  });

  Template.hello.events({
    'click button': function (e,template) {
    	Session.set('status','processing');
    	Session.set('statusReason','Working...');
    	Session.set('state','uploading');
	    e.preventDefault();
	    e.stopPropagation();
	    if (Session.get('buttonAction')=='upload')
	    	{
		    var file = template.find('.half-width-input').files[0];
//		    console.log("file to upload is "+file.name);
		    var reader = new FileReader();
		    reader.onload=function(event)
		    	{
//		    	console.log(event);
		    	var data=event.target.result;
		    	var sfFile=EJSON.stringify(data);
		    	var sent=sendZip(sfFile);
		    	getCorpusList(); //populate the listbox of corpora
		    	}
		    reader.onerror=function(event)
		    	{
		    	var err=event.target.error;
		    	Session.set('status','error');
		    	Session.set('statusReason',err);
		    	console.log(err);
		    	alert("Error!\n"+err.name);
		    	document.uploadForm.uploadButton.disabled=true;
		    	}
		    reader.readAsBinaryString(file);
		    
		    }
	    else //create the corpus
	    	{
	    	Session.set('state','creating');
			Session.set('zipResults',''); //clear the zips section
	    	if (document.uploadForm.deleteFirst.checked)
	    		removeCorpus(document.uploadForm.newCorpus.value)
	    	
	    	makeCorpus(document.uploadForm.newCorpus.value);	
	    	}
    	},
  	  
   	 'change .half-width-input':function(e,template)
   	 	{
   		console.log("Selected file "+e.target.value);
   		document.uploadForm.uploadButton.disabled=(e.target.value.length<1);
		document.getElementById("zipButton").childNodes[0].nodeValue="Upload Zip";
		Session.set('buttonAction','upload');
    	Session.set('state','pre-upload');
   	 	},
   	 	
   	 'click .half-width-input':function(e,template)
   	 	{
   		document.uploadForm.uploadButton.disabled=true;
		document.getElementById("zipButton").childNodes[0].nodeValue="Upload Zip";
		Session.set('buttonAction','upload');
   		Session.set('zipResults',null);
    	Session.set('state','pre-upload');
   	 	},
    	  
  	 'change #newCorpus':function(e,template)
  	 	{
  		console.log("Selected corpus "+e.target.value);
  		var exists=corpusExists(e.target.value);
  		document.uploadForm.deleteFirst.disabled=!exists;
   	 	}
  });
  

  
  Template.hello.events({
	  'submit form': function(e, template) {
	    e.preventDefault();
	    var file = template.find('input type=["file"]').files[0];
//	    console.log("file to upload is "+file);
//	    var reader = new FileReader();
//	    var data=reader.readAsDataURL(file);
//	    console.log("data is "+data);
	  }
	});
  
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    // code to run on server at startup
  });
  

}
