import React from 'react';
import { FixedSizeList } from 'react-window';
import Tree, { createTreeComputer } from './Tree';
import { createBasicRecord, getIdByIndex } from './utils';
const computeTree = createTreeComputer({
  createRecord: (data, {
    recomputeTree
  }, parent, previousRecord) => createBasicRecord({
    data,
    isOpen: previousRecord ? previousRecord.public.isOpen : data.isOpenByDefault,
    setOpen: state => recomputeTree({
      [data.id]: state
    })
  }, parent)
});
export class FixedSizeTree extends Tree {
  constructor(props, context) {
    super(props, context);
    this.state = { ...this.state,
      computeTree
    };
  }

  render() {
    const {
      children,
      listRef,
      placeholder,
      treeWalker,
      rowComponent,
      ...rest
    } = this.props;
    const {
      attachRefs,
      order
    } = this.state;
    return placeholder && order.length === 0 ? placeholder : /*#__PURE__*/React.createElement(FixedSizeList, Object.assign({}, rest, {
      itemCount: order.length,
      itemData: this.getItemData() // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      itemKey: getIdByIndex // eslint-disable-next-line @typescript-eslint/unbound-method
      ,
      ref: attachRefs
    }), rowComponent);
  }

}