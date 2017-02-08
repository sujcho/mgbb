// Client ID and API key from the Developer Console
var CLIENT_ID = '1080114981177-7b4s7249nu52cqamdcg8kuct3nc2f48l.apps.googleusercontent.com';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
//var SCOPES = 'https://www.googleapis.com/auth/gmail.readonly';
var SCOPES = 'https://mail.google.com/';	
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

/**
*  On load, called to load the auth2 library and API client library.
*/
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

/**
*  Initializes the API client library and sets up sign-in state
*  listeners.
*/
function initClient() {
  gapi.client.init({
    discoveryDocs: DISCOVERY_DOCS,
    clientId: CLIENT_ID,
    scope: SCOPES
  }).then(function () {
// Listen for sign-in state changes.
gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

// Handle the initial sign-in state.
updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
authorizeButton.onclick = handleAuthClick;
signoutButton.onclick = handleSignoutClick;
});
}

/**
*  Called when the signed in status changes, to update the UI
*  appropriately. After a sign-in, the API is called.
*/
function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'block';
//listLabels3();
listMessages();
} else {
  authorizeButton.style.display = 'block';
  signoutButton.style.display = 'none';
}
}

/**
*  Sign in the user upon button click.
*/
function handleAuthClick(event) {
  gapi.auth2.getAuthInstance().signIn();
}

/**
*  Sign out the user upon button click.
*/
function handleSignoutClick(event) {
  gapi.auth2.getAuthInstance().signOut();
}

/**
* Append a pre element to the body containing the given message
* as its text node. Used to display the results of the API call.
*
* @param {string} message Text to be placed in pre element.
*/
function appendPre(message) {
//var pre = document.getElementById('content');
var pre = document.getElementById('content');
var textContent = document.createTextNode(message + '\n');
pre.appendChild(textContent);
}


function listLabels3() {
  gapi.client.gmail.users.messages.list({
    'userId': 'me'
  }).then(function(response) {
//var labels = response.result.messages;
var messages = response.result.messages;
appendPre('Labels:');

if (messages && messages.length > 0) {
  for (i = 0; i < messages.length; i++) {
    var message = messages[i];
    console.log(message.id)
    var m = gapi.client.gmail.users.messages.get({
      'userId': 'me',
      'id': message.id,
      'format': 'full'
    });
    m.execute(function (response) {
      var h = response.result.payload.headers;
      h.forEach(function(element) {
        if (element.name == 'From') {
         console.log(element.value)
       }
     })
    })


  }
} else {
  appendPre('No Labels found.');
}
});
}

function printlist(response) {
  var messages = response.result.messages;
  appendPre('Labels:');

  if (messages && messages.length > 0) {
    for (i = 0; i < messages.length; i++) {
      var message = messages[i];
      var m = gapi.client.gmail.users.messages.get({
        'userId': 'me',
        'id': message.id,
        'format': 'full'
      });
      m.execute(function (response) {
        var h = response.result.payload.headers;
        h.forEach(function(element) {
          if (element.name == 'From') {
            console.log(element.value)
          }
        })
      })


    }
  } else {
    appendPre('No Labels found.');
  }
}

function listMessages() {
  var getPageOfMessages = function(request, result) {
    request.execute(function(resp) {
      result = result.concat(resp.messages);
      var nextPageToken = resp.nextPageToken;
      if (nextPageToken) {
        request = gapi.client.gmail.users.messages.list({
          'userId': 'me',
          'pageToken': nextPageToken,
        });
        printlist(resp);
        getPageOfMessages(request, result);
      } else {

      }
    });
  };
  var initialRequest = gapi.client.gmail.users.messages.list({
    'userId': 'me',
  });
  getPageOfMessages(initialRequest, []);
}