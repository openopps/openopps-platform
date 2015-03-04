/**
 * SearchController
 *
 * @module		:: Controller
 * @description	:: Performs search functions for the front end
 */

var _ = require('underscore');
var async = require('async');
var projUtil = require('../services/utils/project');
var taskUtil = require('../services/utils/task');
var tagUtil = require('../services/utils/tag');

function search(target, req, res){
  //builds an array of task/project ids where search terms were found
  //   returns task / project(+counts) objects which are rendered by the calling page as cards
  //   search terms are ANDed
  //      if you put in foo and bar, only results with BOTH will return

  var results    = [];
  var masterList = [];

  var modelProxy = null;
  if ( target == 'tasks' ){
    modelProxy=Task;
    modelWord = 'task';
  } else {
    modelProxy=Project;
    modelWord='project';
  }

  // make the query well formed
  var q = req.body;
  q.freeText = q.freeText || [];
  q.user = q.user || [];

  var stateSearch = function (search,cb) {

    if ( search.length > 0 ) {

      var states = [];

      _.each(search,function(term){
        if ( term == 'draft' ){
          states.push({ state: 'draft',userId: q.user });
        } else {
          states.push({ state: term});
        }
      });

      modelProxy.find({
        or: states
      })
      .exec(function (err,data){
        if ( _.isNull(data) ) { cb(); }
          var temp = _.map(data,function(item,key){
          return item.id;
        });
        masterList.push.apply(masterList,temp);
        cb();
      });
    } else {
      cb();
    }
  };

  var freeTextSearch = function (search,cb) {

    if ( search.length > 0 ) {
      modelProxy.find({
        or :[
          { title: { 'contains': search}},
          { description: { 'contains': search}}
        ]
      })
      .exec(function(err,data){
        if ( _.isNull(data) ) { cb(); }
        var temp = _.map(data,function(item,key){
          return item.id;
        });
        results.push.apply(results,temp);
        cb();
      });
    } else {
      cb();
    }
  };

  var tagSearch = function (search, cb) {

    var tags = [];

    if ( search.length > 0 ) {

      _.each(search,function(term){
        tags.push({ name: {'contains': term}});
      });

      TagEntity.find({
        or: tags
      })
      .exec(function(err,data){
        if ( _.isNull(data) ) { cb(); }
        var temp = _.map(data,function(item,key){
          return item.id;
        });
        Tag.find({tagId: temp})
          .exec(function(err,foundTags){
            _.each(foundTags,function(tag,key){
              if ( target == 'tasks'){
                if ( !_.isNull(tag.taskId) ){
                  results.push(tag.taskId);
                }
              } else {
                if ( !_.isNull(tag.projectId) ){
                  results.push(tag.projectId);
                }
              }
            });
          cb();
        });
      });
    } else {
      cb();
    }
  };

  async.series([
    function(callback){
      stateSearch(q.state,function(err){
        //we're don't care about the callback behavior here, so discard it
        callback(null,'one');
      });
    },
    function(callback){
      freeTextSearch(q.freeText,function(err){
        //we're don't care about the callback behavior here, so discard it
        callback(null,'two');
      });
    },
    function(callback){
      tagSearch(q.freeText,function(err){
        //we're don't care about the callback behavior here, so discard it
        callback(null,'three');
      });
    }],
    function(err,trash){
    var items,finalResults = [];

    //de-dupe
    results = _.uniq(results);
    masterList = _.uniq(masterList);

    if ( (q.freeText.length > 0 && q.state.length > 0) && (masterList.length > 0 && results.length > 0) ){
      //user attempted a search of both text/tag & states, need results in both to display anything
      //   use the intersection of the two sets
      finalResults = _.intersection(results,masterList);
    } else if ( (q.freeText.length == 0 && q.state.length > 0) && masterList.length > 0 ) {
      //user attempted a state search with no text/tag search, results in masterList to display anything
      //    just use the masterList
      finalResults = masterList;
    } else if ( (q.freeText.length > 0 && q.state.length == 0) && results.length > 0 ) {
      //user attempted a text/tag search with no state filter, results in results to display anything
      //    just use results
      finalResults = results;
    }

    if ( target == 'tasks' ){
      taskUtil.findTasks({id:finalResults}, function (err, items) {
        if ( _.isNull(items) ){
          res.send([]);
        } else {
          res.send(items);
        }
      });
    } else {
      var items = [];
      //this each is required so we can add the counts which are need for project cards only
      async.each(finalResults,
        function(id,fcb){
          Project.findOneById(id,function(err,proj){
            projUtil.addCounts(proj, function (err) {
              items.push(proj);
              fcb();
            });
          });
        },
        function(err){
          if ( _.isNull(items) ){
            res.send([]);
          } else {
            res.send(items);
          }
        });
    }
  });
};

module.exports = {

  index: function (req, res) {
    if (!req.body) {
      return res.send(400, { message: 'Need data to query' });
    }
    if ((req.body.target == 'projects') || (req.body.target == 'tasks')) {
      return search(req.body.target, req, res);
    }
    return res.send([]);
  },

};
