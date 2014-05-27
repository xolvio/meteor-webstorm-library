var vm = require('vm'),
    _ = require('lodash'),
    _stubs = {},
    _FILENAME = '../meteor-webstorm-library.js',
    DEBUG = false;

require('request')('https://raw.githubusercontent.com//meteor/meteor/devel/docs/client/api.js', function (error, response, body) {
  _parseClientMeteorApi(body);
});

function _parseClientMeteorApi (meteorClientApiFile) {

  _runApiFileInThisContext(meteorClientApiFile);

  var stubFileContent = '';

  stubFileContent += '/**\n';
  stubFileContent += ' * This file has been auto-generated by {@link https://github.com/xolvio/meteor-webstorm}\n';
  stubFileContent += ' */\n';
  stubFileContent += '\n';
  stubFileContent += '/* jshint ignore:start */';
  stubFileContent += '\n';

  _.forIn(Template.api, function (apiDefinition) {
    if (!_isMethod(apiDefinition.name)) return;
    var canonicalName = _removeMarkup(apiDefinition.name);
    if (_startsWithUppercase(canonicalName) && !_methodNameHasMultipleDots(canonicalName)) {
      stubFileContent += _writeClass(canonicalName);
    }
  });

  stubFileContent += '\n';

  _.forIn(Template.api, function (apiDefinition, k) {

    if (!_isMethod(apiDefinition.name)) return;

    var canonicalName = _removeMarkup(apiDefinition.name);

    // Special cases
    canonicalName = canonicalName.replace('env_var', 'Meteor');

    // Available fields:
    // k, v.id, v.name, v.locus, v.args [ { name, type, descr } ]

    // TODO Link markdown in v.descr to meteor's website. eg [EJSON Binary](#ejson_new_binary) >> {@link http://docs.meteor.com/#ejson_new_binary}
    // TODO Split description when "Return" or "Returns" is found in v.descr

    // Static methods, these are the easiest (79 count)
    if (_startsWithUppercase(canonicalName) && !_methodNameHasMultipleDots(canonicalName)) {
      stubFileContent += _writeMethodJSDocs(apiDefinition, canonicalName);
      stubFileContent += _writeMethodSignature(canonicalName);
    }

    // Instances set on static objects (6 count)
    if (_startsWithUppercase(canonicalName) && _methodNameHasMultipleDots(canonicalName)) {

      // special case
      if (canonicalName.indexOf('Accounts.ui.config') !== -1) {
        console.log(_getClassName(canonicalName), _getMethodName(canonicalName));
      }
    }

    // Instance methods, these require some fiddling (53 count)
    if (!_startsWithUppercase(canonicalName) && !_methodNameHasMultipleDots(canonicalName)) {
      // we can use k sometimes (ejsonType, might need to subtract instance name from k)
      // we need prior knowledge sometimes (eg where instance is collection or with env_var)
      // maybe we can use v.id sometimes if above fail
      // maybe we can consume the toc from here: https://github.com/meteor/meteor/blob/devel/docs/client/docs.js#L103
    }

    // Some weird prototype thing (1 count)
    if (!_startsWithUppercase(canonicalName) && _methodNameHasMultipleDots(canonicalName)) {
//        console.log(canonicalName);
    }

  });

  stubFileContent += '/* jshint ignore:end */';

  _writeFileToDisk(_FILENAME, stubFileContent);

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
      parametersEnd = _hasBracket(canonicalName) ? canonicalName.indexOf(')') : 0,
      parameters = canonicalName.substring(parametersStart, parametersEnd);

  if (parameters.indexOf('[') !== -1) {
    parameters = parameters.substring(0, parameters.indexOf('[')).trim();
    if (parameters[parameters.length - 1] === ',') {
      parameters = parameters.substring(0, parameters.length - 1);
    }
  }

  if (parameters.indexOf('...') !== -1) {
    parameters = parameters.substring(0, parameters.indexOf('...')).trim();
    if (parameters[parameters.length - 1] === ',') {
      parameters = parameters.substring(0, parameters.length - 1);
    }
  }

  parameters = parameters.replace('Template.', '');
  parameters = parameters.replace('function', 'func');

  return parameters;
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

function _writeClass (canonicalName) {
  var className = _getClassName(canonicalName);
  if (_stubs[className]) {
    return '';
  }
  _stubs[className] = {};
  return className + ' = ' + className + ' || {};\n';
}

function _writeMethodJSDocs (apiDefinition, canonicalName) {
  var jsDocs = '/** ';
  jsDocs += '\n';
  jsDocs += ' * ' + apiDefinition.descr.join('\n');
  jsDocs += '\n';
  jsDocs += ' *';
  jsDocs += '\n';
  jsDocs += ' * Runs ' + (apiDefinition.locus.indexOf('Anywhere') !== -1 ? '' : 'on ') + apiDefinition.locus;
  jsDocs += '\n';
  jsDocs += ' *';
  jsDocs += '\n';
  jsDocs += ' * @method ' + _getMethodName(canonicalName);
  jsDocs += '\n';
  jsDocs += ' *';
  jsDocs += '\n';
  _.forEach(apiDefinition.args, function (argDetails) {
    var argName = argDetails.name.replace('function', 'func');
    jsDocs += ' * @param {' + argDetails.type + '} ' + argName + ' ' + argDetails.descr;
    jsDocs += '\n';
  });
  jsDocs += ' */';
  return jsDocs;


  // callbacks
  // asyncCallback

  // @param {...*} param
  // @param {...*} [callback]

}

function _writeMethodSignature (canonicalName) {
  var signature = '\n';
  signature += _getClassName(canonicalName) + '.' + _getMethodName(canonicalName) + ' = function(' + _getParameters(canonicalName) + ') {};';
  signature += '\n';
  signature += '\n';
  return signature;
}


function _writeFileToDisk (path, content) {
  if (DEBUG) {
    console.log(content);
    return;
  }
  require('fs').writeFile(path, content, function (err) {
    if (err) {
      console.log(err);
    } else {
      console.log('File written to ' + _FILENAME);
    }
  });
}
