import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/objectWithoutPropertiesLoose";
import _extends from "@babel/runtime/helpers/extends";
import _assertThisInitialized from "@babel/runtime/helpers/assertThisInitialized";
import _inheritsLoose from "@babel/runtime/helpers/inheritsLoose";
import React from 'react';
import { VariableSizeList } from 'react-window';
import Tree, { createTreeComputer } from './Tree';
import { createBasicRecord, getIdByIndex } from './utils';
var computeTree = createTreeComputer({
  createRecord: function createRecord(data, _ref, parent, previousRecord) {
    var recomputeTree = _ref.recomputeTree,
        resetAfterId = _ref.resetAfterId;
    var record = createBasicRecord({
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
export var VariableSizeTree = /*#__PURE__*/function (_Tree) {
  _inheritsLoose(VariableSizeTree, _Tree);

  function VariableSizeTree(props, context) {
    var _this;

    _this = _Tree.call(this, props, context) || this;
    _this.getItemSize = _this.getItemSize.bind(_assertThisInitialized(_this));
    _this.state = _extends({}, _this.state, {
      computeTree: computeTree,
      resetAfterId: _this.resetAfterId.bind(_assertThisInitialized(_this))
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
        rest = _objectWithoutPropertiesLoose(_this$props, ["children", "placeholder", "itemSize", "rowComponent", "treeWalker"]);

    var _this$state2 = this.state,
        attachRefs = _this$state2.attachRefs,
        order = _this$state2.order;
    return placeholder && order.length === 0 ? placeholder : /*#__PURE__*/React.createElement(VariableSizeList, Object.assign({}, rest, {
      itemCount: order.length,
      itemData: this.getItemData() // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      itemKey: getIdByIndex // eslint-disable-next-line @typescript-eslint/unbound-method
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
}(Tree);