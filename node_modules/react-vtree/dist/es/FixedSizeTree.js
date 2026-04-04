import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import _extends from "@babel/runtime/helpers/extends";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import React from 'react';
import { FixedSizeList } from 'react-window';
import Tree, { createTreeComputer } from './Tree';
import { createBasicRecord, getIdByIndex } from './utils';
var computeTree = createTreeComputer({
  createRecord: function createRecord(data, _ref, parent, previousRecord) {
    var recomputeTree = _ref.recomputeTree;
    return createBasicRecord({
      data: data,
      isOpen: previousRecord ? previousRecord.public.isOpen : data.isOpenByDefault,
      setOpen: function setOpen(state) {
        var _recomputeTree;

        return recomputeTree((_recomputeTree = {}, _recomputeTree[data.id] = state, _recomputeTree));
      }
    }, parent);
  }
});
export var FixedSizeTree = /*#__PURE__*/function (_Tree) {
  _inheritsLoose(FixedSizeTree, _Tree);

  function FixedSizeTree(props, context) {
    var _this;

    _this = _Tree.call(this, props, context) || this;
    _this.state = _extends({}, _this.state, {
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
        rest = _objectWithoutPropertiesLoose(_this$props, ["children", "listRef", "placeholder", "treeWalker", "rowComponent"]);

    var _this$state = this.state,
        attachRefs = _this$state.attachRefs,
        order = _this$state.order;
    return placeholder && order.length === 0 ? placeholder : /*#__PURE__*/React.createElement(FixedSizeList, Object.assign({}, rest, {
      itemCount: order.length,
      itemData: this.getItemData() // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      itemKey: getIdByIndex // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      ref: attachRefs
    }), rowComponent);
  };

  return FixedSizeTree;
}(Tree);