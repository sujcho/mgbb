/**
 * Retrieve Threads in the user's mailbox matching query.
 *
 * @param  {String} userId User's email address. The special value 'me'
 * can be used to indicate the authenticated user.
 * @param  {String} query String used to filter the Threads listed.
 * @param  {Function} callback Function to call when the request is complete.
 */
function listThreads(userId, query, callback) {
  var getPageOfThreads = function(request, result) {
    request.execute(function (resp) {
      result = result.concat(resp.threads);
      var nextPageToken = resp.nextPageToken;
      if (nextPageToken) {
        request = gapi.client.gmail.users.threads.list({
          'userId': userId,
          'q': query,
          'pageToken': nextPageToken
        });
        getPageOfThreads(request, result);
      } else {
        callback(result);
      }

    });
  };

  var request = gapi.client.gmail.users.threads.list({
    'userId': userId,
    'q': query
  });

  getPageOfThreads(request, []);
}
