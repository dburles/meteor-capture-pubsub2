if (Meteor.isClient) {
  Books = new Meteor.Collection('books');

  var searchHandle;

  Tracker.autorun(function() {
    var query = Session.get('query');
    if (query)
      searchHandle = Meteor.subscribe('booksSearch', query);
  });

  Template.body.events({
    'submit form': function(event, template) {
      event.preventDefault();
      var query = template.$('input[type=text]').val();
      if (query)
        Session.set('query', query);
    }
  });

  Template.body.helpers({
    books: function() {
      return Books.find();
    },
    loading: function() {
      return searchHandle && ! searchHandle.ready();
    }
  });
}

if (Meteor.isServer) {
  Meteor.publish('booksSearch', function(query) {
    var self = this;
    try {
      var response = HTTP.get('https://www.googleapis.com/books/v1/volumes', {
        params: {
          q: query
        }
      });

      _.each(response.data.items, function(item) {
        var doc = {
          thumb: item.volumeInfo.imageLinks.smallThumbnail,
          title: item.volumeInfo.title,
          link: item.volumeInfo.infoLink,
          snippet: item.searchInfo.textSnippet
        };

        self.added('books', Random.id(), doc);
      });

      self.ready();

    } catch(error) {
      console.log(error);
    }
  });
}
