import React from 'react';
import { VariableSizeList } from 'react-window';
import Tree, { createTreeComputer } from './Tree';
import { createBasicRecord, getIdByIndex } from './utils';
const computeTree = createTreeComputer({
  createRecord: (data, {
    recomputeTree,
    resetAfterId
  }, parent, previousRecord) => {
    const record = createBasicRecord({
      data,
      height: previousRecord ? previousRecord.public.height : data.defaultHeight,
      isOpen: previousRecord ? previousRecord.public.isOpen : data.isOpenByDefault,
      resize: (height, shouldForceUpdate) => {
        record.public.height = height;
        resetAfterId(record.public.data.id, shouldForceUpdate);
      },
      setOpen: state => recomputeTree({
        [data.id]: state
      })
    }, parent);
    return record;
  }
});
export class VariableSizeTree extends Tree {
  constructor(props, context) {
    super(props, context);
    this.getItemSize = this.getItemSize.bind(this);
    this.state = { ...this.state,
      computeTree,
      resetAfterId: this.resetAfterId.bind(this)
    };
  }

  resetAfterId(id, shouldForceUpdate = false) {
    var _list$current;

    const {
      list,
      order
    } = this.state;
    (_list$current = list.current) == null ? void 0 : _list$current.resetAfterIndex(order.indexOf(id), shouldForceUpdate);
  }

  recomputeTree(state) {
    return super.recomputeTree(state).then(() => {
      var _this$state$list$curr;

      (_this$state$list$curr = this.state.list.current) == null ? void 0 : _this$state$list$curr.resetAfterIndex(0, true);
    });
  }

  render() {
    const {
      children,
      placeholder,
      itemSize,
      rowComponent,
      treeWalker,
      ...rest
    } = this.props;
    const {
      attachRefs,
      order
    } = this.state;
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
  }

  getItemSize(index) {
    return this.getRecordData(index).height;
  }

}