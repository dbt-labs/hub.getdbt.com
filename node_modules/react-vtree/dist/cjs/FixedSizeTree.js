"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.FixedSizeTree = void 0;

var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));

var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));

var _inheritsLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/inheritsLoose"));

var _react = _interopRequireDefault(require("react"));

var _reactWindow = require("react-window");

var _Tree2 = _interopRequireWildcard(require("./Tree"));

var _utils = require("./utils");

var computeTree = (0, _Tree2.createTreeComputer)({
  createRecord: function createRecord(data, _ref, parent, previousRecord) {
    var recomputeTree = _ref.recomputeTree;
    return (0, _utils.createBasicRecord)({
      data: data,
      isOpen: previousRecord ? previousRecord.public.isOpen : data.isOpenByDefault,
      setOpen: function setOpen(state) {
        var _recomputeTree;

        return recomputeTree((_recomputeTree = {}, _recomputeTree[data.id] = state, _recomputeTree));
      }
    }, parent);
  }
});

var FixedSizeTree = /*#__PURE__*/function (_Tree) {
  (0, _inheritsLoose2.default)(FixedSizeTree, _Tree);

  function FixedSizeTree(props, context) {
    var _this;

    _this = _Tree.call(this, props, context) || this;
    _this.state = (0, _extends2.default)({}, _this.state, {
      computeTree: computeTree
    });
    return _this;
  }

  var _proto = FixedSizeTree.prototype;

  _proto.render = function render() {
    var _this$props = this.props,
        children = _this$props.children,
        listRef = _this$props.listRef,
        placeholder = _this$props.placeholder,
        treeWalker = _this$props.treeWalker,
        rowComponent = _this$props.rowComponent,
        rest = (0, _objectWithoutPropertiesLoose2.default)(_this$props, ["children", "listRef", "placeholder", "treeWalker", "rowComponent"]);
    var _this$state = this.state,
        attachRefs = _this$state.attachRefs,
        order = _this$state.order;
    return placeholder && order.length === 0 ? placeholder : /*#__PURE__*/_react.default.createElement(_reactWindow.FixedSizeList, Object.assign({}, rest, {
      itemCount: order.length,
      itemData: this.getItemData() // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      itemKey: _utils.getIdByIndex // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      ref: attachRefs
    }), rowComponent);
  };

  return FixedSizeTree;
}(_Tree2.default);

exports.FixedSizeTree = FixedSizeTree;