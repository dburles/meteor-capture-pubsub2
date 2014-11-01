if (Meteor.isClient) {
  Books = new Mongo.Collection('books');

  Session.setDefault('searching', false);

  Tracker.autorun(function() {
    if (Session.get('query')) {
      var searchHandle = Meteor.subscribe('booksSearch', Session.get('query'));
      Session.set('searching', ! searchHandle.ready());
    }
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
    searching: function() {
      return Session.get('searching');
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
          snippet: item.searchInfo && item.searchInfo.textSnippet
        };

        self.added('books', Random.id(), doc);
      });

      self.ready();

    } catch(error) {
      console.log(error);
    }
  });
}
