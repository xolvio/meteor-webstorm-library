var https = require('https'),
    vm = require('vm'),
    _ = require('lodash');

var request = require('request');

request('https://raw.githubusercontent.com//meteor/meteor/devel/docs/client/api.js', function (error, response, body) {
  _parseClientMeteorApi(body);
});

function _parseClientMeteorApi (meteorClientApiFile) {

  _runApiFileInThisContext(meteorClientApiFile);

  _.forIn(Template.api, function (v, k) {

    if (!_isMethod(v.name)) return;

    var canonicalName = _removeMarkup(v.name);

    // Available fields:
    // k, v.id, v.name, v.locus, v.args [ { name, type, descr } ]

    // TODO Link markdown in v.descr to meteor's website. eg [EJSON Binary](#ejson_new_binary) >> {@link http://docs.meteor.com/#ejson_new_binary}
    // TODO Split description when "Return" or "Returns" is found in v.descr

    // Static methods, these are the easiest (79 count)
    if (_startsWithUppercase(canonicalName) && !_methodNameHasMultipleDots(canonicalName)) {

      var build = '';
      build += '/** ';
      build += '\n';
      build += ' * ' + v.descr.join('\n');
      build += '\n';
      build += ' *';
      build += '\n';
      build += ' * Runs ' + (v.locus.indexOf('Anywhere') !== -1 ? '' : 'on ') + v.locus;
      build += '\n';
      build += ' *';
      build += '\n';
      build += ' * @method ' + _getMethodName(canonicalName);
      build += '\n';
      build += ' *';
      build += '\n';
      _.forEach(v.args, function(argDetails) {
        build += ' * @param {' + argDetails.type + '} ' + argDetails.name + ' ' + argDetails.descr;
        build += '\n';
      });
      build += ' */';
      build += '\n';
      build += _getClassName(canonicalName) + '.' + _getMethodName(canonicalName) + ' = function(' + _getParameters(canonicalName) + ') { }';
      build += '\n';
      console.log(build);

    }

    // Instance methods, these require some fiddling (53 count)
    if (!_startsWithUppercase(canonicalName) && !_methodNameHasMultipleDots(canonicalName)) {
      // we can use k sometimes (ejsonType, might need to subtract instance name from k)
      // we need prior knowledge sometimes (eg where instance is collection or with env_var)
      // maybe we can use v.id sometimes if above fail
      // maybe we can consume the toc from here: https://github.com/meteor/meteor/blob/devel/docs/client/docs.js#L103
    }

    // Instances set on static objects, should be easy (6 count)
    if (_startsWithUppercase(canonicalName) && _methodNameHasMultipleDots(canonicalName)) {
//        console.log(canonicalName);
    }

    // Some weird prototype thing (1 count)
    if (!_startsWithUppercase(canonicalName) && _methodNameHasMultipleDots(canonicalName)) {
//        console.log(canonicalName);
    }

  });
}

function _runApiFileInThisContext (meteorClientApiFile) {
  vm.runInThisContext("Template = { api: {} }; Meteor = {};" + meteorClientApiFile);
}

function _hasBracket (str) {
  return str.indexOf('(') !== -1;
}

function _getClassName (canonicalName) {
  return canonicalName.substring(0, canonicalName.indexOf('.'))
}

function _getMethodName (canonicalName) {
  var methodNameStart = _getClassName(canonicalName).length + 1,
      methodNameEnd = _hasBracket(canonicalName) ? canonicalName.indexOf('(') : canonicalName.length;
  return canonicalName.substring(methodNameStart, methodNameEnd);
}

function _getParameters (canonicalName) {
  var parametersStart = _hasBracket(canonicalName) ? canonicalName.indexOf('(') + 1 : 0,
      parametersEnd = _hasBracket(canonicalName) ? canonicalName.indexOf(')') : 0;
  return canonicalName.substring(parametersStart, parametersEnd);
}

function _methodNameHasMultipleDots (name) {
  if (name.indexOf('(') !== -1) {
    name = name.substring(0, name.indexOf('('));
  }
  return name.match(/\./g).length > 1;

}

function _startsWithUppercase (name) {
  return name[0] === name[0].toUpperCase();
}

function _isMethod (canonicalName) {
  return canonicalName.indexOf('.') !== -1;
}

function _removeMarkup (canonicalName) {
  _.each(['<em>', '</em>', '<i>', '</i>'], function (str) {
    canonicalName = canonicalName.replace(str, '');
  });
  return canonicalName;
}


