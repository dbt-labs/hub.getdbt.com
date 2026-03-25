"use strict";

exports.__esModule = true;
exports.getIdByIndex = exports.createBasicRecord = exports.identity = exports.noop = void 0;

// eslint-disable-next-line @typescript-eslint/no-empty-function
var noop = function noop() {};

exports.noop = noop;

var identity = function identity(value) {
  return value;
};

exports.identity = identity;

var createBasicRecord = function createBasicRecord(pub, parent) {
  if (parent === void 0) {
    parent = null;
  }

  return {
    child: null,
    isShown: parent ? parent.public.isOpen && parent.isShown : true,
    parent: parent,
    public: pub,
    sibling: null,
    visited: false
  };
};

exports.createBasicRecord = createBasicRecord;

var getIdByIndex = function getIdByIndex(index, _ref) {
  var getRecordData = _ref.getRecordData;

  var _getRecordData = getRecordData(index),
      id = _getRecordData.data.id;

  return id;
};

exports.getIdByIndex = getIdByIndex;