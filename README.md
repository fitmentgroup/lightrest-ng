#lightrest-ng

[![Build Status](https://travis-ci.org/fitmentgroup/lightrest-ng.svg?branch=master)](https://travis-ci.org/fitmentgroup/lightrest-ng)

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

To do a simple request you it this way:
````javascript
    var method = lightrest.build({url: '/countries/1', method: 'PUT'});
    var country = { name: 'Zimbabwe' };
    method(country); //The request is sent here
````
So, the idea is that you first create and configure the request, and you get a function as a result. That function returned is the configured method.  
Remember that $http is a promise/thenable, so to get the result you do:  

````javascript
    method(country).then(function(res) {
        console.log(res.data);
    }
````

**[Back to top](#table-of-contents)**

## API

`lightrest.build(config, options)`

* [config](#config-object) {object}: config object that is passed to angular's $http function.
* [options](#options-object) {object, optional}: options used by lightrest to do some crazy stuff. They are listed below.
* *returns* {function(data)}: request function. The data overwrites the data property in the config object. If the [url has parameters](#url-parameters), then they are replaced with data's corresponding properties. The result of this function is the result of the $http call.  

### config object

This object is sent unmodified to the $http (with the exception of the data, which is sent later, when running the returned `function(data)`). You can read the documentation of (config properties here)[https://docs.angularjs.org/api/ng/service/$http#usage].

### options object
 
| option                                   | values                      | default     | description  |
|:-----------------------------------------|:----------------------------|:------------|:-----------|
| [urlApiPrepend](#urlapiprepend-option)   | `Boolean`                   | `true`      | If true, prepend `'/api'` to the string |
| [dataField](#datafield-option)           | `string`                    | `undefined` | If dataField is set, only send the specified property value of data as data
| [array](#array-option)                   | `'concurrent' 'sequential'` | `undefined` | array mode lets you receive an array from data, and send the request once with each element of the original data array as data. 'concurrent' sends all of the requests at once, 'sequential' sends them sequentially.


#### urlApiPrepend option

````javascript
lightrest.build({url: '/cars'})
````
By default, the option is true, so this request is sent to '/api/cars'

#### dataField option

````javascript
var data = { person: { name: 'John' } };
lightrest.build({url: '/people/1', method: 'put'}, {dataField: 'person'}, data);
````
This will send the request with `{ name: 'John' }` as data instead of `{ person: { name: 'John'} }`.

#### array option

````javascript
var data = [{name: 'Mike'}, {name: 'Jimmy'}];
lightrest.build({url: '/people', method: 'post'}, {array: 'sequential'}, data);
````
Supposing that the POST method for `/people` creates a person, this sends two requests for that sequentially (one at a time). If array property was 'concurrent', the request are all sent concurrently.  
The sequential mode doesn't stop if a request fails.

### Url parameters

If any part of the url is preceeded by a colon, it is parsed as a url parameter, for example:
````javascript
var car = { id: 1 };
lightrest.build({url: '/cars/:id'})(car);
````
will send a request to `/api/cars/1`

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
    
    //If for some reason, the people api has a method too specific to it to be added to our rest template, we create a custom method for people
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

I used karma and gulp for this. To test it, do this:  

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
