/**
 * Print all Labels in the authorized user's inbox. If no labels
 * are found an appropriate message is printed.
 */
function listLabels() {
  gapi.client.gmail.users.threads.list({
    'userId': 'me'
  }).then(function(response) {
    var labels = response.result.threads;
    var my_thread1 = labels[0];
    var my_thread2 = labels[1];

    for(prop in my_thread1){
      console.log('thread1.' + prop, '=', my_thread1[prop]);
    }
    for(prop in my_thread2){
      console.log('thread2.' + prop, '=', my_thread2[prop]);
    }
  //  console.log(labels);
    /*
    appendPre('Labels:');

    if (labels && labels.length > 0) {
      for (i = 0; i < labels.length; i++) {
        var label = labels[i];
        appendPre(label.name)
      }
    } else {
      appendPre('No Labels found.');
    }
    */
  });
}

/**
 * Print all Messages in the authorized user's inbox. If no labels
 * are found an appropriate message is printed.
 */
function listMessages() {
  gapi.client.gmail.users.messages.list({
    'userId': 'me'
  }).then(function(response) {
    var messages = response.result.messages;
    var my_msg1 = messages[0];
    for(prop in my_msg1){
      console.log('my_msg1.' + prop, '=', my_msg1[prop]);
    }
    getMessages(my_msg1.id);

  });
}
/**
 * Print all Messages in the authorized user's inbox. If no labels
 * are found an appropriate message is printed.
 */
function getMessages(messageId){
  gapi.client.gmail.users.messages.get({
    'userId': 'me',
    'id': messageId
  }).execute(function(response) {
    var headers = response.payload.headers;
    console.log(headers);
    headers.forEach (function(item){
      if(item.name == "From")
        console.log(item.value);
    });
  });
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
  var pre = document.getElementById('content');
  var textContent = document.createTextNode(message + '\n');
  pre.appendChild(textContent);
}
