// eslint-disable-next-line @typescript-eslint/no-empty-function
export var noop = function noop() {};
export var identity = function identity(value) {
  return value;
};
export var createBasicRecord = function createBasicRecord(pub, parent) {
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
export var getIdByIndex = function getIdByIndex(index, _ref) {
  var getRecordData = _ref.getRecordData;

  var _getRecordData = getRecordData(index),
      id = _getRecordData.data.id;

  return id;
};