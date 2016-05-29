var Sails = require('sails'),
    _ = require('underscore'),
    async = require('async');

var opts = {
  connections: {
    postgresql: { softDelete: false }
  }
};

Sails.lift(opts, function(err, sails) {
  if (err) return console.error(err);

  function addAgencyDomain (cb) {
    var agencyName = 'General Services Administration (GSA)';
    var agencyTag = {
      type: 'agency',
      name: agencyName,
      data: {
        domain: ['gsa.gov'],
        abbr: 'GSA'
      }
    };


    TagEntity.findOne({name: agencyName})
    .exec(function(err, tagEntity) {
      if (err) return cb(err);
      console.log('tagEntity',tagEntity);
      if (tagEntity) {
        console.log('Found tag, updating id', tagEntity.id);
        agencyTag.id = tagEntity.id
        console.log('update:', agencyTag);
        TagEntity.update(agencyTag.id, agencyTag)
        .exec(function(err, result) {
          console.log('update called (err result)', err, result);
          if (err) return cb(err);
          console.log('updated:',result);
          cb(null);
        })
      } else {
        TagEntity.create(agencyTag)
        .exec(function(err, result) {
          if (err) return cb(err);
          console.log('created:',result);
          cb(null);
        })
      }

    });
  }

  addAgencyDomain(function(err) {
    if (err) {
      console.error('Detail tag addition failed');
      console.error('Error:', err);
      return;
    }
    console.log('Detail tag addition successful');
  });
});
