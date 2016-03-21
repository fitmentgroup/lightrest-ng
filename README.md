#lightrest-ng

[![Build Status](https://travis-ci.org/fitmentgroup/lightrest-ng.svg?branch=master)](https://travis-ci.org/fitmentgroup/lightrest-ng)

*Sponsored by [fitmentgroup.com](http://fitmentgroup.com)*  
lightrest-ng is an angular REST library as an Angular service. Uses Angular's `$http` service under the hood. No black magic.  
The goals of this library are:
* Be lightweight
* Easy to learn
* Have no behind the curtain stuff, the developer should be in control of what's going on all the time.
* Save time/code (duh!)

#Table of contents

- [Instalation and use](#installation-and-use)
- [API](#api)
- [The right way to use it](#the-right-way-to-use-it)
- [How to contribute](#how-to-contribute)
- [How do I test this?](#how-do-i-test-this)

## Installation and use

Install with bower and reference in html (cdnjs to be added in near future)

````bash
bower install lightrest-ng
````
````html
<script src="<your-bower-dir>/lightrest/dist/lightrest-ng.js"></script>
````

Inject the module of this library in your Angular app:

````javascript
angular.module('<your-module>', ['lightrest'])`
````

Inject the service of this library in your service (please, don't inject it in anything else than a service because it doesn't make sense, always isolate your data layer in services)

````javascript
angular
.module('<your-module>')
.factory('myService', ['lightrest', function(lightrest) {
  ...
});
````
(in case you're confused, remember that the most standard way of creating services is using angular's `factory` method)

To do a simple request you do:
````javascript
    var method = lightrest.build({url: '/countries/1', method: 'PUT'});
    var country = { name: 'Zimbabwe' };
    method({ body: country}); //The request is sent here
````
So, the idea is that you first create and configure the request, and you get a function as a result. That function returned is the configured method.  
The result of `method` is the result of `$http`, and remember that `$http` is a promise/thenable, so to get the result you do:  

````javascript
    method(country).then(function(res) {
        console.log(res.data);
    }
````

**[Back to top](#table-of-contents)**

## API

`lightrest.build(config, options)(data)`

* [config](#config), config object that is passed to angular's $http function.
* [options](#options), options used by lightrest to do some custom work on the requests. They are listed below.
  * [urlApiPrepend](#urlapiprepend)
  * [arrayMode](#arrayMode)
* [data](#data), data sent with the actual request.
  * [query](#query)
  * [body](#body)
  * [urlParams](#urlParams)

### config 
[`object`]

This object is sent untouched (with some exceptions) to the $http.
The exceptions are the `data`, `params`and `url` properties, which are sometimes
modified depending on the properties set in the `options` and `data`objects.
You can read the official documentation of [config properties here](https://docs.angularjs.org/api/ng/service/$http#usage).

### options 
[`object`]

This object is used to do some custom stuff on the requests. The properties considered on this object are these:

1. [urlApiPrepend](#urlapiprepend)
2. [arrayMode](#arraymode)

#### urlApiPrepend 
[`Boolean`]  defaults `true`

When urlApiPrepend is true, it prepends `'/api'` to the url string.
````javascript
lightrest.build({url: '/cars'})
````
By default, the option is true, so this request is sent to `/api/cars`

#### arrayMode 
[`false` `'concurrent'` `'sequential'`] defaults `false`

While arrayMode `false` desactivates this, `'concurrent'` and `'sequential'` does two things:

1. Instead of an array of `data`, it expects an array of it.
2. Runs the requests separately for each element in that array.

For example:
````javascript
var data = [{ body: {name: 'Mike'}}, { body: {name: 'Jimmy'}}];
lightrest.build({url: '/people', method: 'post'}, {arrayMode: 'sequential'}, data);
````
Supposing that the POST method for `/people` creates a person, this sends two requests for that sequentially (one at a time). If arrayMode property was 'concurrent', the request are all sent concurrently.  
The result of a lightrest request on `arrayMode` is the result of angular's `$q.all` with an array of all the `$http` requests done as argument.
The sequential mode doesn't stop if a request fails.

### data 
[```object```]

This is the object used to send data for the actual request. Three properties are taken from this object to specify how will the data be sent: 

1. [query](#query)
2. [body](#body)
3. [urlParams](#urlparams)


#### query 
[```object```]

This property is the value used for the `config.query`. It sets the **query string** of the URL.
````javascript
var fn = lightrest.build(...);
fn({ queryString: { name: 'Mike' }})
````

#### body 
[```object```]

This property is the value used for the `config.data`. It sets the **body** of the request
````javascript
var fn = lightrest.build(...);
fn({ body: { name: 'Mike' }})
````

#### urlParams 
[```object```]

This object is not actually used to send data, but just the case when any part of the `url` maps to a parameter by using the `:` before words.

````javascript
lightrest.build({url: '/cars/:id'})({ urlParams: { id: 1 });
````
... will send a request to `/api/cars/1`

**[Back to top](#table-of-contents)**

## The right way to use it

When a website project starts, there's a usually a single developer doing the API. And even though there are standard ways to design the API's, developers sometimes design it in quirky ways. For example, instead of creating a person by sending a POST request to `/people`, he might (unnecesarily) make it `/people/create`).  

So, what ends up happening is that, the REST methods from different nouns (let's say `/cars`, `/people` and `/shops`) might end up sharing the same quirkiness (for example, you create them the same way: POST requests for `/cars/create`, `/people/create` and `/shops/create`).

So, with lightrest, what you do is this: you create your own rest service that wraps lightrest, and you create your own template for your API:
````javascript
angular
.module('<your-module>')
.factory('rest', ['lightrest', function(lightrest) {
    function template(noun) {
        if (noun[0] != '/') noun = '/' + noun;
        return {
            get: lightrest.build({ url: noun }),
            create: lightrest.build({ url: noun + '/create', method: 'POST'}),
            createMany: lightrest.build({ url: noun + '/create', method: 'POST'}, { array: 'concurrent' }),
            //whatever common methods you need to add here, like delete, put/edit, etc.
        }
    }
    return {
        template: template,
        build: lightrest.build
    }
}])
````

So then, you create a service for each noun, let's create one for people:
````javascript
angular
.module('<your-module>')
.factory('people', ['rest', function(rest) {
    var peopleApi = rest('people');

    //If for some reason, the people api has a method too specific to people to be added to our rest template, we create a custom method just for people
    //Notice that I added the lightrest build method to our rest service so I don't have to reference the lightrest library here.
    peopleApi.updateNationalities = rest.build({
        url: '/people/update-nationalities',
        method: 'PUT'
    }, {} /* Whatever options you want to use */
    );

    return peopleApi;
}]);
````
And so, the quirkiness and particularities are comfortably addressed and handled.


**[Back to top](#table-of-contents)**

## How to contribute

Post whatever feature you would want as an issue, and if it's a good idea, I'll add it.  
I accept pull requests as long as you add the test to the `test.spec.js` file.

**[Back to top](#table-of-contents)**

## How do I test this?

I used karma and gulp for this. To test:  

Clone the project:
````bash
git clone https://github.com/fitmentgroup/lightrest-ng.git
cd lightrest-ng
````
Install dependencies
````bash
npm install -g karma-cli gulp
npm install
bower install
````
Run tests:
````bash
karma start
````

**[Back to top](#table-of-contents)**
