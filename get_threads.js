var CLIENT_ID = '1080114981177-7b4s7249nu52cqamdcg8kuct3nc2f48l.apps.googleusercontent.com';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];
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
  }).then(function() {
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
    getMessageLists();
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


function httpGetAsync(theUrl, callback) {
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() {
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
      callback(xmlHttp.responseText);
  }
  xmlHttp.open("GET", theUrl, true); // true for asynchronous 
  xmlHttp.send(null);
}

/****************************************************************/
/********************  END OF EXAMPLE CODE **********************/
/**********************  BEGIN MGBB CODE ************************/
/****************************************************************/

/*
 * Function Name: senderKeyMap
 * Description:
 *  This function receives the batch result of message metadata
 *  and organize metadata by sender email address as well as
 *  sender email domain. For each sender email address and 
 *  each sender email domain, it counts the total number of
 *  messages, the total number of unread messages, and the
 *  total number of read messages.
 * 
 * @param{list} list object of formatted metadata from gapi batch function 
 * @param{list} list object of unformatted json metadata from gapi batch function
 *
 * See: https://developers.google.com/api-client-library/javascript/reference/referencedocs
 *      for further information on gapi client batch function.
 */

var senderKeyMap = function() {
  var keyMapFull = {};
  var keyMapDomain = {};

  this.createKeyMap = function(formatResponse, rawResponse) {
    for (resp in formatResponse) {
      console.log(formatResponse[resp])
      var keyFull = formatResponse[resp].result.payload.headers[0].value;
      if (keyFull.includes("<") && keyFull.includes(">")) {
        keyFull = keyFull.split("<")[1].split(">")[0];
      }
      var keyDomain = keyFull.split("@")[1];
      keyMapFull[keyFull] = (keyMapFull[keyFull] || 0) + 1;
      keyMapDomain[keyDomain] = (keyMapDomain[keyDomain] || 0) + 1;
    }
  }

  this.returnKeyMapFull = function() {
    return keyMapFull;
  }

  this.returnKeyMapDomain = function() {
    return keyMapDomain;
  }
}

var newKeyMap = new senderKeyMap ();

/*
 * Function Name: getMessageLists
 * Description:
 *  The function requests list of all messages in user 's account
 *  The function then calls batchMessageList function
 *  
 * @param {NULL}
 * 
 * See: https://developers.google.com/gmail/api/v1/reference/users/messages/list
 *      for further information on gapi message list function
 */

function getMessageLists() {
  //returnTotalCount()
  var initialRequest = gapi.client.gmail.users.messages.list({
    'userId': 'me',
  });

  var getPageOfMessages = function(request) {
    request.execute(function(messageList) {
      var nextPageToken = messageList.nextPageToken;
      if (nextPageToken) {
        request = gapi.client.gmail.users.messages.list({
          'userId': 'me',
          'maxResults': 100,
          'pageToken': nextPageToken,
        });
        batchMessageList(messageList);
        getPageOfMessages(request);
      }
    });
  };
  getPageOfMessages(initialRequest, []);
}

/*
 * Function Name: batchMessageList
 * Description:
 *  The function receives message list object as an input and
 *  makes batch request batch to get every message in the list.
 *  The function then calls senderKeyMap function.
 * 
 * @param{list} message list object from getMessageLists
 * 
 * See: https://developers.google.com/gmail/api/v1/reference/users/messages/get
 *      for further information on gapi message get function
 * See: https://developers.google.com/api-client-library/javascript/reference/referencedocs
 *      for further information on gapi client batch function
 */


function batchMessageList(messageList) {
  var messages = messageList.result.messages;
  var batch = gapi.client.newBatch();

  if (messages && messages.length > 0) {
    for (i = 0; i < messages.length; i++) {
      var message = messages[i];

      batch.add(gapi.client.gmail.users.messages.get({
        'userId': 'me',
        'id': message.id,
        'format': 'metadata',
        'metadataHeaders': 'From'
      }))
    }

    batch.execute(newKeyMap.createKeyMap);
    //console.log(newKeyMap.returnKeyMapFull());
    //console.log(newKeyMap.returnKeyMapDomain());
  }
}

/*
 Function Name: returnTotalCount
 Description:
  This function reads information on every user's label
  and adds up the number of messages in each label.
  The returned value of total number of messages
  can be used for displaying the progress of the applicaiton.
  */

function returnTotalCount() {
  var totalcount = 0;
  gapi.client.gmail.users.labels.list({
    'userId': 'me'
  }).then(function(response) {
    var labels = response.result.labels;

    if (labels && labels.length > 0) {
      for (i = 0; i < labels.length; i++) {
        var label = labels[i];
        if (label.type == "system") {
          if (label.name == "INBOX") {
            gapi.client.gmail.users.labels.get({
              'userId': 'me',
              'id': label.id
            }).execute(function(response) {
              totalcount += response.result.messagesTotal;
            });
          }
        } else {
          gapi.client.gmail.users.labels.get({
            'userId': 'me',
            'id': label.id
          }).execute(function(response) {
            totalcount += response.result.messagesTotal;
          });
        }
      }
    } else {}
    console.log(totalcount);
  });
}