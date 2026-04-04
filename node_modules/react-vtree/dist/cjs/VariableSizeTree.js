"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.VariableSizeTree = void 0;

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _react = _interopRequireDefault(require("react"));

var _reactWindow = require("react-window");

var _Tree2 = _interopRequireWildcard(require("./Tree"));

var _utils = require("./utils");

var computeTree = (0, _Tree2.createTreeComputer)({
  createRecord: function createRecord(data, _ref, parent, previousRecord) {
    var recomputeTree = _ref.recomputeTree,
        resetAfterId = _ref.resetAfterId;
    var record = (0, _utils.createBasicRecord)({
      data: data,
      height: previousRecord ? previousRecord.public.height : data.defaultHeight,
      isOpen: previousRecord ? previousRecord.public.isOpen : data.isOpenByDefault,
      resize: function resize(height, shouldForceUpdate) {
        record.public.height = height;
        resetAfterId(record.public.data.id, shouldForceUpdate);
      },
      setOpen: function setOpen(state) {
        var _recomputeTree;

        return recomputeTree((_recomputeTree = {}, _recomputeTree[data.id] = state, _recomputeTree));
      }
    }, parent);
    return record;
  }
});

var VariableSizeTree = /*#__PURE__*/function (_Tree) {
  (0, _inheritsLoose2.default)(VariableSizeTree, _Tree);

  function VariableSizeTree(props, context) {
    var _this;

    _this = _Tree.call(this, props, context) || this;
    _this.getItemSize = _this.getItemSize.bind((0, _assertThisInitialized2.default)(_this));
    _this.state = (0, _extends2.default)({}, _this.state, {
      computeTree: computeTree,
      resetAfterId: _this.resetAfterId.bind((0, _assertThisInitialized2.default)(_this))
    });
    return _this;
  }

  var _proto = VariableSizeTree.prototype;

  _proto.resetAfterId = function resetAfterId(id, shouldForceUpdate) {
    var _list$current;

    if (shouldForceUpdate === void 0) {
      shouldForceUpdate = false;
    }

    var _this$state = this.state,
        list = _this$state.list,
        order = _this$state.order;
    (_list$current = list.current) == null ? void 0 : _list$current.resetAfterIndex(order.indexOf(id), shouldForceUpdate);
  };

  _proto.recomputeTree = function recomputeTree(state) {
    var _this2 = this;

    return _Tree.prototype.recomputeTree.call(this, state).then(function () {
      var _this2$state$list$cur;

      (_this2$state$list$cur = _this2.state.list.current) == null ? void 0 : _this2$state$list$cur.resetAfterIndex(0, true);
    });
  };

  _proto.render = function render() {
    var _this$props = this.props,
        children = _this$props.children,
        placeholder = _this$props.placeholder,
        itemSize = _this$props.itemSize,
        rowComponent = _this$props.rowComponent,
        treeWalker = _this$props.treeWalker,
        rest = (0, _objectWithoutPropertiesLoose2.default)(_this$props, ["children", "placeholder", "itemSize", "rowComponent", "treeWalker"]);
    var _this$state2 = this.state,
        attachRefs = _this$state2.attachRefs,
        order = _this$state2.order;
    return placeholder && order.length === 0 ? placeholder : /*#__PURE__*/_react.default.createElement(_reactWindow.VariableSizeList, Object.assign({}, rest, {
      itemCount: order.length,
      itemData: this.getItemData() // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      itemKey: _utils.getIdByIndex // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      itemSize: itemSize != null ? itemSize : this.getItemSize // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      ref: attachRefs
    }), rowComponent);
  };

  _proto.getItemSize = function getItemSize(index) {
    return this.getRecordData(index).height;
  };

  return VariableSizeTree;
}(_Tree2.default);

exports.VariableSizeTree = VariableSizeTree;