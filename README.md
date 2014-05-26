meteor-webstorm
===============

A converter that takes the [api.json](https://github.com/meteor/meteor/blob/devel/docs/client/api.js) that powers the [Meteor docs site](docs.meteor.com) and converts it into a stub with jsdocs around, for Webstorm to use as a library.

[Inspired by this post](http://youtrack.jetbrains.com/issue/WEB-6264#comment=27-615870)

![Alt text](./img/inline-docs.png =200)

![Alt text](./img/jsdocs.png =200)

Methods converted so far:
* Static methods like `Meteor.isServer`. These are the easiest and there are 
79 of them.

Methods pending conversion:
* Instance methods, these require some fiddling and there are 53 of them.
* Instances set on static objects, should be easy and there are 6.
* Some weird prototype thing of which there's 1.

Other tasks remaining:
* Convert markdown links to JSDocs @link
* Extract return args from description