var CLIENT_ID = '1080114981177-7b4s7249nu52cqamdcg8kuct3nc2f48l.apps.googleusercontent.com';
var DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"];
var SCOPES = 'https://mail.google.com/';
var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

// key map variable to store unread,read,total counts per each sender email address
var senderKeyMap = {};


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

/*
 Function Name: getMessageLists
 Description:
  The function requests list of all messages in user's account
  The function then calls batchMessageList function
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
 Function Name: batchMessageList
 Description:
  The function receives message list object and
  request batch get for every message in the list.
  The function then calls createSenderKeyMap function.
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
    batch.execute(createSenderKeyMap);
  }
}

/*
 Function Name: createSenderKeyMap
 Description:
  This function gets batch result of message metadata
  and create key-value map that contains total number of mails,
  total number of unread and read messages for each sender
 */

function createSenderKeyMap(formatResponse, rawResponse) {
  // Create Key(Sender Address)-Value(Count) map
  for (resp in formatResponse) {
    senderKeyMap[formatResponse[resp].result.payload.headers[0].value] =
      (senderKeyMap[formatResponse[resp].result.payload.headers[0].value] || 0) + 1;
  }
  for (sender in senderKeyMap) {
    console.log("we have ", sender, " duplicated ", senderKeyMap[sender], " times");
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
            })
          }
        } else {
          gapi.client.gmail.users.labels.get({
            'userId': 'me',
            'id': label.id
          }).execute(function(response) {
            totalcount += response.result.messagesTotal;
          })
        }
      }
    } else {}
    console.log(totalcount)
  });
}