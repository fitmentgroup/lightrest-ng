

describe('lightrest', function() {
	beforeEach(module('lightrest'));
  describe('lightrest', function() {
		var scope, httpBackend, peopleApi, people, _lightrest;
    beforeEach(inject(function (lightrest, $httpBackend) {
    	_lightrest = lightrest;
      people = [
        {Id: 0, Name: 'Albert'},
        {Id: 1, Name: 'John'},
        {Id: 2, Name: 'Mike'},
        {Id: 3, Name: 'Steve'},
        {Id: 4, Name: 'Luke'},
        {Id: 5, Name: 'James'},
        {Id: 6, Name: 'Mark'},
      ];
      var url = '/people';
      var idUrl = '/:Id'
      peopleApi = {
        get: lightrest.build({ url: url + idUrl }, { query: false}),
        getAll: lightrest.build({ url: url }),
        post: lightrest.build({ method: 'post', url: url }),
        delete: lightrest.build({ method: 'delete', url: url + idUrl }),
        deleteMany: lightrest.build({ method: 'delete', url: url + idUrl }, { arrayMode: 'concurrent' }),
        put: lightrest.build({ method: 'put', url: url + idUrl }),
        putMany: lightrest.build({ method: 'put', url: url + idUrl }, { arrayMode: 'sequential' })
      }

      httpBackend = $httpBackend;
      $httpBackend.when("GET", "/api/people").respond(people);
      $httpBackend.whenRoute("GET", "/api/people/:Id")
      .respond(function(method, url, data, headers, params) {
        return [200, people[params.Id]];
      });
      $httpBackend.whenRoute("DELETE", "/api/people/:Id")
      .respond(function(method, url, data, headers, params) {
        var length = people.length;
        for(var i = 0; i < length; i++) {
          var person = people[i];
          if(person.Id == params.Id) {
            people.splice(i, 1);
            break;
          }
        }
        return [200];
      })
      $httpBackend.whenRoute("PUT", "/api/people/:Id")
      .respond(function(method, url, data, headers, params) {
        var length = people.length;
        for(var i = 0; i < length; i++) {
          var person = people[i];
          if(person.Id == params.Id) {
            people[i] = JSON.parse(data);
            break;
          }
        }
        return [200];
      })
    }));

    afterEach(function() { httpBackend.verifyNoOutstandingRequest() });


    it("should throw error if no Id was supplied", function() {
      expect(function() { peopleApi.get() })
      .toThrow(new Error("Url parameter Id was not included in the data"));
      expect(function() { peopleApi.get({Id: ''}) })
      .toThrow(new Error("Url parameter Id was not included in the data"));
      expect(function() {peopleApi.get([{Id: ''}]) })
      .toThrow(new Error("Url parameter Id was not included in the data"));
    })

    it("should single get correctly", function(done) {
      peopleApi.get( {Id: 4} )
      .then(function(res) {
        expect(res.data).toEqual(people[4])
        done();
      })
      httpBackend.flush();
    });

    it("should multi delete correctly", function (done) {
      peopleApi.getAll()
      .then(function(res) {
        expect(res.data.length).toEqual(7);
        return peopleApi.deleteMany([{Id: 5}, {Id: 4}, {Id: 4}])
      })
      .then(function(res) {
        return peopleApi.getAll();
      })
      .then(function(res) {
        expect(res.data.length).toEqual(5);
        done();
      })
      httpBackend.flush();
    });

    it("should not let you multi delete without Id fields set", function() {
      expect(function() {peopleApi.deleteMany([ { Id: 5 }, {}, { Id: 3 } ])})
      .toThrow(new Error("Url parameter Id was not included in the data"));
    })

    it("should not let you multi put without Id fields set", function() {
      expect(function() {peopleApi.putMany([{Id: 5}, {}, {Id: 3}])})
      .toThrow(new Error("Url parameter Id was not included in the data"));
    })

    it("should multi put correctly", function(done) {
      var changed;
      peopleApi.getAll()
      .then(function(res) {
        expect(res.data.length).toEqual(7);
        res.data[3].Name = 'ASDQWE';
        res.data[6].Name = 'rsfdsf';
        changed = res.data;
        return peopleApi.putMany(res.data)
      })
      .then(function(res) {
      	return peopleApi.getAll()
      })
      .then(function(res) {
        expect(res.data).toEqual(changed);
        done();
      })
      httpBackend.flush();
    })

    it("should prepend /api to api.request if it wasn't specified", function() {
    	_lightrest.build({ url: 'people' })()
    	_lightrest.build({ url: '/people' })()
    	_lightrest.build({ url: '/api/people' }, { baseUrl: false })()
    	_lightrest.build({ url: 'api/people' }, { baseUrl: false })()
      httpBackend.flush();
    })
  });
});
